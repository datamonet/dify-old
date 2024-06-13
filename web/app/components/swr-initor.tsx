'use client'

import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getCookie } from '@/app/api/user'

type SwrInitorProps = {
  children: ReactNode
}
const SwrInitor = ({
  children,
}: SwrInitorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleToken = searchParams.get('console_token')
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const token = getCookie('__Secure-next-auth.session-token')
  // TODO:测试环境的cookie名字和生产环境cookie名字都需要加
  // const token = getCookie('next-auth.session-token')

  useEffect(() => {
    if (token)
      localStorage?.setItem('console_token', token)
    else
      localStorage?.removeItem('console_token')

    if (!(token || consoleToken || consoleTokenFromLocalStorage))
      router.replace('https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps')

    if (consoleToken || token) {
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
