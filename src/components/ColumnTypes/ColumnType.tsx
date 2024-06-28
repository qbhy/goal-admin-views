import { ReactNode } from 'react';
import { GoalProColumn } from '@/components/ResourceEditor';
import { DatabaseType } from '@/components/ColumnTypes/database';

export interface ColumnType {
  value: string;
  label: string;
  displayRender?: (
    dom: ReactNode,
    item: any,
    index: number,
    params: Record<string, any>,
  ) => ReactNode;
  formRender?: (col: GoalProColumn, params: Record<string, any>) => ReactNode;
  params?: GoalProColumn[];
}

export const InputTypes: ColumnType[] = [
  DatabaseType,
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
  { value: 'select', label: '下拉框' },
  { value: 'treeSelect', label: '树形下拉框' },
  { value: 'checkbox', label: '多选框' },
  { value: 'rate', label: '星级组件' },
  { value: 'radio', label: '单选框' },
  { value: 'radioButton', label: '按钮单选框' },
  { value: 'progress', label: '进度条' },
  { value: 'percent', label: '百分比组件' },
  { value: 'digit', label: '数字输入框' },
  { value: 'second', label: '秒格式化' },
  { value: 'avatar', label: '头像' },
  { value: 'code', label: '代码框' },
  { value: 'switch', label: '开关' },
  { value: 'fromNow', label: '相对于当前时间' },
  { value: 'image', label: '图片' },
  { value: 'jsonCode', label: '代码框，但是带了 json 格式化' },
  { value: 'color', label: '颜色选择器' },
  { value: 'cascader', label: '级联选择器' },
  { value: 'segmented', label: '分段器' },
  { value: 'group', label: '分组' },
  { value: 'formList', label: '表单列表' },
  { value: 'formSet', label: '表单集合' },
  { value: 'divider', label: '分割线' },
  { value: 'dependency', label: '依赖项' },
];

export const Types = {
  database: {} as ColumnType,
};
