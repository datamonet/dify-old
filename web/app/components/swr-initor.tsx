'use client'

import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCookie } from '@/app/api/user'

type SwrInitorProps = {
  children: ReactNode
  token?: string
}
const SwrInitor = ({
  children,
  token,
}: SwrInitorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleToken = searchParams.get('console_token')
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const handleConsoleToken = async () => {
    await getCookie('__Secure-next-auth.session-token').then((res) => {
      if (res) {
        localStorage?.setItem('console_token', res)
        router.replace('/apps', { forceOptimisticNavigation: false } as any)
      }
      else {
        localStorage?.removeItem('console_token')
        router.replace('https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps')
      }
    })
  }

  useEffect(() => {
    if (token)
      localStorage?.setItem('console_token', token)
    else
      localStorage?.removeItem('console_token')
    // 防止重定向速度太快，再查询一次cookie
    if (!(consoleToken || consoleTokenFromLocalStorage))
      handleConsoleToken()

    if (consoleToken) {
      localStorage?.setItem('console_token', consoleToken!)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
    }
  }, [])

  return <SWRConfig value={{
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  }}>
    {children}
  </SWRConfig>
}

export default SwrInitor
