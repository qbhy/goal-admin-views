import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {SelectProps} from 'antd';
import {Select, Spin} from 'antd';
import {getResourceList} from '@/services/resource';

export type ResourceSearchSelectProps = {
  multiple?: boolean,
  model: string;
  keyField?: string; // 用作选项的 value 字段（通常为 id）
  labelField: string; // 用作选项的显示 label 字段
  value?: string | number | null;
  onChange?: (value: any, option?: any) => void;
  withParams?: { key: string, value: any, operator: string }[]
} & Omit<SelectProps<any>, 'options' | 'mode' | 'onChange' | 'value'>;

type OptionItem = { label: React.ReactNode; value: any; raw: any };

const DEFAULT_PAGE_SIZE = 20;

const ResourceSearchSelect: React.FC<ResourceSearchSelectProps> = (
  {
    model,
    multiple,
    keyField = 'id',
    labelField: labelField,
    value,
    onChange,
    placeholder,
    allowClear = true,
    disabled,
    withParams = [],
    ...rest
  }
) => {
  const [options, setOptions] = useState<OptionItem[]>([]);
  const [fetching, setFetching] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const searchTimer = useRef<number | ReturnType<typeof setTimeout> | null>(null);

  const buildOptions = useCallback((list: any[]) => {
    return (list || []).map((item: any) => {
      const label = item?.[labelField] ?? item?.name ?? item?.title ?? String(item?.[keyField] ?? '');
      const value = item?.[keyField];
      return {label, value, raw: item} as OptionItem;
    });
  }, [keyField, labelField]);

  const fetchList = useCallback(async (keyword?: string, filterByValue?: any) => {
    if (!model || fetching) return;
    setFetching(true);
    console.log('fetchList', model)
    try {
      const params: any = {
        page: 1,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        params: withParams,
        sorters: [],
      };
      if (filterByValue !== undefined && filterByValue !== null) {
        // 支持数组值（multiple 模式）
        if (Array.isArray(filterByValue)) {
          if (filterByValue.length > 0) {
            params.params.push({key: keyField, value: filterByValue, operator: 'in'});
          }
        } else {
          params.params.push({key: keyField, value: filterByValue});
        }
      }

      const res = await getResourceList(model, params);
      const list = res?.data?.list ?? res?.data?.data ?? [];
      setOptions(buildOptions(list));
    } catch (e) {
      // 忽略错误，交由上层处理或再次搜索
    } finally {
      setFetching(false);
    }
  }, [model, keyField, buildOptions, withParams, fetching]);

  // 初次加载：如果有当前值，则按值过滤以保证展示对应 label
  useEffect(() => {
    if (value !== undefined && value !== null) {
      // multiple 模式下，如果 value 是数组且有值，需要加载
      if (Array.isArray(value) && value.length > 0) {
        fetchList(undefined);
      } else if (!Array.isArray(value)) {
        fetchList(undefined);
      } else {
        // 空数组，加载默认列表
        fetchList('');
      }
    } else {
      fetchList('');
    }
  }, [model, value, withParams.map((item) => `${item.key}-${item.value}-${item.operator}`).join('-')]);

  const handleSearch = useCallback((q: string) => {
    setSearchValue(q);
    if (searchTimer.current) {
      clearTimeout(searchTimer.current as any);
    }
    searchTimer.current = setTimeout(() => {
      fetchList(q);
    }, 300);
  }, [fetchList]);

  const handleChange = useCallback((val: any, option: any) => {
    onChange?.(val, option);
  }, [onChange]);

  const notFoundContent = useMemo(() => (fetching ? <Spin size="small"/> : undefined), [fetching]);

  return (
    <Select
      className="min-w-12"
      mode={multiple ? 'multiple' : undefined}
      showSearch
      allowClear={allowClear}
      disabled={disabled}
      placeholder={placeholder ?? '请输入关键词搜索并选择'}
      filterOption={false}
      onSearch={handleSearch}
      searchValue={searchValue}
      loading={fetching}
      value={value as any}
      onChange={handleChange}
      options={options}
      notFoundContent={notFoundContent}
      {...rest}
    />
  );
};

export default ResourceSearchSelect;
