'use server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/service/mongo'

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
  // USD转换为credits，$1=100credits， Takin加价，Takin系数为2
  const cost = USD * 100 * 2
  let totalCost = cost

  let subscriptionCredits = userInfo?.subscription_credits as number || 0 // 用户订阅的积分
  let extraCredits = userInfo?.extra_credits as number || 0 // 用户充值的积分，如果用户没有订阅，那么该积分冻结

  // 保证最低消费为0.01
  if (totalCost < 0.01)
    totalCost = 0.01
  else totalCost = Number(totalCost.toFixed(2)) // 保留一位小数四舍五入

  if (subscriptionCredits >= totalCost) {
    subscriptionCredits -= totalCost // 如果用户有订阅积分，那么优先消耗订阅积分
  }
  else {
    // 如果用户订阅积分不足，那么消耗充值积分
    totalCost -= subscriptionCredits // 先减去用户还剩下的订阅积分
    subscriptionCredits = 0
    extraCredits = Math.max(extraCredits - totalCost, 0) // 使用充值的其余积分补足
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
