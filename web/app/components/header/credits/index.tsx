'use client'
import { WalletIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useAppContext } from '@/context/app-context'

const Credits = () => {
  const { userProfile } = useAppContext()

  return (
    <Link href={`https://takin.ai/user/${userProfile.takin_id}/billing`} className={'relative flex cursor-pointer items-center text-zinc-600 mr-2'}>
      <WalletIcon className="h-5 mr-2"/>
      <span>
        {(userProfile.credits || 0).toFixed(2)}
      </span>
    </Link>
  )
}

export default Credits
