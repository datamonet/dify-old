import type { Fetcher } from 'swr'
import { del, get, patch, post } from './base'
import type { App, AppCategory } from '@/models/explore'
import type { CommonResponse } from '@/models/common'

export const fetchAppList = () => {
  return get<{
    categories: AppCategory[]
    recommended_apps: App[]
  }>('/explore/apps')
}

export const fetchAppDetail = (id: string): Promise<any> => {
  return get(`/explore/apps/${id}`)
}

export const fetchInstalledAppList = () => {
  return get('/installed-apps')
}

export const installApp = (id: string) => {
  return post('/installed-apps', {
    body: {
      app_id: id,
    },
  })
}

export const uninstallApp = (id: string) => {
  return del(`/installed-apps/${id}`)
}

export const updatePinStatus = (id: string, isPinned: boolean) => {
  return patch(`/installed-apps/${id}`, {
    body: {
      is_pinned: isPinned,
    },
  })
}

export const getToolProviders = () => {
  return get('/workspaces/current/tool-providers')
}

export const createRecommendedApp: Fetcher<App, { app_id: string; description?: string; category?: string; copyright?: string; privacy_policy?: string }> = ({ app_id, description, category, copyright, privacy_policy }) => {
  return post<App>('/explore/apps', { body: { app_id, description, category, copyright, privacy_policy } })
}

export const deleteRecommendedApp: Fetcher<CommonResponse, string> = (appID) => {
  return del<CommonResponse>(`apps/${appID}`)
}
