import style from '../list.module.css'
import Apps from './Apps'
import classNames from '@/utils/classnames'
import { getLocaleOnServer, useTranslation as translate } from '@/i18n/server'
import LogoSite from '@/app/components/base/logo/logo-site'

const AppList = async () => {
  const locale = getLocaleOnServer()
  const { t } = await translate(locale, 'share-app')

  return (
    <div className='relative flex flex-col overflow-y-auto bg-gray-100 shrink-0 h-0 grow'>
      <Apps />
      <footer className='px-12 py-6 grow-0 shrink-0'>
        <div className={'flex items-center full'}>
          <div className='flex items-center pr-3 space-x-3 h-8 text-xs text-gray-400'>
            {/* <span className='uppercase'>{t('chat.powerBy')}</span> */}
            <span className='uppercase'>Powered by</span>
            <LogoSite/>
            <a className={style.socialMediaLink} target='_blank' rel='noopener noreferrer'
              href='https://github.com/langgenius/dify'><span
                className={classNames(style.socialMediaIcon, style.githubIcon)}/></a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default AppList
