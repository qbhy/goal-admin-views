import {getResourceList} from './services/resource';

import dayjs from 'dayjs';
import {SortOrder} from 'antd/lib/table/interface';
import {ProColumns} from '@ant-design/pro-components';

export type ResourceColumn = ProColumns & Partial<{ expectEdit: boolean }> & any;

export function resolveColumns(columns: ResourceColumn[]) {
  const walk = (cols: ResourceColumn[]): ResourceColumn[] =>
    (cols || []).map((col) => {
      const next = {...col} as ResourceColumn;

      // 当 valueType 为 foreign，且存在 foreignKey 时，将 valueEnum 设置为 foreignKey（若尚未设置）
      if (next?.valueType === 'foreign' && (next as any).foreignKey) {
        if (!next.valueEnum) {
          next.valueEnum = (next as any).foreignKey;
        }
      }

      // 递归处理 children 子列
      const children = (next as any).children;
      if (Array.isArray(children) && children.length) {
        (next as any).children = walk(children);
      }

      // 兼容可能使用 columns 作为子列键的情况
      const subCols = (next as any).columns;
      if (Array.isArray(subCols) && subCols.length) {
        (next as any).columns = walk(subCols);
      }

      return next;
    });

  return walk(columns);
}


export function handlerListResourceServiceCall(
  resourceName: string,
  rawSort: any,
  setParams: (v: any) => void,
  columns: ProColumns[],
  onload?: (data: any) => void
): (
  params: any & {
    pageSize?: number;
    current?: number;
    keyword?: string;
  },
  sort: Record<string, SortOrder>,
  filter: Record<string, (string | number)[] | null>,
) => Promise<any> {
  return async (...params: any) => {
    const [search, sort, filter] = params;
    const {current, pageSize, keyword, ...otherFilter} = search;

    let convertedFilter = otherFilter;
    columns.forEach((column) => {
      if (['date', 'dateRange', 'dateTime', 'dateTimeRange'].includes(column.valueType as string)) {
        if (column.key !== undefined && convertedFilter.hasOwnProperty(column.key)) {
          if (convertedFilter[column.key as string] instanceof Array) {
            convertedFilter[column.key as string] = convertedFilter[column.key as string].map(
              (item: any) => {
                return dayjs(item).toISOString();
              },
            );
          } else {
            convertedFilter[column.key as string] = dayjs(
              convertedFilter[column.key as string],
            ).toISOString();
          }
        }
      }
    });

    const finalParams: any = {
      page: current,
      pageSize: pageSize,
      params: [],
      keyword,
      sorters: [],
    };

    const sorters = {...sort, ...rawSort}

    for (const key in sorters) {
      if (sorters[key]) {
        finalParams.sorters.push({
          field: key,
          order: sorters[key],
        })
      }
    }

    const filters = {
      ...otherFilter,
      ...filter,
    }
    for (const key in filters) {
      if (Array.isArray(filters[key]) && filters[key].length == 0){
        continue
      }
      finalParams.params.push({
        key: key,
        operator: Array.isArray(filters[key]) ? (key.endsWith('d_at') ? 'between' : 'in') : '=',
        value: filters[key],
      })
    }


    // setParams(finalParams); // 移除这行，避免循环调用
    const res = await getResourceList(resourceName, finalParams);
    if (res.code == 0) {
      onload && onload(res.data.list);
      return {
        data: res.data.list,
        total: res.data.total ?? res.data.data.length,
        success: true,
      };
    }
    return [];
  };
}

const pathRegex = /(?<=\[)(?!")[^\]]+|(?<=\[")[^"]+|[^."[\]]+/g;

export function getObjectValByPath(obj: any, path: any | any[] | undefined) {
  if (path === undefined) {
    return undefined;
  }

  if (typeof path === 'string') {
    return path.match(pathRegex)?.reduce((o, p) => o[p], obj);
  }

  if (path instanceof Array) {
    return path.reduce((o, p) => o[p as string], obj);
  }

  return undefined;
}
