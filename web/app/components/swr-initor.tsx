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
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
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
  const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZmF5ZSIsImVtYWlsIjoiZG9uZ3lpbWVuZzI3OEBnbWFpbC5jb20iLCJpYXQiOjE3MjI5Mzc1Nzh9.XgnUd_hKBHsMdfeQrNwEZtVu-iHkb3G2KlgFySxxdMQ'
  // const token1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiZmF5ZSIsImVtYWlsIjoiZmF5ZV8xMjI1QDE2My5jb20iLCJpYXQiOjE3MjI5Mzc1Nzh9.vGrYPMBZ5D6VE_Jus2C8Icp21NTn9yJ6IbBr95WrDYY'
  useMemo(() => {
    if (token1) {
      if (consoleTokenFromLocalStorage && consoleTokenFromLocalStorage === token1) // 此处为了防止takin切换账号，dify没反应的情况
        return setInit(true)
      localStorage?.setItem('console_token', token1)
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
