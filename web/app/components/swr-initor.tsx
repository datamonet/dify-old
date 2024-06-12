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
  const consoleTokenFromLocalStorage = localStorage?.getItem('console_token')
  const [init, setInit] = useState(false)

  useEffect(() => {
    localStorage?.setItem('console_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImhhcnJ5andhbmdAZ21haWwuY29tIiwiZXhwIjoxNzIwNjg1OTY5LCJpc3MiOiJTRUxGX0hPU1RFRCIsInN1YiI6IkNvbnNvbGUgQVBJIFBhc3Nwb3J0In0.F2XgBjVOm-UKStZ4Dt4zoqa1AWWgtteuzPkC6CsCNfE')

    if (!(consoleToken || consoleTokenFromLocalStorage))
      router.replace('https://takin.ai/auth/signin?callbackUrl=https%3A%2F%2Fdify.takin.ai%2Fapps')

    if (consoleToken) {
      localStorage?.setItem('console_token', consoleToken!)
      router.replace('/apps', { forceOptimisticNavigation: false } as any)
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
