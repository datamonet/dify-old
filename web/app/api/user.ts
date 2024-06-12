'use server'
import { cookies } from 'next/headers'
import clientPromise from '@/service/mongo'

type MongoUser = {
  _id: string
  name: string
  email: string
  avatar: string
  credits: number
} | null

/**
 * 获取用户信息
 * @param email
 */
export async function getUserInfo(email: string) {
  const userCollection = (await clientPromise)
    .db(process.env.MONGODB_NAME)
    .collection('users')

  const user = await userCollection.findOne({ email })

  return (user ? { ...user, _id: user._id.toString(), credits: user.subscription_credits || 0 + user.extra_credits || 0 } : user) as MongoUser
}

export async function deleteCookie(name: string) {
  cookies().set(name, '')
}
