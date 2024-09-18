'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useContext } from 'use-context-selector'
import useSWR from 'swr'
import { useDebounceFn } from 'ahooks'
import { RiCloseLine } from '@remixicon/react'
import useSWRInfinite from 'swr/infinite'
import Toast from '../../base/toast'
import s from './style.module.css'
import cn from '@/utils/classnames'
import ExploreContext from '@/context/explore-context'
import type { App } from '@/models/explore'
import Category from '@/app/components/explore/category'
import AppCard from '@/app/components/explore/app-card'
import StudioAppCard from '@/app/(commonLayout)/apps/AppCard'
import { fetchAppDetail, fetchAppList } from '@/service/explore'
import { fetchAppList as appList, importApp } from '@/service/apps'
import { useTabSearchParams } from '@/hooks/use-tab-searchparams'
import CreateAppModal from '@/app/components/explore/create-app-modal'
import AppTypeSelector from '@/app/components/app/type-selector'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import Loading from '@/app/components/base/loading'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { useAppContext } from '@/context/app-context'
import { getRedirection } from '@/utils/app-redirection'
import SearchInput from '@/app/components/base/search-input'
// takin command:增加share 卡片
import Modal from '@/app/components/base/modal'
import ShareAppCard from '@/app/components/explore/share-app-card'
import type { AppListResponse } from '@/models/app'

type AppsProps = {
  pageType?: PageType
  onSuccess?: () => void
}

export enum PageType {
  EXPLORE = 'explore',
  CREATE = 'create',
}

const getKey = (
  pageIndex: number,
  previousPageData: AppListResponse,
  activeTab: string,
  tags: string[],
  keywords: string,
) => {
  if (!pageIndex || previousPageData.has_more) {
    const params: any = { url: 'apps', params: { page: pageIndex + 1, limit: 30, name: keywords } }

    params.params.mode = activeTab
    params.params.tag_ids = tags
    return params
  }
  return null
}

const Apps = ({
  pageType = PageType.EXPLORE,
  onSuccess,
}: AppsProps) => {
  const { t } = useTranslation()
  const { isCurrentWorkspaceEditor } = useAppContext()
  const { push } = useRouter()
  const searchParams = useSearchParams()
  const searchParamsAppId = searchParams.get('id')
  const searchParamsCategory = searchParams.get('category')
  const { hasEditPermission } = useContext(ExploreContext)
  const allCategoriesEn = t('explore.apps.allCategories', { lng: 'en' })

  const [showShare, setShowShare] = useState('')
  const [keywords, setKeywords] = useState('')
  const [searchKeywords, setSearchKeywords] = useState('')

  const { run: handleSearch } = useDebounceFn(() => {
    setSearchKeywords(keywords)
  }, { wait: 500 })

  const handleKeywordsChange = (value: string) => {
    setKeywords(value)
    handleSearch()
  }

  const [currentType, setCurrentType] = useState<string>('')
  const [currCategory, setCurrCategory] = useTabSearchParams({
    defaultTab: allCategoriesEn,
    disableSearchParams: pageType !== PageType.EXPLORE,
  })
  // Takin command:为分类增加一个community
  const {
    data: { categories, community, recommended_apps, allList },
  } = useSWR(
    ['/explore/apps'],
    () =>
      fetchAppList().then(({ categories, community, recommended_apps }) => ({
        categories: ['favourite', ...categories],
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

  const { data, mutate } = useSWRInfinite(
    (pageIndex: number, previousPageData: AppListResponse) => getKey(pageIndex, previousPageData, 'all', ['b0524f83-eb2d-4ede-b654-b1a2b9d5fb00'], searchKeywords),
    appList,
    { revalidateFirstPage: true },
  )

  const filteredList = useMemo(() => {
    if (currCategory === allCategoriesEn) {
      if (!currentType)
        return recommended_apps
      else if (currentType === 'chatbot')
        return allList.filter(item => (item.app.mode === 'chat' || item.app.mode === 'advanced-chat'))
      else if (currentType === 'agent')
        return allList.filter(item => (item.app.mode === 'agent-chat'))
      else
        return allList.filter(item => (item.app.mode === 'workflow'))
    }
    else {
      if (!currentType && currCategory === 'community')
        return community
      else if (!currentType && currCategory !== 'community')
        return allList.filter(item => item.category === currCategory)
      else if (currentType === 'chatbot')
        return allList.filter(item => (item.app.mode === 'chat' || item.app.mode === 'advanced-chat') && item.category === currCategory)
      else if (currentType === 'agent')
        return allList.filter(item => (item.app.mode === 'agent-chat') && item.category === currCategory)
      else
        return allList.filter(item => (item.app.mode === 'workflow') && item.category === currCategory)
    }
  }, [currentType, currCategory, allCategoriesEn, allList, recommended_apps, community])

  const searchFilteredList = useMemo(() => {
    if (!searchKeywords || !filteredList || filteredList.length === 0)
      return filteredList

    const lowerCaseSearchKeywords = searchKeywords.toLowerCase()

    // Prioritize finding items that match the ID
    const idMatchedItems = filteredList.filter(item => searchKeywords === item.app.id)

    // If no ID matches, then search for items that match the app name
    if (idMatchedItems.length > 0) {
      return idMatchedItems
    }
    else {
      return filteredList.filter(item =>
        item.app && item.app.name && item.app.name.toLowerCase().includes(lowerCaseSearchKeywords),
      )
    }
  }, [searchKeywords, filteredList])

  const [currApp, setCurrApp] = React.useState<App | null>(null)
  const [isShowCreateModal, setIsShowCreateModal] = React.useState(false)
  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data } = await fetchAppDetail(
      currApp?.app.id as string,
    )
    try {
      const app = await importApp({
        data: export_data,
        name,
        icon_type,
        icon,
        icon_background,
        description,
      })
      setIsShowCreateModal(false)
      Toast.notify({
        type: 'success',
        message: t('app.newApp.appCreated'),
      })
      if (onSuccess)
        onSuccess()
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
      getRedirection(isCurrentWorkspaceEditor, app, push)
    }
    catch (e) {
      Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }

  useMemo(() => {
    if (searchParamsCategory && categories.length > 0)
      setCurrCategory(searchParamsCategory)
  }, [categories])

  useMemo(() => {
    if (searchParamsAppId)
      setShowShare(searchParamsAppId)
  }, [searchParamsAppId])

  useEffect(() => {
    if (localStorage.getItem(NEED_REFRESH_APP_LIST_KEY) === '1') {
      localStorage.removeItem(NEED_REFRESH_APP_LIST_KEY)
      mutate()
    }
  }, [])

  if (!categories || categories.length === 0) {
    return (
      <div className="flex h-full items-center">
        <Loading type="area"/>
      </div>
    )
  }

  return (
    <div className={cn(
      'flex flex-col',
      pageType === PageType.EXPLORE ? 'h-full border-l border-gray-200' : 'h-[calc(100%-56px)]',
    )}>
      {pageType === PageType.EXPLORE && (
        <div className='shrink-0 pt-6 px-12'>
          <div className={`mb-1 ${s.textGradient} text-xl font-semibold`}>{t('explore.apps.title')}</div>
          <div className='text-gray-500 text-sm'>{t('explore.apps.description')}</div>
        </div>
      )}
      <div className={cn(
        'flex items-center justify-between mt-6',
        pageType === PageType.EXPLORE ? 'px-12' : 'px-8',
      )}>
        <>
          {pageType !== PageType.EXPLORE && (
            <>
              <AppTypeSelector value={currentType} onChange={setCurrentType}/>
              <div className='mx-2 w-[1px] h-3.5 bg-gray-200'/>
            </>
          )}
          <Category
            list={categories}
            value={currCategory}
            onChange={setCurrCategory}
            allCategoriesEn={allCategoriesEn}
          />
        </>
        <SearchInput className='w-[200px]' value={keywords} onChange={handleKeywordsChange}/>

      </div>

      <div className={cn(
        'relative flex flex-1 pb-6 flex-col overflow-auto bg-gray-100 shrink-0 grow',
        pageType === PageType.EXPLORE ? 'mt-4' : 'mt-0 pt-2',
      )}>
        <nav
          className={cn(
            s.appList,
            'grid content-start shrink-0',
            pageType === PageType.EXPLORE ? 'gap-4 px-6 sm:px-12' : 'gap-3 px-8  sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4',
          )}>
          {
            currCategory === 'favourite'
              ? (
                <>
                  {data?.map(({ data: apps }) => (
                    apps.length === 0
                      // eslint-disable-next-line react/jsx-key
                      ? <div className="text-sm text-zinc-400 px-4 ">No favourite apps have been added yet</div>
                      : apps.map(app => (
                        <StudioAppCard key={app.id} app={app} onRefresh={mutate} />
                      ))
                  ))}
                </>
              )
              : (<>
                {searchFilteredList.map(app => (
                  <AppCard
                    key={app.app_id}
                    isExplore={pageType === PageType.EXPLORE}
                    app={app}
                    canCreate={hasEditPermission}
                    onCreate={() => {
                      setCurrApp(app)
                      setIsShowCreateModal(true)
                    }}
                  />
                ))}</>)
          }

        </nav>
      </div>

      {isShowCreateModal && (
        <CreateAppModal
          appIconType={currApp?.app.icon_type || 'emoji'}
          appIcon={currApp?.app.icon || ''}
          appIconBackground={currApp?.app.icon_background || ''}
          appIconUrl={currApp?.app.icon_url}
          appName={currApp?.app.name || ''}
          appDescription={currApp?.app.description || ''}
          show={isShowCreateModal}
          onConfirm={onCreate}
          onHide={() => setIsShowCreateModal(false)}
        />
      )}
      {/* takin command:增加share 卡片 */}
      <Modal
        isShow={!!showShare}
        className="!bg-transparent !shadow-none relative"
        onClose={() => setShowShare('')}
        wrapperClassName='pt-[60px]'
      >
        <div className='absolute right-4 top-4 p-4 cursor-pointer' onClick={() => setShowShare('')}>
          <RiCloseLine className='w-4 h-4 text-gray-500'/>
        </div>
        {allList.filter(app => app.app_id === showShare).map(app => <ShareAppCard
          key={app.app_id}
          isExplore={pageType === PageType.EXPLORE}
          app={app}
          canCreate={hasEditPermission}
          onCreate={() => {
            setCurrApp(app)
            setIsShowCreateModal(true)
          }}
        />)}
      </Modal>
    </div>
  )
}

export default React.memo(Apps)
