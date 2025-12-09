import { request } from '@umijs/max';
import {
  adminUsers,
  adminUserDetail,
  adminCreateUser,
  adminUpdateUser,
  adminDisableUser,
  adminEnableUser,
  adminResetUserPassword,
} from './api';

type ListParams = Record<string, any>;
type IdPayload = { id: number };

export type ResourceActions = {
  list: (params?: ListParams) => Promise<{ data: any[]; success: boolean; total: number }>;
  detail: (id: number) => Promise<any>;
  create: (payload: Record<string, any>) => Promise<any>;
  update: (payload: Record<string, any>) => Promise<void>;
  disable?: (payload: IdPayload) => Promise<void>;
  enable?: (payload: IdPayload) => Promise<void>;
  resetPassword?: (payload: { id: number; new_password: string }) => Promise<void>;
};

const usersActions: ResourceActions = {
  list: (params?: ListParams) => adminUsers(params || {}),
  detail: (id: number) => adminUserDetail(id),
  create: (payload) => adminCreateUser(payload as any),
  update: (payload) => adminUpdateUser(payload as any),
  disable: (payload) => adminDisableUser(payload),
  enable: (payload) => adminEnableUser(payload),
  resetPassword: (payload) => adminResetUserPassword(payload),
};

const registry: Record<string, ResourceActions> = {
  users: usersActions,
};

export function getResourceActions(model: string): ResourceActions {
  const actions = registry[model];
  if (!actions) {
    throw new Error(`未找到资源模型的 API 映射: ${model}`);
  }
  return actions;
}

// 获取资源模型的前端渲染元数据（字段与配置）
export async function getResourceMeta(model: string): Promise<Record<string, any>> {
  const resp = await request<Record<string, any>>(`/api/admin/meta/${model}`, {
    method: 'GET',
  });
  return resp?.data || {};
}