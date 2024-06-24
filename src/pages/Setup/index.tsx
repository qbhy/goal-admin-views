import {
  FormInstance,
  PageContainer,
  ProForm,
  ProFormDependency,
  ProFormDigit,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTableProps,
} from '@ant-design/pro-components';
import React, { useEffect, useRef, useState } from 'react';
import { request, useRequest } from '@@/plugin-request';
import { useParams } from '@@/exports';
import { InputTypes } from '@/services/ant-design-pro/api';
import { Button, message } from 'antd';
import classNames from 'classnames';

export default () => {
  const routeParams: ProTableProps<any, any> = useParams();
  const {
    data: resources,
    loading: resourceLoading,
    refresh,
  } = useRequest(() => request<{ data: any[] }>(`/api/admin/resource/list`));

  useEffect(() => {}, [routeParams]);

  const [current, setCurrent] = useState<number>(0);
  const resource = resources ? resources[current] : undefined;
  const formRef = useRef<FormInstance>();
  const change = (index: number) => {
    setCurrent(index);
    formRef?.current?.setFieldsValue(resources ? resources[index] : {});
  };

  console.log('resource', resource);

  return (
    <PageContainer loading={resourceLoading} title="初始化后台">
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

            <ProFormList name="columns" required label="字段描述">
              <ProFormGroup>
                <ProFormText name="dataIndex" label="字段" disabled />
                <ProFormText name="title" label="显示名" rules={[{ required: true }]} />
                <ProFormSelect
                  name="valueType"
                  label="数据类型"
                  initialValue="text"
                  options={InputTypes}
                />
                <ProFormSwitch name="sorter" label="可排序" />
                <ProFormText
                  name="tooltip"
                  label="工具提示"
                  tooltip="类似这样的字段上方的提示信息"
                />
                <ProFormSwitch name="copyable" label="可复制" />
                <ProFormSwitch name="search" label="可搜索" initialValue={true} />

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
                <ProFormSelect name="render" label="渲染函数" options={[]} />
                <ProFormList name="valueEnum" label="枚举">
                  <ProFormGroup>
                    <ProFormText name="value" label="枚举值" rules={[{ required: true }]} />
                    <ProFormText name="label" label="显示名" rules={[{ required: true }]} />
                  </ProFormGroup>
                </ProFormList>
              </ProFormGroup>
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
