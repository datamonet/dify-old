'use client'

import { SWRConfig } from 'swr'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/app/api/user'

type SwrInitorProps = {
  children: ReactNode
  token?: string
}
const SwrInitor = ({ children, token }: SwrInitorProps) => {
  const router = useRouter()
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const [init, setInit] = useState(false)

  const handleConsoleToken = async () => {
    await getCookie('__Secure-next-auth.session-token').then((res) => {
      if (res) {
        localStorage?.setItem('console_token', res)
        router.replace('/apps', { forceOptimisticNavigation: false } as any)
        return setInit(true)
      }
      else {
        router.replace(
          'https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps',
        )
      }
    })
  }
  useEffect(() => {
    console.log('token', token)
    if (token) {
      if (
        consoleTokenFromLocalStorage
        && consoleTokenFromLocalStorage === token
      )
        // 此处为了防止takin切换账号，dify没反应的情况
        return setInit(true)
      localStorage?.setItem('console_token', token)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
      return setInit(true)
    }
    else {
      localStorage?.removeItem('console_token')
      handleConsoleToken() // takin.ai: 防止重定向速度太快，没找到cookie，再查询一次cookie
    }
  }, [token])

  return init
    ? (
      <SWRConfig
        value={{
          shouldRetryOnError: false,
          revalidateOnFocus: false,
        }}
      >
        {children}
      </SWRConfig>
    )
    : null
}

export default SwrInitor
