'use client'

import { SWRConfig } from 'swr'
import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter } from 'next/navigation'
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
  const [init, setInit] = useState(false)

  const handleConsoleToken = async () => {
    await getCookie('__Secure-next-auth.session-token').then((res) => {
      if (res) {
        localStorage?.setItem('console_token', res)
        router.replace('/apps', { forceOptimisticNavigation: false } as any)
      }
      else { router.replace('https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps') }
    })
  }

  useMemo(() => {
    if (token) {
      localStorage?.setItem('console_token', token)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
    }
    else {
      localStorage?.removeItem('console_token')
      handleConsoleToken() // takin.ai: 防止重定向速度太快，没找到cookie，再查询一次cookie
    }

    setInit(true)
  }, [])

  return init
    ? (
      <SWRConfig value={{
        shouldRetryOnError: false,
        revalidateOnFocus: false,
      }}>
        {children}
      </SWRConfig>
    )
    : null
}

export default SwrInitor
