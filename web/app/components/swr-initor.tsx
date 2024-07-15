'use client'

import { SWRConfig } from 'swr'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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
  // const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const [init, setInit] = useState(false)

  useEffect(() => {
    if (token || consoleToken) {
      localStorage?.setItem('console_token', token || consoleToken as string)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
    }
    else { localStorage?.removeItem('console_token') }

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
