import React, {PropsWithChildren, useContext} from 'react';
import {ProFormDependency, ProProvider} from '@ant-design/pro-components';
import {DatePicker, Image, Input, Select, Space, Typography} from 'antd';
import ResourceSearchSelect from '@/components/ResourceSearchSelect';
import FileUploader from "@/components/FileUploader";
import ImageUploader from "@/components/ImageUploader";
import EditorComponent from "@/components/Editor";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

const {RangePicker} = DatePicker;

/**
 * ProValueTypeProvider
 * 将自定义的 valueType 映射集中封装，通过 ProProvider 提供给表单/表格。
 * 当前支持：foreign（基于 ResourceSearchSelect 的外键选择器）。
 */
const ProValueTypeProvider: React.FC<PropsWithChildren & { id?: any }> = ({children, id, ...args}) => {
  const values = useContext(ProProvider);

  const foreign = {
    render: (text: any) => text,
    renderFormItem: (_text: any, props: any, item: any, formInstance: any) => {
      const valueEnum = props?.valueEnum || {};
      if (valueEnum.dependency === false) {
        return <ResourceSearchSelect
          {...props?.fieldProps}
          multiple={valueEnum.multiple === true}
          model={valueEnum.model}
          labelField={valueEnum.labelField}
          keyField={valueEnum.keyField}
        />
      }

      return (
        <ProFormDependency
          // @ts-ignore
          name={children?.props?.columns?.map((col: any) => col.dataIndex).filter((i: any) => i != props.id) || []}>
          {(_: any, form: any) => {
            const data = form.getFieldsValue()
            const params: { key: string; value: any; operator: string; }[] = (id && valueEnum.foreignKey != "") ? [{
              key: valueEnum.foreignKey,
              value: id,
              operator: 'eq',
            }] : []
            for (const fieldsKey in data) {
              if (data[fieldsKey] && (fieldsKey != props.id) && fieldsKey.endsWith('_id')) {
                params.push({
                  key: fieldsKey,
                  value: data[fieldsKey],
                  operator: 'eq',
                })
              }
            }

            return <ResourceSearchSelect
              withParams={params}
              {...props?.fieldProps}
              multiple={valueEnum.multiple === true}
              model={valueEnum.model}
              labelField={valueEnum.labelField}
              keyField={valueEnum.keyField}
            />
          }}
        </ProFormDependency>

      );
    },
  };

  const file = {
    render: (text: any) => {
      if (!text) return '-';
      const url = String(text);
      return (
        <Space size={8}>
          <Typography.Link href={url} target="_blank" rel="noreferrer">
            {url}
          </Typography.Link>
        </Space>
      );
    },
    renderFormItem: (_text: any, props: any) => {
      return (
        <FileUploader{...props?.fieldProps}/>
      );
    },
  };

  const multipleSelect = {
    render: (text: any) => text,
    renderFormItem: (_text: any, props: any) => {
      const options = []
      for (const key in props?.valueEnum) {
        options.push({
          label: props?.valueEnum[key],
          value: key,
        })
      }
      return (
        <Select {...props?.fieldProps} options={options} mode="multiple"/>
      );
    },
  };

  const image = {
    render: (text: any) => {
      if (!text) return '-';
      const url = String(text);
      return (
        <Image
          className='max-w-full max-h-20'
          src={url}
          width={60}
          height={60}
          style={{objectFit: 'cover'}}
          preview={{src: url}}
        />
      );
    },
    renderFormItem: (_text: any, props: any) => {
      return (
        <ImageUploader{...props?.fieldProps}/>
      );
    },
  };

  const html = {
    render: (text: any) => text,
    renderFormItem: (_text: any, props: any) => {
      return (
        <EditorComponent {...props?.fieldProps}/>
      );
    },
  };

  const RANGE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

  const rangePicker = {
    render: (text: any) => text,
    renderFormItem: (_text: any, props: any, item: any, formInstance: any) => {
      const fieldKey = item?.dataIndex ?? props?.id;
      const rawValue = formInstance?.getFieldValue?.(fieldKey);
      const normalizedValue = Array.isArray(rawValue)
        ? rawValue.map((v: any) => (typeof v === 'string' ? dayjs.utc(v, RANGE_FORMAT) : dayjs(v).utc()))
        : undefined;

      const handleChange = (_dates: any) => {
        const utcStrings = Array.isArray(_dates)
          ? _dates.map((d: any) => dayjs(d).utc().format(RANGE_FORMAT))
          : [];
        if (props?.fieldProps?.onChange) {
          props.fieldProps.onChange(utcStrings);
        } else if (fieldKey) {
          formInstance?.setFieldsValue?.({[fieldKey]: utcStrings});
        }
      };

      return (
        <RangePicker
          showTime={{format: 'HH:mm:ss'}}
          format={RANGE_FORMAT}
          {...props?.fieldProps}
          value={normalizedValue}
          onChange={handleChange}
        />
      );
    },
  };


  const merged = {
    ...values,
    valueTypeMap: {
      ...(values?.valueTypeMap || {}),
      foreign,
      file,
      image,
      html,
      rangePicker,
      multipleSelect,
    },
  };

  return (
    <ProProvider.Provider value={merged as any}>{children}</ProProvider.Provider>
  );
};

export default ProValueTypeProvider;
