'use server'
import { ObjectId } from 'mongodb'
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import clientPromise from '@/service/mongo'
import type { NodeTracing } from '@/types/workflow'
import type { ChatItem } from '@/app/components/base/chat/types'
import type { ToolItem } from '@/types/app'

export async function emailAWS({
  address,
  data,
  subject,
}: {
  address: string[]
  data: string
  subject: string
}) {
  const client = new SESClient([{
    region: 'eu-north-1',
    credentials: {
      accessKeyId: process.env.EMAIL_ACCESS_KEY_ID,
      secretAccessKey: process.env.EMAIL_SECRET_ACCESS_KEY,
    },
  }])

  const command = new SendEmailCommand({
    Source: 'noreply@takin.ai',
    Destination: {
      ToAddresses: address,
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: data,
        },
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject,
      },
    },
  })
  try {
    return await client.send(command)
  }
  catch (e) {
    console.error(e)
    return e
  }
}

// --------------------------------------------------关于Takin.AI的扣费逻辑解析 start----------------------------------------------------------------------
/**
 * 积分主要分为subscription_credits，extra_credits。所有的消耗都优先extra_credits
 * 📌📌📌所有情况下，extra_credits都可以可以使用。只是free用户无法购买
 * free用户只能升级plan【或者加入了某个team，有人转账】来增加积分，无法购买extra_credits
 * 付费用户可以购买plan以及extra_credits，一旦停止订阅后，subscription_credits到期后清空，extra_credits还可以使用
 * Team的转账默认是优先extra_credits转到extra_credits
 */
// --------------------------------------------------关于Takin.AI的扣费逻辑解析 end----------------------------------------------------------------------

/**
 * 更新用户积分,并且在bill表中记录消费
 * @param userId 用户的mongo id
 * @param USD 消耗的总金额，单位为美元（包括了输入输出的Token）
 * @param type 消费类型
 * @param metadata 消费的元数据
 */
export async function updateUserCreditsWithUSD(userId: string, USD: number, type: string, metadata: any) {
  const userCollection = (await clientPromise)
    .db(process.env.MONGODB_NAME)
    .collection('users')
  const billCollection = (await clientPromise)
    .db(process.env.MONGODB_NAME)
    .collection('bill')

  const userInfo = await userCollection.findOne({ _id: new ObjectId(userId) })
  // USD转换为credits，$1=100credits， Takin加价，Takin系数为1.5
  const cost = USD * 100 * 1.5
  let totalCost = cost

  let subscriptionCredits = userInfo?.subscription_credits as number || 0 // 用户订阅的积分
  let extraCredits = userInfo?.extra_credits as number || 0 // 用户充值的积分，如果用户没有订阅，那么该积分冻结

  // 保证最低消费为0.01
  if (totalCost < 0.01)
    totalCost = 0.01
  else totalCost = Number(totalCost.toFixed(2)) // 保留一位小数四舍五入

  if (extraCredits >= totalCost) {
    extraCredits -= totalCost // 如果用户有extraCredits，那么优先消耗extraCredits
  }

  else {
    // 如果用户extraCredits不足，那么消耗subscriptionCredits
    totalCost -= extraCredits // 先减去用户还剩下的extraCredits
    extraCredits = 0
    subscriptionCredits = Math.max(subscriptionCredits - totalCost, 0) // 使用subscriptionCredits补足
  }

  await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        subscription_credits: subscriptionCredits,
        extra_credits: extraCredits,
      },
    },
  )

  await billCollection.insertOne(
    {
      userId,
      type,
      metadata,
      cost,
      createdAt: Date.now(),
    },
  )

  return cost
}

/**
 * 根据信息判断agent是否使用了tool，并计算额外的扣费
 * @param responseItem 用户的mongo id
 * @returns totalCost额外工具的扣费
 */
export async function updateUSDWithAgentTool(responseItem: ChatItem, agentTools: ToolItem[]) {
  console.log('responseItem', responseItem)
  const tools = responseItem.agent_thoughts?.map(thought => thought.tool)
  // 根据用户生成的图片数量进行扣费
  const messageFilesMap = (responseItem.agent_thoughts || []).reduce((map, thought) => {
    if (thought.tool)
      map[thought.tool] = (thought.message_files || []).length

    return map
  }, {} as Record<string, number>)

  // Calculate the total USD cost
  const totalCost = tools?.reduce((acc, toolName) => {
    // Find the corresponding agentTool
    const agentTool = agentTools.find(at => at.tool_name === toolName)

    if (agentTool) {
      console.log('toolName', agentTool)
      switch (toolName) {
        case 'takin_dalle3':
          // eslint-disable-next-line no-case-declarations
          const { size: dalle3Size, n: dalle3N, quality } = agentTool.tool_parameters
          // eslint-disable-next-line no-case-declarations
          const dalle3Pricing = (() => {
            switch (dalle3Size) {
              case 'square':
                return quality === 'standard' ? 0.040 : 0.080 // 0.040 for standard, 0.080 for HD
              case 'vertical':
              case 'horizontal':
                return quality === 'standard' ? 0.080 : 0.120 // 0.080 for standard, 0.120 for HD
              default:
                return 0.120 // Default value if size is unknown
            }
          })()
          return acc + dalle3Pricing * parseFloat(dalle3N || 1)
        case 'takin_dalle2':
          // eslint-disable-next-line no-case-declarations
          const { size: dalle2Size, n: dalle2N } = agentTool.tool_parameters
          // eslint-disable-next-line no-case-declarations
          const dalle2Pricing = (() => {
            switch (dalle2Size) {
              case 'large':
                return 0.020
              case 'medium':
                return 0.018
              case 'small':
                return 0.016
              default:
                return 0.020 // Default value if size is unknown
            }
          })()
          return acc + dalle2Pricing * parseFloat(dalle2N || 1)
        case 'flux_dev':
        case 'flux_schnell':
          // eslint-disable-next-line no-case-declarations
          const fluxCost = 0.003 * (messageFilesMap[toolName] || 1) // 根据用户生成的图片数量进行扣费，默认一张
          acc += fluxCost
          break
        case 'flux_pro':
          // eslint-disable-next-line no-case-declarations
          const fluxProCost = 0.055 * (messageFilesMap[toolName] || 1)
          acc += fluxProCost
          break
        case 'google_search':
          acc += 0.015
          break
        case 'send_email':
          // eslint-disable-next-line no-case-declarations
          const emails = agentTool.tool_parameters.to_email.split(',').flatMap((part: string) => part.split('，').map(email => email.trim()))
          // 获取 emails 的长度
          acc += 0.00008 * (emails.length || 1)
          break
        default:
          return acc + 0
      }
    }

    return acc
  }, 0)
  console.log('agent totalCost', totalCost)
  return totalCost || 0
}

/**
 * 根据总token数，更新用户积分,并且在bill表中记录消费
 * @param userId 用户的mongo id
 * @param tracing workflow 消耗数据
 * @param metadata 消费的元数据
 */
export async function updateUserCreditsWithTracing(userId: string, tracing: NodeTracing[], metadata: any) {
  let cost = 0

  for (const trace of tracing) {
    if (trace.node_type === 'llm' && trace.status === 'succeeded') {
      console.log('llm', trace.outputs.usage.total_price)
      cost += parseFloat(trace.outputs.usage.total_price)
    }

    else if (trace.node_type === 'parameter-extractor' && trace.status === 'succeeded') {
      console.log('parameter-extractor', trace.process_data.usage.total_price)
      cost += parseFloat(trace.process_data.usage.total_price)
    }

    else if (trace.node_type === 'question-classifier' && trace.status === 'succeeded') {
      console.log('classifier', trace.process_data.usage.total_price)
      cost += parseFloat(trace.process_data.usage.total_price)
    }

    else if (trace.node_type === 'tool') {
      console.log('trace.node_type ', trace.title)
      switch (trace.title) {
        case 'DALL-E 3':
          // eslint-disable-next-line no-case-declarations
          const { size: dalle3Size, n: dalle3N, quality } = trace.outputs.json[0]
          // eslint-disable-next-line no-case-declarations
          const dalle3Pricing = (() => {
            switch (dalle3Size) {
              case '1024×1024':
                return quality === 'standard' ? 0.040 : 0.080 // 0.040 for standard, 0.080 for HD
              case '1024×1792':
              case '1792×1024':
                return quality === 'standard' ? 0.080 : 0.120 // 0.080 for standard, 0.120 for HD
              default:
                return 0.120 // Default value if size is unknown
            }
          })()
          cost += dalle3Pricing * parseFloat(dalle3N || 1)
          break

        case 'DALL-E 2':
          // eslint-disable-next-line no-case-declarations
          const { size: dalle2Size, n: dalle2N } = trace.outputs.json[0]
          // eslint-disable-next-line no-case-declarations
          const dalle2Pricing = (() => {
            switch (dalle2Size) {
              case '1024×1024':
                return 0.020
              case '512×512':
                return 0.018
              case '256×256':
                return 0.016
              default:
                return 0.020 // Default value if size is unknown
            }
          })()
          cost += dalle2Pricing * parseFloat(dalle2N || 1)
          break
        case 'FLUX DEV':
        case 'FLUX SCHNELL':
          // eslint-disable-next-line no-case-declarations
          const fluxCost = 0.003 * (trace.outputs.json.length || 1)
          cost += fluxCost
          break
        case 'FLUX PRO':
          // eslint-disable-next-line no-case-declarations
          const fluxProCost = 0.055 * (trace.outputs.json.length || 1)
          cost += fluxProCost
          break
        case 'GoogleSearch':
        case '谷歌搜索':
          cost += 0.015
          break
        case 'SendEmail':
          cost += 0.0007 * (trace.outputs.json[0].count || 1)
          break
        default:
          break
      }
    }
  }
  console.log(cost)
  return await updateUserCreditsWithUSD(userId, cost, 'Dify Workflow', metadata)
}
