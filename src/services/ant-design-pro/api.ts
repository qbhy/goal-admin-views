// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { MenuDataItem } from '@umijs/route-utils';

export const InputTypes = [
  { value: 'password', label: '密码输入框' },
  { value: 'money', label: '金额输入框' },
  { value: 'textarea', label: '文本域' },
  { value: 'date', label: '日期' },
  { value: 'dateTime', label: '日期时间' },
  { value: 'dateWeek', label: '周' },
  { value: 'dateMonth', label: '月' },
  { value: 'dateQuarter', label: '季度输入' },
  { value: 'dateYear', label: '年份输入' },
  { value: 'dateRange', label: '日期区间' },
  { value: 'dateTimeRange', label: '日期时间区间' },
  { value: 'time', label: '时间' },
  { value: 'timeRange', label: '时间区间' },
  { value: 'text', label: '文本框' },
  { label: '下拉框', value: 'select' },
  { label: '树形下拉框', value: 'treeSelect' },
  { label: '多选框', value: 'checkbox' },
  { label: '星级组件', value: 'rate' },
  { label: '单选框', value: 'radio' },
  { label: '按钮单选框', value: 'radioButton' },
  { label: '进度条', value: 'progress' },
  { label: '百分比组件', value: 'percent' },
  { label: '数字输入框', value: 'digit' },
  { label: '秒格式化', value: 'second' },
  { label: '头像', value: 'avatar' },
  { label: '代码框', value: 'code' },
  { label: '开关', value: 'switch' },
  { label: '相对于当前时间', value: 'fromNow' },
  { label: '图片', value: 'image' },
  { label: '代码框，但是带了 json 格式化', value: 'jsonCode' },
  { label: '颜色选择器', value: 'color' },
  { label: '级联选择器', value: 'cascader' },
  { label: '分段器', value: 'segmented' },
  { label: '分组', value: 'group' },
  { label: '表单列表', value: 'formList' },
  { label: '表单集合', value: 'formSet' },
  { label: '分割线', value: 'divider' },
  { label: '依赖项', value: 'dependency' },
];

/** 获取当前的用户 GET /api/currentUser */
export async function currentUser(options?: { [key: string]: any }) {
  return request<{
    data: API.CurrentUser;
  }>('/api/currentUser', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取当前的用户 GET /api/currentUser */
export async function getMenuList(options?: { [key: string]: any }) {
  return request<{
    data: MenuDataItem[];
  }>('/api/admin/menu/list', {
    method: 'GET',
    ...(options || {}),
  }).then((res) => res.data);
}

/** 退出登录接口 POST /api/login/outLogin */
export async function outLogin(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/login/outLogin', {
    method: 'POST',
    ...(options || {}),
  });
}

/** 登录接口 POST /api/login/account */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return request<API.LoginResult>('/api/login/account', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

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
