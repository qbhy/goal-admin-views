import { ColumnType } from '@/components/ColumnTypes/ColumnType';
import { ProFormSelect } from '@ant-design/pro-components';

export const DatabaseType: ColumnType = {
  value: 'database',
  label: '数据库',
  displayRender: () => '数据库 xxx',
  formRender: (col) => {
    return <ProFormSelect options={[]} label={col.title} name={col.dataIndex} />;
  },
};
