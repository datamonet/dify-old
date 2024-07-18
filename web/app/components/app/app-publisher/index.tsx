import React, {
  memo,
  useCallback, useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { useContext } from 'use-context-selector'
import useSWR from 'swr'
import { RiArrowDownSLine } from '@remixicon/react'
import type { ModelAndParameter } from '../configuration/debug/types'
import PublishWithMultipleModel from './publish-with-multiple-model'
import Button from '@/app/components/base/button'
import {
  PortalToFollowElem,
  PortalToFollowElemContent,
  PortalToFollowElemTrigger,
} from '@/app/components/base/portal-to-follow-elem'
import EmbeddedModal from '@/app/components/app/overview/embedded'
import { useStore as useAppStore } from '@/app/components/app/store'
import { useGetLanguage } from '@/context/i18n'

import type { InputVar } from '@/app/components/workflow/types'
import { createRecommendedApp, deleteRecommendedApp, fetchAppDetail, fetchAppList } from '@/service/explore'
import { ToastContext } from '@/app/components/base/toast'
import PermissionsRadio from '@/app/components/datasets/settings/permissions-radio'

export type AppPublisherProps = {
  disabled?: boolean
  publishDisabled?: boolean
  publishedAt?: number
  /** only needed in workflow / chatflow mode */
  draftUpdatedAt?: number
  debugWithMultipleModel?: boolean
  multipleModelConfigs?: ModelAndParameter[]
  /** modelAndParameter is passed when debugWithMultipleModel is true */
  onPublish?: (modelAndParameter?: ModelAndParameter) => Promise<any> | any
  onRestore?: () => Promise<any> | any
  onToggle?: (state: boolean) => void
  crossAxisOffset?: number
  toolPublished?: boolean
  inputs?: InputVar[]
  onRefreshData?: () => void
}

const AppPublisher = ({
  disabled = false,
  publishDisabled = false,
  publishedAt,
  draftUpdatedAt,
  debugWithMultipleModel = false,
  multipleModelConfigs = [],
  onPublish,
  onRestore,
  onToggle,
  crossAxisOffset = 0,
  toolPublished,
  inputs,
  onRefreshData,
}: AppPublisherProps) => {
  const { t } = useTranslation()
  const { notify } = useContext(ToastContext)
  const [published, setPublished] = useState(false)
  const [open, setOpen] = useState(false)
  const [posted, setPosted] = useState(false)
  const appDetail = useAppStore(state => state.appDetail)
  const { app_base_url: appBaseURL = '', access_token: accessToken = '' } = appDetail?.site ?? {}
  const appMode = (appDetail?.mode !== 'completion' && appDetail?.mode !== 'workflow') ? 'chat' : appDetail.mode
  const { mutate } = useSWR(
    ['/explore/apps'],
    () =>
      fetchAppList().then(({ categories, community, recommended_apps }) => ({
        categories,
        community,
        recommended_apps,
        allList: [...community, ...recommended_apps].sort((a, b) => a.position - b.position),
      })),
    {
      fallbackData: {
        categories: [],
        community: [],
        recommended_apps: [],
        allList: [],
      },
    },
  )
  const language = useGetLanguage()

  const formatTimeFromNow = useCallback((time: number) => {
    return dayjs(time).locale(language === 'zh_Hans' ? 'zh-cn' : language.replace('_', '-')).fromNow()
  }, [language])

  const handlePosted = async () => {
    if (posted) {
      await createRecommendedApp(
        appDetail?.id || '',
        appDetail?.description,
        appMode,
      )
    }
    else {
      await deleteRecommendedApp(appDetail?.id || '')
    }
    mutate()
  }

  const handlePublish = async (modelAndParameter?: ModelAndParameter) => {
    try {
      // takin command:设置app的公开状态
      await handlePosted()
      await onPublish?.(modelAndParameter)

      setPublished(true)
    }
    catch (e) {
      setPublished(false)
    }
  }

  const handleRestore = useCallback(async () => {
    try {
      await onRestore?.()
      setOpen(false)
    }
    catch (e) {
    }
  }, [onRestore])

  const handleTrigger = useCallback(() => {
    const state = !open

    if (disabled) {
      setOpen(false)
      return
    }

    onToggle?.(state)
    setOpen(state)

    if (state)
      setPublished(false)
  }, [disabled, onToggle, open])

  useMemo(() => {
    const handlePostStatus = async () => {
      try {
        const response = await fetchAppDetail(appDetail?.id || '')
        setPosted(!!response)
      }
      catch (e) {
        setPosted(false)
      }
    }

    if (appDetail)
      handlePostStatus()
  }, [appDetail])

  const [embeddingModalOpen, setEmbeddingModalOpen] = useState(false)

  return (
    <PortalToFollowElem
      open={open}
      onOpenChange={setOpen}
      placement='bottom-end'
      offset={{
        mainAxis: 4,
        crossAxis: crossAxisOffset,
      }}
    >
      <PortalToFollowElemTrigger onClick={handleTrigger}>
        <Button
          variant='primary'
          className='pl-3 pr-1'
          disabled={disabled}
        >
          {t('workflow.common.publish')}
          <RiArrowDownSLine className='ml-0.5' />

        </Button>
      </PortalToFollowElemTrigger>
      <PortalToFollowElemContent className='z-[11]'>
        <div className='w-[336px] bg-white rounded-2xl border-[0.5px] border-gray-200 shadow-xl'>
          <div className='p-4 pt-3'>
            <div className='flex items-center h-6 text-xs font-medium text-gray-500 uppercase'>
              {publishedAt ? t('workflow.common.latestPublished') : t('workflow.common.currentDraftUnpublished')}
            </div>
            {publishedAt
              ? (
                <div className='flex justify-between items-center h-[18px]'>
                  <div
                    className='flex items-center mt-[3px] mb-[3px] leading-[18px] text-[13px] font-medium text-gray-700'>
                    {t('workflow.common.publishedAt')} {formatTimeFromNow(publishedAt)}
                  </div>
                  <Button
                    className={`
                      ml-2 px-2 text-primary-600
                      ${published && 'text-primary-300 border-gray-100'}
                    `}
                    size='small'
                    onClick={handleRestore}
                    disabled={published}
                  >
                    {t('workflow.common.restore')}
                  </Button>
                </div>
              )
              : (
                <div className='flex items-center h-[18px] leading-[18px] text-[13px] font-medium text-gray-700'>
                  {t('workflow.common.autoSaved')} · {Boolean(draftUpdatedAt) && formatTimeFromNow(draftUpdatedAt!)}
                </div>
              )}
            {debugWithMultipleModel
              ? (
                <PublishWithMultipleModel
                  multipleModelConfigs={multipleModelConfigs}
                  onSelect={item => handlePublish(item)}
                  // textGenerationModelList={textGenerationModelList}
                />
              )
              : (
                <Button
                  variant='primary'
                  className='w-full mt-3'
                  onClick={() => handlePublish()}
                  disabled={publishDisabled || published}
                >
                  {
                    published
                      ? t('workflow.common.published')
                      : publishedAt ? t('workflow.common.update') : t('workflow.common.publish')
                  }
                </Button>
              )
            }
            <div className="py-2 flex flex-col">
              <div className="flex space-x-1 items-start py-2 text-sm text-gray-500">
                {t('datasetSettings.form.permissions')}
              </div>
              {/* takincommand:增加app的权限管理，公开以及私密的状态 */}
              <PermissionsRadio
                itemClassName="sm:w-36 text-sm px-0"
                value={posted ? 'all_team_members' : 'only_me'}
                onChange={(v) => {
                  setPosted(v === 'all_team_members')
                  setPublished(false)
                }
                }
              />

            </div>

          </div>
          {/* <div className='p-4 pt-3 border-t-[0.5px] border-t-black/5'> */}
          {/*  <SuggestedAction disabled={!publishedAt} link={appURL} */}
          {/*    icon={<PlayCircle/>}>{t('workflow.common.runApp')}</SuggestedAction> */}
          {/*  {appDetail?.mode === 'workflow' */}
          {/*    ? ( */}
          {/*      <SuggestedAction */}
          {/*        disabled={!publishedAt} */}
          {/*        link={`${appURL}${appURL.includes('?') ? '&' : '?'}mode=batch`} */}
          {/*        icon={<LeftIndent02 className='w-4 h-4'/>} */}
          {/*      > */}
          {/*        {t('workflow.common.batchRunApp')} */}
          {/*      </SuggestedAction> */}
          {/*    ) */}
          {/*    : ( */}
          {/*      <SuggestedAction */}
          {/*        onClick={() => { */}
          {/*          setEmbeddingModalOpen(true) */}
          {/*          handleTrigger() */}
          {/*        }} */}
          {/*        disabled={!publishedAt} */}
          {/*        icon={<CodeBrowser className='w-4 h-4'/>} */}
          {/*      > */}
          {/*        {t('workflow.common.embedIntoSite')} */}
          {/*      </SuggestedAction> */}
          {/*    )} */}
          {/*  <SuggestedAction disabled={!publishedAt} link='./develop' icon={<FileText */}
          {/*    className='w-4 h-4'/>}>{t('workflow.common.accessAPIReference')}</SuggestedAction> */}
          {/*  {appDetail?.mode === 'workflow' && ( */}
          {/*    <WorkflowToolConfigureButton */}
          {/*      disabled={!publishedAt} */}
          {/*      published={!!toolPublished} */}
          {/*      detailNeedUpdate={!!toolPublished && published} */}
          {/*      workflowAppId={appDetail?.id} */}
          {/*      icon={{ */}
          {/*        content: appDetail?.icon, */}
          {/*        background: appDetail?.icon_background, */}
          {/*      }} */}
          {/*      name={appDetail?.name} */}
          {/*      description={appDetail?.description} */}
          {/*      inputs={inputs} */}
          {/*      handlePublish={handlePublish} */}
          {/*      onRefreshData={onRefreshData} */}
          {/*    /> */}
          {/*  )} */}
          {/* </div> */}
        </div>
      </PortalToFollowElemContent>
      <EmbeddedModal
        siteInfo={appDetail?.site}
        isShow={embeddingModalOpen}
        onClose={() => setEmbeddingModalOpen(false)}
        appBaseUrl={appBaseURL}
        accessToken={accessToken}
      />
    </PortalToFollowElem>
  )
}

export default memo(AppPublisher)
