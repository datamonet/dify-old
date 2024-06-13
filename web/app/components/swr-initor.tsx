'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type SwrInitorProps = {
  // children: ReactNode
  token?: string
}
const SwrInitor = ({
  token,
}: SwrInitorProps) => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const consoleToken = searchParams.get('console_token')
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')

  useEffect(() => {
    console.log(token, consoleToken, consoleTokenFromLocalStorage)
    if (token)
      localStorage?.setItem('console_token', token)
    else
      localStorage?.removeItem('console_token')

    if (!(consoleToken || consoleTokenFromLocalStorage))
      router.replace('https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps')

    if (consoleToken) {
      localStorage?.setItem('console_token', consoleToken!)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
    }
  }, [])

  return null
}

export default SwrInitor
