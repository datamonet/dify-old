'use client'
import type { FC } from 'react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import cn from 'classnames'
import { useRouter } from 'next/navigation'
import { useContext } from 'use-context-selector'
import UpgradeBtn from '../upgrade-btn'
import Modal from '../../base/modal'
import s from './style.module.css'
import GridMask from '@/app/components/base/grid-mask'
import ConfigContext from '@/context/debug-configuration'

const CreditsBillingModal: FC = () => {
  const { t } = useTranslation()
  const router = useRouter()
  const { showCreditsBillingModal, setShowCreditsBillingModal } = useContext(ConfigContext)
  return (
    <Modal
      isShow={showCreditsBillingModal}
      onClose={() => setShowCreditsBillingModal(false)}
      closable
      className='!p-0'
    >
      <GridMask wrapperClassName='rounded-lg' canvasClassName='rounded-lg' gradientClassName='rounded-lg'>
        <div onClick={() => router.push('https://takin.ai/plan')} className='mt-6 px-7 py-6 border-2 border-solid border-transparent rounded-lg shadow-md flex flex-col transition-all duration-200 ease-in-out cursor-pointer'>
          <div className='flex justify-between items-center'>
            <div className={cn(s.textGradient, 'leading-[27px] text-[18px] font-semibold')}>
              <div>{t('billing.annotatedResponse.fullTipLine1')}</div>
              <div>{t('billing.annotatedResponse.fullTipLine2')}</div>
            </div>

          </div>
          <div className='mt-7 flex justify-end'>
            <UpgradeBtn onClick={() => router.push('https://takin.ai/plan')} />
          </div>
        </div>
      </GridMask>
    </Modal>
  )
}
export default React.memo(CreditsBillingModal)
