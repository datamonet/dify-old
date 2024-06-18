'use client'
import type { FC } from 'react'
import React, { useEffect } from 'react'
import { useContext } from 'use-context-selector'
import { useRouter } from 'next/navigation'
import ExploreContext from '@/context/explore-context'
import TextGenerationApp from '@/app/components/share/text-generation'
import Loading from '@/app/components/base/loading'
import ChatWithHistory from '@/app/components/base/chat/chat-with-history'

export type IInstalledAppProps = {
  id: string
}

const InstalledApp: FC<IInstalledAppProps> = ({
  id,
}) => {
  const router = useRouter()
  const { installedApps } = useContext(ExploreContext)
  const installedApp = installedApps.find(item => item.id === id)

  useEffect(() => {
    // 如果 installedApps 是空数组并且 installedApp 不存在，跳转到 /explore/apps
    if (installedApps.length === 0 && !installedApp)
      router.push('/explore/apps')
  }, [installedApps, installedApp, history])

  if (!installedApp) {
    return (
      <div className='flex h-full items-center'>
        <Loading type='area' />
      </div>
    )
  }

  return (
    <div className='h-full py-2 pl-0 pr-2 sm:p-2'>
      {installedApp.app.mode !== 'completion' && installedApp.app.mode !== 'workflow' && (
        <ChatWithHistory installedAppInfo={installedApp} className='rounded-2xl shadow-md overflow-hidden' />
      )}
      {installedApp.app.mode === 'completion' && (
        <TextGenerationApp isInstalledApp installedAppInfo={installedApp}/>
      )}
      {installedApp.app.mode === 'workflow' && (
        <TextGenerationApp isWorkflow isInstalledApp installedAppInfo={installedApp}/>
      )}
    </div>
  )
}
export default React.memo(InstalledApp)
