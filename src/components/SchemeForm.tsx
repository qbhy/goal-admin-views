import { forwardRef, useImperativeHandle, useState } from 'react';
import { Modal } from 'antd';
import { BetaSchemaForm, ProColumns } from '@ant-design/pro-components';

type SchemeFormProps = {
  title?: string;
  columns?: ProColumns[];
  visible?: boolean;
  onFinish?: (values: Record<string, any>) => void;
};
export type SchemeFormAction = {
  collectData(props: SchemeFormProps): void;
};

export default forwardRef<SchemeFormAction | undefined, SchemeFormProps>((_, ref) => {
  const [props, setProps] = useState<SchemeFormProps>();
  useImperativeHandle(
    ref,
    () => ({
      collectData(params) {
        setProps({ ...params, visible: true });
      },
    }),
    [],
  );
  const { title, columns, onFinish, visible } = props || {};
  return (
    <Modal
      title={title}
      open={visible}
      closable={false}
      okButtonProps={{ hidden: true }}
      cancelButtonProps={{ hidden: true }}
    >
      <BetaSchemaForm<Record<string, any>>
        columns={columns as []}
        onFinish={(values) => {
          if (onFinish) onFinish(values);
          setProps({ ...props, visible: false });
        }}
      />
    </Modal>
  );
});
