'use server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/service/mongo'
import type { NodeTracing } from '@/types/workflow'

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
 * 根据总token数，更新用户积分,并且在bill表中记录消费
 * @param userId 用户的mongo id
 * @param totalToken workflow只有总消耗的token数量
 * @param type 消费类型
 * @param metadata 消费的元数据
 */
export async function updateUserCreditsWithTotalToken(userId: string, totalToken: number, type: string, metadata: any) {
  // workflow只有总消耗的token数量，默认全部使用gpt-40的output价格计算（$15.00 用于 1M tokens）
  const USD = totalToken * 0.000015
  return await updateUserCreditsWithUSD(userId, USD, type, metadata)
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
      switch (trace.title) {
        case 'dalle':
          cost += 0.12
          break
        default:
          break
      }
    }
  }
  console.log(cost)
  return await updateUserCreditsWithUSD(userId, cost, 'Dify Workflow', metadata)
}
