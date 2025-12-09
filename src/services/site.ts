import { request } from '@umijs/max'

export type SiteConfig = {
  title?: string
  logo?: string
  footer?: string
}

export async function fetchSiteConfig(): Promise<SiteConfig> {
  const res = await request<any>('/api/admin/site', { method: 'GET' })
  const data = res?.data || {}
  return {
    title: data?.title,
    logo: data?.logo,
    footer: data?.footer,
  }
}
