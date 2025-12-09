import React, {useRef, useState} from 'react';
import {Button, Space} from 'antd';
import {BetaSchemaForm, ProFormInstance} from '@ant-design/pro-components';
import {DownOutlined, UpOutlined} from '@ant-design/icons';
import {ResourceColumn} from '@/utils';

// 专门为搜索表单处理列类型转换的函数
const resolveSearchColumns = (columns: ResourceColumn[]) => {
  const walk = (cols: ResourceColumn[]): ResourceColumn[] =>
    (cols || []).map((col) => {
      const next = {...col} as ResourceColumn;

      // 将 URL 类型转换为 text 类型，用于搜索表单
      if (['url', 'image', 'video', 'file'].includes(next?.valueType || '')) {
        next.valueType = 'text';
      }

      // 将 URL 类型转换为 text 类型，用于搜索表单
      if (next.valueType === 'dateTime') {
        next.valueType = 'rangePicker';
      }

      // 当 valueType 为 foreign，且存在 foreignKey 时，将 valueEnum 设置为 foreignKey（若尚未设置）
      if (next?.valueType === 'foreign' && (next as any).foreignKey) {
        if (!next.valueEnum) {
          next.valueEnum = {...((next as any).foreignKey || {}), dependency: false, multiple: true, operator: 'in'};
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

      return {
        ...next, hideInForm: false
      };
    });

  return walk(columns);
};

interface CustomSearchFormProps {
  columns: ResourceColumn[];
  onSearch: (values: any) => void;
  onReset: () => void;
}

const CustomSearchForm: React.FC<CustomSearchFormProps> = (
  {
    columns,
    onSearch,
    onReset,
  }) => {
  const [expanded, setExpanded] = useState(false);
  const formRef = useRef<ProFormInstance>(null);

  // 移除自动搜索功能，只在点击搜索按钮时触发搜索

  // 如果没有列数据，显示加载状态
  if (!columns || columns.length === 0) {
    return (
      <div className="bg-white p-3 rounded-lg">
        <div>正在加载搜索表单...</div>
      </div>
    );
  }

  const searchableColumns = columns.filter(col => !col.hideInSearch);

  // 如果没有可搜索的列，显示提示
  if (searchableColumns.length === 0) {
    return (
      <div className="bg-white p-3 rounded-lg">
        <div>暂无可搜索的字段</div>
      </div>
    );
  }

  // 默认显示的列（前3个）
  const defaultColumns = searchableColumns.slice(0, 3);
  // 展开后显示的列（所有）
  const expandedColumns = searchableColumns;

  // 当前显示的列
  const displayColumns = expanded ? searchableColumns : defaultColumns;

  const handleSearch = () => {
    const values = formRef.current?.getFieldsValue();
    const filteredValues = Object.keys(values || {}).reduce((acc, key) => {
      if (values[key] !== undefined && values[key] !== null && values[key] !== '') {
        acc[key] = values[key];
      }
      return acc;
    }, {} as any);
    onSearch(filteredValues);
  };

  const handleReset = () => {
    formRef.current?.resetFields();
    onReset();
  };

  return (
    <div className="bg-white p-3 rounded-lg">
      <BetaSchemaForm
        columns={resolveSearchColumns(displayColumns)}
        layoutType="QueryFilter"
        // 使用 QueryFilter 的折叠控制，避免只显示前三个字段的问题
        // 当 expanded 为 true 时，显示全部字段；为 false 时，仅显示默认数量
        collapsed={!expanded}
        defaultColsNumber={3}
        formRef={formRef}
        submitter={{
          render: () => (
            <Space>
              <Button type="primary" onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              {expandedColumns.length > 0 && (
                <Button
                  type="link"
                  onClick={() => setExpanded(!expanded)}
                  icon={expanded ? <UpOutlined/> : <DownOutlined/>}
                >
                  {expanded ? '收起' : '展开'}
                </Button>
              )}
            </Space>
          ),
        }}
      />
    </div>
  );
};

export default CustomSearchForm;
