import {createResource, findResource, updateResource} from '@/services/resource';
import {BetaSchemaForm, ProColumns, ProFormInstance} from '@ant-design/pro-components';
import {message, Modal} from 'antd';
import React, {ReactNode, useRef} from 'react';
import ProValueTypeProvider from '@/components/ProValueTypeProvider';
import {resolveColumns, ResourceColumn} from "@/utils";
import { useAccess } from '@umijs/max';


// 遍历所有 Columns 和 子 Columns，将 valueType=foreign 的 col 的 valueEnum 值设置为该 col 的 foreignKey

export type ResourceEditorProps = {
  resourceName: string;
  rowKey: string;
  columns: ResourceColumn[];
  columnEditorMapper?: (
    column: ProColumns,
    idx: number,
    columns: ProColumns[],
  ) => ReactNode | null | false;
  open: boolean;
  copy?: boolean;
  onOpenChange: (open: boolean) => void;
  identity?: string;
  defaultValues?: Record<string, any>;
  width?: number;
  expect?:
    | (string | number | (string | number)[])[]
    | {
    create?: (string | number | (string | number)[])[];
    update?: (string | number | (string | number)[])[];
  };
};

const ResourceEdit = React.memo<ResourceEditorProps>(
  ({
     resourceName,
     columns,
     rowKey,
     open,
     copy = false,
     identity,
     onOpenChange,
     columnEditorMapper,
     defaultValues = {},
     width,
     expect,
   }) => {
    // @ts-ignore
    const formRef = useRef<ProFormInstance>();
    const [messageApi, contextHolder] = message.useMessage();
    const access = useAccess();
    return (
      <ProValueTypeProvider id={identity}>
        {contextHolder}
        <BetaSchemaForm
          columns={resolveColumns(columns)}
          layoutType={'ModalForm'}
          key={(identity ? 'edit' : 'create') + (open ? '-open' : '-close')}
          width={width}
          formRef={formRef}
          open={open}
          title={identity ? (copy ? '复制' : '编辑') : '新建'}
          modalProps={{destroyOnHidden: true}}
          disabled={!access.canWrite}
          onFinishFailed={(e) => {
            message.error(e.errorFields[0].errors[0]);
          }}
          onFinish={async (value: any) => {
            if (!access.canWrite) {
              messageApi.warning('当前角色不可提交变更');
              return false;
            }
            const confirmed = await new Promise<boolean>((resolve) => {
              Modal.confirm({
                title: identity && !copy ? '确认更新该资源？' : '确认创建该资源？',
                onOk: () => resolve(true),
                onCancel: () => resolve(false),
              });
            });
            if (!confirmed) return false;
            const values: Record<string, any> = {...defaultValues};
            for (const key in value) {
              if (columns.find((col) => col.dataIndex === key)) {
                values[key] = value[key];
              }
            }
            if (identity) {
              values[rowKey] = identity
            }
            const result = await (identity && !copy ? updateResource : createResource)(resourceName, values);
            if (result.success || result.id) {
              messageApi.success(value[rowKey] ? '更新成功！' : '创建成功!');
            } else {
              messageApi.error(result.message);
              throw new Error(result.message);
            }
            return true;
          }}
          params={{id: identity}}
          request={async (values) => {
            if (values.id) {
              const res = await findResource(resourceName, values.id);
              if (copy) {
                delete res['id'];
              }
              return res;
            }
            return defaultValues;
          }}
          onValuesChange={(changedValues, allValues) => {
            console.log(changedValues, allValues);
          }}
          onOpenChange={onOpenChange}
          submitter={{
            searchConfig: { submitText: identity && !copy ? '确认更新' : '确认创建' },
            submitButtonProps: { disabled: !access.canWrite },
          }}
        >
        </BetaSchemaForm>
      </ProValueTypeProvider>
    );
  },
);

export default ResourceEdit;
