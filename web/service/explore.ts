import { del, get, patch, post } from './base'
import type { App, AppCategory } from '@/models/explore'
import type { AppListResponse } from '@/models/app'
import type { CommonResponse } from '@/models/common'
import type { Fetcher } from 'swr'

export const fetchAppList = () => {
  return get<{
    categories: AppCategory[]
    recommended_apps: App[]
    community: App[]
  }>('/explore/apps')
}

export const fetchExploreAppList: Fetcher<AppListResponse, { url: string; params?: Record<string, any> }> = ({ url, params }) => {
  return get<AppListResponse>(url, { params })
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

export const createRecommendedApp = (id: string, description?: string, category?: string) => {
  return post<App>('/explore/apps', { body: { app_id: id, description, category } })
}

export const deleteRecommendedApp = (id: string) => {
  return del<CommonResponse>(`/explore/apps/${id}`)
}
