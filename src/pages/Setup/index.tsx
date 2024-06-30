import {
  FormInstance,
  FormListActionType,
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormItem,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from '@ant-design/pro-components';
import React, { useRef, useState } from 'react';
import { request, useRequest } from '@@/plugin-request';
import { Button, message } from 'antd';
import classNames from 'classnames';
import { InputTypes } from '@/components/ColumnTypes/ColumnType';
import SchemeForm, { SchemeFormAction } from '@/components/SchemeForm';

export default () => {
  const {
    data: resources,
    loading: resourceLoading,
    refresh,
  } = useRequest(() => request<{ data: any[] }>(`/api/admin/resource/list`));

  const [current, setCurrent] = useState<number>(0);
  const resource = resources ? resources[current] : undefined;
  const formRef = useRef<FormInstance>();
  const formListRef = useRef<FormListActionType>();
  const change = (index: number) => {
    setCurrent(index);
    formRef?.current?.setFieldsValue(resources ? resources[index] : {});
  };

  const schemeFormRef = useRef<SchemeFormAction>();

  return (
    <PageContainer loading={resourceLoading} title="初始化后台">
      <SchemeForm ref={schemeFormRef} />
      {resources && resource && (
        <div>
          <div className="flex justify-center items-end gap-3 w-full">
            {resources?.map((item: any, index: number) => (
              <div
                className={classNames('text-center', {
                  'font-bold text-black text-2xl': current === index,
                  'text-gray-800 cursor-pointer': current !== index,
                })}
                key={index}
                onClick={() => change(index)}
              >
                <div className="">{item.headerTitle}</div>
              </div>
            ))}
          </div>

          <ProForm
            formRef={formRef}
            className="w-full mt-5"
            name={resource?.headerTitle}
            initialValues={resource}
            onFinish={(values) => {
              request(`/api/admin/resource/${resource.name}/save`, {
                method: 'POST',
                data: values,
              }).then(() => {
                message.success('更新成功').then(() => {
                  if (current < resources.length - 1) {
                    change(current + 1);
                  }
                });
                refresh();
              });
            }}
          >
            <ProFormText name="name" label="表名" hidden />
            <ProFormText name="headerTitle" label="标题" />
            <ProFormText name="subTitle" label="子标题" />
            <ProFormSelect
              name="rowKey"
              label="主键"
              options={resource?.columns.map((item: any) => ({
                value: item.dataIndex,
                label: item.dataIndex,
              }))}
            />
            <ProFormSelect
              name="actions"
              label="操作"
              mode="multiple"
              initialValue={['create', 'export', 'edit', 'delete']}
              options={[
                { label: '新建', value: 'create' },
                { label: '导出', value: 'export' },
                { label: '编辑', value: 'edit' },
                { label: '删除', value: 'delete' },
              ]}
            />

            <ProFormList name="columns" required label="字段描述" actionRef={formListRef}>
              {(meta, index) => {
                return (
                  <ProFormGroup>
                    <ProFormText name="dataIndex" label="字段" disabled />
                    <ProFormText name="title" label="显示名" rules={[{ required: true }]} />
                    <ProFormSelect
                      name="valueType"
                      label="数据类型"
                      initialValue="text"
                      onChange={(e) => {
                        const type = InputTypes.find((item) => item.value === e);
                        if (type && type.params) {
                          schemeFormRef.current?.collectData({
                            columns: type?.params(resources),
                            onFinish(values: Record<string, any>): void {
                              formRef.current?.setFieldValue(
                                ['columns', index, 'valueTypeParams'],
                                values,
                              );
                            },
                            title: type?.label,
                          });
                        }
                      }}
                      options={InputTypes}
                    />
                    <ProFormText name="valueTypeParams" label="数据类型参数" hidden />

                    <ProFormSwitch name="sorter" label="可排序" />
                    <ProFormText
                      name="tooltip"
                      label="工具提示"
                      tooltip="类似这样的字段上方的提示信息"
                    />
                    <ProFormSwitch name="copyable" label="可复制" />
                    <ProFormSwitch name="search" label="可搜索" />

                    <ProFormDependency name={['search']}>
                      {({ search }) => {
                        return (
                          search && (
                            <ProFormDigit
                              name="order"
                              label="查询表单中的排序"
                              placeholder="查询表单中的权重，权重大排序靠前"
                            />
                          )
                        );
                      }}
                    </ProFormDependency>

                    <ProFormSwitch name="hideInTable" label="在列表隐藏" />
                    {/*<ProFormSelect name="render" label="渲染函数" options={[]}/>*/}
                    <ProFormList name="valueEnum" label="枚举">
                      <ProFormGroup>
                        <ProFormText name="value" label="枚举值" rules={[{ required: true }]} />
                        <ProFormText name="label" label="显示名" rules={[{ required: true }]} />
                      </ProFormGroup>
                    </ProFormList>

                    <ProFormItem label="排序">
                      <ProFormDependency name={['*']}>
                        {(args) => {
                          return (
                            args && (
                              <Button.Group>
                                {args.columns.length > 1 && (
                                  <Button
                                    onClick={() =>
                                      formListRef?.current?.move(
                                        args.columns.length - 1,
                                        args.columns.length - 2,
                                      )
                                    }
                                  >
                                    上移
                                  </Button>
                                )}

                                <Button
                                  onClick={() =>
                                    formListRef?.current?.move(
                                      args.columns.length - 1,
                                      args.columns.length,
                                    )
                                  }
                                >
                                  下移
                                </Button>
                              </Button.Group>
                            )
                          );
                        }}
                      </ProFormDependency>
                    </ProFormItem>
                  </ProFormGroup>
                );
              }}
            </ProFormList>
          </ProForm>

          <div className="mt-5">
            <Button.Group>
              {current > 0 && <Button onClick={() => change(current - 1)}>上一个</Button>}
              {current < resources.length - 1 && (
                <Button type="primary" onClick={() => change(current + 1)}>
                  下一个
                </Button>
              )}
            </Button.Group>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
