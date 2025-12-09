import { request } from '@umijs/max'

export type ServerMenuItem = {
  path: string
  name?: string
  icon?: string
  hideInMenu?: boolean
  children?: ServerMenuItem[]
}

export async function fetchAdminMenuAndRoutes(): Promise<ServerMenuItem[]> {
  const res = await request<any>(
    '/api/admin/menu',
    { method: 'GET' },
  )
  const data = res?.data
  if (Array.isArray(data)) return data as ServerMenuItem[]
  if (Array.isArray(res?.items)) return res!.items as ServerMenuItem[]
  const menus = data?.menus
  if (Array.isArray(menus)) return menus as ServerMenuItem[]
  return []
}
