import type {Settings as LayoutSettings} from '@ant-design/pro-components';
import {SettingDrawer} from '@ant-design/pro-components';
import type {RequestConfig, RunTimeLayoutConfig} from '@umijs/max';
import {history} from '@umijs/max';
import {fetchAdminMenuAndRoutes} from '@/services/menu'
import {fetchSiteConfig} from '@/services/site'
import React from 'react';
import {AvatarDropdown, AvatarName, Footer,} from '@/components';
import {currentUser as queryCurrentUser} from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import {errorConfig} from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';
import './tailwind-output.css'
import logo from '@/logo.png';

// 配置 dayjs 使用 +8 时区
// dayjs.extend(utc);
// dayjs.extend(timezone);
// dayjs.tz.setDefault('Asia/Shanghai');
// tailwind.css was used temporarily; removing global import to restore original styles

const isDev = process.env.NODE_ENV === 'development';
const isDevOrTest = isDev || process.env.CI;
const loginPath = '/admin/login';

// 解码并校验本地 JWT 的过期时间（exp）
const decodeJwtPayload = (token: string) => {
  try {
    const base64 = token.split('.')[1];
    const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
};

const isTokenValid = (token: string) => {
  const payload = decodeJwtPayload(token);
  if (!payload) return false;
  const exp = payload?.exp;
  if (typeof exp !== 'number') return true; // 无 exp 视为有效，由服务端判定
  const now = Math.floor(Date.now() / 1000);
  return now < exp;
};

// 请求拦截器：若本地存在未过期 token，则注入到 Authorization 头
const authHeaderInterceptor = (url: string, options: any) => {
  const token = localStorage.getItem('admin_token');
  if (token && isTokenValid(token)) {
    const headers = {
      ...(options?.headers || {}),
      Authorization: `Bearer ${token}`,
    };
    return {url, options: {...options, headers, interceptors: true}};
  }
  return {url, options: {...options, interceptors: true}};
};

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  menuData?: any[];
}> {
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      return msg.data;
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };
  // 如果不是登录页面，执行
  const {location} = history;
  if (
    ![loginPath, '/admin/register', '/admin/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    let menuData: any[] = []
    try {
      menuData = await fetchAdminMenuAndRoutes()
    } catch {
    }
    let settings: Partial<LayoutSettings> = {...defaultSettings}
    try {
      const site = await fetchSiteConfig()
      console.log('site', site)
      settings = {
        ...settings,
        ...(site.title ? {title: site.title} : {}),
        ...(site.logo ? {logo: site.logo} : {}),
        ...(site.footer ? {footer: site.footer} : {}),
      }
    } catch {
    }
    return {
      fetchUserInfo,
      currentUser,
      settings,
      menuData,
    };
  }
  return {
    fetchUserInfo,
    settings: await (async () => {
      let s: Partial<LayoutSettings> = {...defaultSettings}
      try {
        const site = await fetchSiteConfig()
        s = {
          ...s,
          ...(site.title ? {title: site.title} : {}),
          ...(site.logo ? {logo: site.logo} : {}),
          ...(site.footer ? {footer: site.footer} : {}),
        }
      } catch {
      }
      return s
    })(),
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
                                              initialState,
                                              setInitialState,
                                            }) => {

  console.log('initialState', initialState)
  return {
    actionsRender: () => [],
    avatarProps: {
      src: (initialState?.settings as any)?.logo || logo,
      title: <AvatarName/>,
      render: (_, avatarChildren) => (
        <AvatarDropdown>{avatarChildren}</AvatarDropdown>
      ),
    },
    waterMarkProps: {
      content: initialState?.currentUser?.name,
    },
    footerRender: () => <Footer/>,
    onPageChange: () => {
      const {location} = history;
      // 如果没有登录，重定向到 login
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
      const siteTitle = (initialState?.settings as any)?.title
      if (typeof document !== 'undefined' && siteTitle) {
        const current = document.title || ''
        const left = new RegExp(`^${siteTitle}\\s*-\\s*`)
        const right = new RegExp(`\\s*-\\s*${siteTitle}$`)
        const page = current.replace(left, '').replace(right, '').trim()
        document.title = page ? `${siteTitle} - ${page}` : siteTitle
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    logo: (initialState?.settings as any)?.logo,
    title: (initialState?.settings as any)?.title,
    name: (initialState?.settings as any)?.title,
    menuDataRender: (_menuData) => {
      if (Array.isArray(initialState?.menuData) && initialState!.menuData!.length > 0) {
        return initialState!.menuData as any[]
      }
      return _menuData
    },
    menu: {
      request: async (_params, defaultMenuData) => {
        try {
          const data = await fetchAdminMenuAndRoutes()
          if (Array.isArray(data) && data.length > 0) return data
        } catch {
        }
        return defaultMenuData
      },
    },
    // 自定义 403 页面
    // unAccessible: <div>unAccessible</div>,
    // 增加一个 loading 的状态
    childrenRender: (children) => {
      const siteLogo = (initialState?.settings as any)?.logo
      if (siteLogo && typeof document !== 'undefined') {
        const el: HTMLLinkElement | null = document.querySelector("link[rel*='icon']")
        if (el) {
          el.href = siteLogo
        } else {
          const link = document.createElement('link')
          link.rel = 'icon'
          link.href = siteLogo
          document.head.appendChild(link)
        }
      }
      return (
        <>
          {children}
          {isDevOrTest && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: isDev ? '' : '/',
  ...errorConfig,
  requestInterceptors: [authHeaderInterceptor],
};
