import {
  PageContainer,
  ProForm,
  ProFormGroup,
  ProFormList,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
  ProTableProps,
} from '@ant-design/pro-components';
import React, { useEffect, useState } from 'react';
import { request, useRequest } from '@@/plugin-request';
import { useParams } from '@@/exports';
import { InputTypes } from '@/services/ant-design-pro/api';
import { Button, message } from 'antd';

export default () => {
  const routeParams: ProTableProps<any, any> = useParams();
  const { data: resources, loading: resourceLoading } = useRequest(() =>
    request<{ data: any[] }>(`/api/admin/resource/list`),
  );

  useEffect(() => {}, [routeParams]);

  const [current, setCurrent] = useState<number>(0);
  const resource = resources ? resources[current] : undefined;

  return (
    <PageContainer loading={resourceLoading} title="初始化后台">
      {resources && resource && (
        <div>
          <div className="flex justify-center items-end gap-3 w-full">
            {current > 0 && (
              <div className="text-center text-gray-600">
                <div className="text-xl font-bold">{resources[current - 1].headerTitle}</div>
                <div className="text-xs">上一个</div>
              </div>
            )}

            <div className="text-center font-bold">
              <div className="text-2xl font-bold">{resource.headerTitle}</div>
              <div>当前</div>
            </div>

            {current < resources.length - 1 && (
              <div className="text-center text-gray-600">
                <div className="text-xl font-bold">{resources[current + 1].headerTitle}</div>
                <div className="text-xs">下一个</div>
              </div>
            )}
          </div>

          <ProForm
            className="w-full mt-5"
            name={resource?.headerTitle}
            initialValues={resource}
            onFinish={(values) => {
              message.success('下一个');
              console.log(values);
            }}
          >
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
                <ProFormText name="tooltip" label="工具提示" />
                <ProFormSwitch name="copyable" label="可复制" />
                <ProFormSwitch name="search" label="可搜索" initialValue={true} />
                <ProFormSwitch name="hideInTable" label="在列表隐藏" />
              </ProFormGroup>
            </ProFormList>
          </ProForm>

          <div className="mt-5">
            <Button.Group>
              {current > 0 && <Button onClick={() => setCurrent(current - 1)}>上一个</Button>}
              {current < resources.length - 1 && (
                <Button type="primary" onClick={() => setCurrent(current + 1)}>
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
