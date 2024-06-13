'use client'

import { SWRConfig } from 'swr'
import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCookie } from '@/app/api/user'

type SwrInitorProps = {
  children: ReactNode
}
const SwrInitor = ({
  children,
}: SwrInitorProps) => {
  const router = useRouter()
  const handleConsoleToken = async () => {
    // const token = getCookie('next-auth.session-token')
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
    handleConsoleToken()
  }, [])

  return <SWRConfig value={{
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  }}>
    {children}
  </SWRConfig>
}

export default SwrInitor
