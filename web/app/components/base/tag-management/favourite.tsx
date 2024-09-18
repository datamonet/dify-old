import type { FC } from 'react'
import {
  RiStarFill,
  RiStarLine,
} from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import Button from '@/app/components/base/button'
import { useStore as useTagStore } from '@/app/components/base/tag-management/store'
import type { CreateAppModalProps } from '@/app/components/explore/create-app-modal'
import { fetchAppDetail } from '@/service/explore'
import { importApp } from '@/service/apps'
import Toast from '@/app/components/base/toast'
import { NEED_REFRESH_APP_LIST_KEY } from '@/config'
import { bindTag } from '@/service/tag'
import type { AppBasicInfo } from '@/models/explore'

// takin command: studio展示所有的喜欢app
export const FavouriteTag: FC<{
  value: string[]
  onChange: (v: string[]) => void
}> = ({
  value,
  onChange,
}) => {
  const tagList = useTagStore(s => s.tagList)
  const tag = tagList.filter(tag => tag.name.includes('favourite'))[0]
  const selectTag = () => {
    if (value.includes(tag.id))
      onChange(value.filter(v => v !== tag.id))
    else
      onChange([...value, tag.id])
  }
  return (
    <Button variant="ghost" onClick={selectTag} className="">
      {
        value?.filter(v => v === tag.id).length > 0
          ? <RiStarFill className='w-[16px] h-[16px] text-yellow-400'/>
          : <RiStarLine className='w-[16px] h-[16px]'/>
      }
    </Button>
  )
}

// takin command: explore将公开的设为喜欢
export const FavouriteBtn: FC<{
  app: AppBasicInfo
}> = ({
  app,
}) => {
  const { t } = useTranslation()
  // 首先先创建一个新的app到喜欢里
  const onCreate: CreateAppModalProps['onConfirm'] = async ({
    name,
    icon_type,
    icon,
    icon_background,
    description,
  }) => {
    const { export_data } = await fetchAppDetail(
      app.id,
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
      // b0524f83-eb2d-4ede-b654-b1a2b9d5fb00是喜欢的tag id
      await bindTag(['b0524f83-eb2d-4ede-b654-b1a2b9d5fb00'], app.id, 'app')
      localStorage.setItem(NEED_REFRESH_APP_LIST_KEY, '1')
    }
    catch (e) {
      Toast.notify({ type: 'error', message: t('app.newApp.appCreateFailed') })
    }
  }
  return (
    <div onClick={(e) => {
      e.stopPropagation()
      onCreate({
        name: app.name,
        icon_type: app.icon_type || 'emoji',
        icon: app.icon,
        icon_background: app.icon_background,
        description: app.description,
        use_icon_as_answer_icon: app.use_icon_as_answer_icon,
      })
    }} className="">
      <RiStarLine className='w-[16px] h-[16px] hover:text-yellow-400'/>
    </div>
  )
}
