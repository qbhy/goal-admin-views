// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 获取当前的用户（管理员） GET /api/admin/current-user */
export async function currentUser(options?: { [key: string]: any }) {
  const resp = await request<Record<string, any>>('/api/admin/current-user', {
    method: 'GET',
    ...(options || {}),
  });

  const admin = resp?.data?.admin as any;
  const data: API.CurrentUser = admin
    ? {
        name: admin?.nickname || admin?.username || '',
        avatar: admin?.avatar || '',
        userid: String(admin?.id ?? ''),
        email: admin?.email,
        phone: admin?.phone,
        access: admin?.role,
      }
    : ({} as any);
  return { data };
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 管理员登录接口 POST /api/admin/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  // 适配 antd pro 原有 LoginParams 结构：
  const payload = body?.type === 'mobile'
    ? { phone: (body as any)?.mobile, code: (body as any)?.captcha }
    : { username: body?.username, password: body?.password };

  const resp = await request<Record<string, any>>('/api/admin/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
    ...(options || {}),
  });

  // 后端统一返回 ResponseResult：{ code, msg, data }
  const code = resp?.code;
  const data = resp?.data || {};

  // 将后端响应映射为 Ant Design Pro 的 LoginResult
  const ok = code === 0;
  const result: API.LoginResult = {
    status: ok ? 'ok' : 'error',
    type: body?.type || 'account',
    currentAuthority: ok ? 'admin' : 'guest',
  };

  // 成功时写入 token，配合 app.tsx 中的拦截器
  if (ok && data?.token) {
    try {
      localStorage.setItem('admin_token', data.token as string);
    } catch (_) {}
  }

  return result;
}

/** 获取图形验证码 GET /api/admin/captcha */
export async function adminGetCaptcha(options?: { [key: string]: any }) {
  // 管理员端接口：与后端 /api/admin/captcha 对齐
  return request<Record<string, any>>('/api/admin/captcha', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 发送短信验证码 POST /api/admin/send-sms */
export async function adminSendSms(body: { phone: string; type: 'login' | 'reset'; captchaId: string; captchaCode: string }, options?: { [key: string]: any }) {
  // 后端期望的字段为下划线命名: captcha_id, captcha_code
  const payload = {
    phone: body.phone,
    type: body.type,
    captcha_id: body.captchaId,
    captcha_code: body.captchaCode,
  };
  // 管理员端接口：与后端 /api/admin/send-sms 对齐
  return request<Record<string, any>>('/api/admin/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
    ...(options || {}),
  });
}

/** 管理员忘记密码重置 POST /api/admin/reset-password */
export async function adminResetPassword(
  body: { phone: string; code: string; newPassword: string },
  options?: { [key: string]: any },
) {
  // 后端期望的字段为下划线命名：new_password
  const payload = {
    phone: body.phone,
    code: body.code,
    new_password: body.newPassword,
  };
  return request<Record<string, any>>('/api/admin/reset-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: payload,
    ...(options || {}),
  });
}

/** 管理员用户列表（支持筛选与分页） GET /api/admin/users */
export async function adminUsers(
  params: {
    current?: number;
    pageSize?: number;
    nickname?: string;
    phone?: string;
    email?: string;
  } = {},
  options?: { [key: string]: any },
) {
  const resp = await request<Record<string, any>>('/api/admin/users', {
    method: 'GET',
    params,
    ...(options || {}),
  });

  const data = resp?.data || {};
  const list = (data?.list || []) as any[];
  const total = (data?.total || 0) as number;
  return {
    data: list,
    success: true,
    total,
  };
}

/** 获取用户详情 GET /api/admin/user/detail */
export async function adminUserDetail(id: number, options?: { [key: string]: any }) {
  const resp = await request<Record<string, any>>('/api/admin/user/detail', {
    method: 'GET',
    params: { id },
    ...(options || {}),
  });
  const data = resp?.data || {};
  return data?.user || {};
}

/** 新建用户 POST /api/admin/user/create */
export async function adminCreateUser(
  body: { nickname?: string; phone: string; email?: string; password: string },
  options?: { [key: string]: any },
) {
  const resp = await request<Record<string, any>>('/api/admin/user/create', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
  return resp?.data || {};
}

/** 更新用户 POST /api/admin/user/update */
export async function adminUpdateUser(
  body: { id: number; nickname?: string; avatar?: string; phone?: string; email?: string; status?: string },
  options?: { [key: string]: any },
) {
  await request<Record<string, any>>('/api/admin/user/update', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 禁用用户 POST /api/admin/user/disable */
export async function adminDisableUser(body: { id: number }, options?: { [key: string]: any }) {
  await request<Record<string, any>>('/api/admin/user/disable', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 启用用户 POST /api/admin/user/enable */
export async function adminEnableUser(body: { id: number }, options?: { [key: string]: any }) {
  await request<Record<string, any>>('/api/admin/user/enable', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 重置用户密码（管理员） POST /api/admin/user/reset-password */
export async function adminResetUserPassword(
  body: { id: number; new_password: string },
  options?: { [key: string]: any },
) {
  await request<Record<string, any>>('/api/admin/user/reset-password', {
    method: 'POST',
    data: body,
    ...(options || {}),
  });
}

/** 管理员列表（支持筛选与分页） GET /api/admin/admins */
export async function adminAdmins(
  params: {
    current?: number;
    pageSize?: number;
    username?: string;
    nickname?: string;
    phone?: string;
    email?: string;
  } = {},
  options?: { [key: string]: any },
) {
  const resp = await request<Record<string, any>>('/api/admin/admins', {
    method: 'GET',
    params,
    ...(options || {}),
  });

  const data = resp?.data || {};
  const list = (data?.list || []) as any[];
  const total = (data?.total || 0) as number;
  return {
    data: list,
    success: true,
    total,
  };
}

/** 删除管理员（仅 super 可删除 admin） POST /api/admin/admin/delete */
export async function adminDeleteAdmin(body: { id: number }, options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/admin/admin/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 创建管理员（仅 super 可创建） POST /api/admin/admin/create */
export async function adminCreateAdmin(
  body: {
    username: string;
    password: string;
    nickname?: string;
    avatar?: string;
    phone: string;
    email?: string;
    role?: 'admin' | 'super';
  },
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/admin/admin/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

/** 更新管理员（密码字段可选） POST /api/admin/admin/update */
export async function adminUpdateAdmin(
  body: {
    id: number;
    username?: string;
    password?: string;
    nickname?: string;
    avatar?: string;
    phone?: string;
    email?: string;
    role?: 'admin' | 'super';
  },
  options?: { [key: string]: any },
) {
  return request<Record<string, any>>('/api/admin/admin/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: body,
    ...(options || {}),
  });
}

// （已在文件前部定义 adminUserDetail / adminCreateUser / adminUpdateUser / adminDisableUser / adminEnableUser / adminResetUserPassword）

// （重复定义移除）

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
