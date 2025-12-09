import { request } from '@umijs/max'

// 管理端服务封装：对齐前台集合页接口

export type CollectionsQueryParams = {
  page: number
  pageSize: number
  rarity?: string
  keyword?: string
}

export async function getAssetStats(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/assets-stats', {
    method: 'GET',
    ...(options || {}),
  })
}

export async function getCollections(params: CollectionsQueryParams, options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/collections', {
    method: 'GET',
    params,
    ...(options || {}),
  })
}

export async function getCollectionDetail(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/collections/${encodeURIComponent(id)}`, {
    method: 'GET',
    ...(options || {}),
  })
}

export async function getCollectionHistory(id: string, options?: { [key: string]: any }) {
  return request<Record<string, any>>(`/api/collections/${encodeURIComponent(id)}/history`, {
    method: 'GET',
    ...(options || {}),
  })
}