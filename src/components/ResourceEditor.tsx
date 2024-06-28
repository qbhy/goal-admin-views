import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Modal } from 'antd';
import { ProColumns, ProForm, ProFormInstance, ProFormText } from '@ant-design/pro-components';
import { InputTypes } from '@/components/ColumnTypes/ColumnType';

export type GoalProColumn = ProColumns & {
  title?: string;
  rules?: any[];
  valueTypeParams?: Record<string, any>;
};

export type ResourceEditorProps = {
  visible?: boolean;
  title?: string;
  onCancel?: () => void;
  columns?: GoalProColumn[];
};

export type ResourceEditorAction = {
  setEditForm(values: Record<string, any>): void;
  setCreateForm(values: Record<string, any>): void;
};

const ResourceEditor = forwardRef<ResourceEditorAction | undefined, ResourceEditorProps>(
  ({ visible = false, onCancel, title, columns = [] }, ref) => {
    const form = useRef<ProFormInstance>();
    const [editType, setEditType] = React.useState<'edit' | 'create'>('create');

    useImperativeHandle(
      ref,
      () => ({
        setCreateForm(values: Record<string, any>) {
          setEditType('create');
          form.current?.setFieldsValue(values);
        },
        setEditForm(values: Record<string, any>) {
          setEditType('edit');
          form.current?.setFieldsValue(values);
        },
      }),
      [],
    );

    return (
      <Modal width="80%" maskClosable open={visible} title={title} onCancel={onCancel}>
        <ProForm
          title={editType}
          formRef={form}
          onFinish={(values) => {
            console.log(values);
          }}
        >
          {columns.map((col, index) => {
            if (col.hideInForm || col.dataIndex.length === 0) return undefined;
            const type = InputTypes.find((type) => col.valueType === type.value);
            return type?.formRender ? (
              type?.formRender(col, col.valueTypeParams || {})
            ) : (
              <ProFormText key={index} label={col.title} rules={col.rules} name={col.dataIndex} />
            );
          })}
        </ProForm>
      </Modal>
    );
  },
);

export default ResourceEditor;
