import { ColumnType } from '@/components/ColumnTypes/ColumnType';
import { ProColumns, ProFormSelect } from '@ant-design/pro-components';
import { request } from '@@/plugin-request';
import { Tooltip } from 'antd';

export const DatabaseType: ColumnType = {
  value: 'database',
  label: '数据库',
  displayRender: (text, item: Record<string, any>, index, column) => {
    console.log('displayRender', text, item, index, column);
    if (typeof column.valueEnum === 'object') {
      let values = [item[column.dataIndex]];
      if (column.valueTypeParams?.multiple) {
        try {
          values = JSON.parse(item[column.dataIndex]);
        } catch (e) {}
      }
      return (
        <div className="flex gap-2">
          {values.map((item, index) => (
            <Tooltip title={item} key={index}>
              {/* @ts-ignore*/}
              <div className="px-2 py-1 rounded bg-gray-100 text-black">
                {column.valueEnum[item] || item}
              </div>
            </Tooltip>
          ))}
        </div>
      );
    }
    return text;
  },
  formRender: (col) => {
    return (
      <ProFormSelect
        request={() =>
          request(`/api/admin/resource/${col.valueTypeParams?.table}/values`, {
            params: col.valueTypeParams,
          }).then((res) => res.data)
        }
        label={col.title}
        name={col.dataIndex}
      />
    );
  },
  params: (resources: any[]): ProColumns[] => {
    return [
      {
        dataIndex: 'table',
        title: 'belongsTo',
        request: async () =>
          resources.map((item) => ({
            value: item.name,
            label: item.name,
          })),
        formItemProps: {
          rules: [{ required: true, message: '请选择数据来源' }],
        },
      },
      {
        dataIndex: 'value',
        title: '值字段',
        dependencies: ['table'],
        request: async ({ table }) => {
          return resources
            ?.find((item) => item.name === table)
            ?.columns.filter((col: any) => !col.hideInForm && col.dataIndex.length > 0)
            .map((col: any) => ({
              label: col.dataIndex,
              value: col.dataIndex,
            }));
        },
        formItemProps: {
          rules: [{ required: true, message: '请选择字段' }],
        },
      },
      {
        dataIndex: 'label',
        title: '显示字段',
        dependencies: ['table'],
        request: async ({ table }) => {
          return resources
            ?.find((item) => item.name === table)
            ?.columns.filter((col: any) => !col.hideInForm && col.dataIndex.length > 0)
            .map((col: any) => ({
              label: col.dataIndex,
              value: col.dataIndex,
            }));
        },
        formItemProps: {
          tooltip: '用于在列表中显示',
          rules: [{ required: true, message: '请选择字段' }],
        },
      },
      {
        dataIndex: 'multiple',
        title: '可多选',
        tooltip: '将已数组形式存储（如：[1]）',
        initialValue: false,
        formItemProps: {
          rules: [{ required: true }],
        },
        valueType: 'switch',
      },
    ];
  },
};
