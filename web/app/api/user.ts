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
  cookies().set(name, '', {
    domain: '.takin.ai', // 确保跨子域名的cookie
    path: '/', // 确保路径正确
    expires: new Date(0), // 设置过期时间为过去的时间点
    secure: true, // 如果在 HTTPS 环境下
    httpOnly: true, // 如果需要httpOnly属性
  })
}

export function getCookie(name: string) {
  return cookies().get(name)?.value
}
