import { ActionType, PageContainer, ProTable, ProTableProps } from '@ant-design/pro-components';
import React, { useEffect, useRef, useState } from 'react';
import { request, useRequest } from '@@/plugin-request';
import { useParams } from '@@/exports';
import { Button, Dropdown, Modal } from 'antd';
import ResourceEditor, { GoalProColumn, ResourceEditorAction } from '@/components/ResourceEditor';
import { InputTypes } from '@/components/ColumnTypes/ColumnType';

type ResourceMeta = {
  actions: string[];
  headerTitle?: string;
  subTitle?: string;
  columns?: GoalProColumn[];
} & ProTableProps<any, any> &
  Record<string, any>;

export default () => {
  const routeParams = useParams();
  const [columns, setColumns] = useState<GoalProColumn[]>([]);
  const resourceName = routeParams['name'];
  const {
    data: meta,
    loading,
    refresh,
  } = useRequest(() =>
    request<{ data: ResourceMeta }>(`/api/admin/resource/${resourceName}/meta`).then((res) => {
      setColumns(res.data.columns || []);
      return res;
    }),
  );
  const tableRef = useRef<ActionType>(null);

  useEffect(() => {
    refresh();
    tableRef.current?.reload();
  }, [routeParams]);

  const { actions } = meta || {};
  const [requestParams, setRequestParams] = useState<any>();
  const [showEditor, setShowEditor] = useState<boolean>(false);
  const editorRef = useRef<ResourceEditorAction>();
  const tableColumns = columns
    ?.filter((item) => !item.hideInTable)
    .map((item) => {
      const type = InputTypes.find((type) => item.valueType === type.value);
      if (type?.displayRender) {
        item.render = (text, data, index) => {
          return type?.displayRender ? type.displayRender(text, data, index, item) : text;
        };
      }
      return item;
    });
  const actionsEditorText = { edit: '编辑', delete: '删除' };

  tableColumns?.push({
    title: '操作',
    render: (text, data, i) => {
      const items: any = [];
      const handles: Record<string, () => void> = {};

      meta?.actions?.forEach((item) => {
        switch (item) {
          case 'edit':
            items.push({
              key: item,
              label: actionsEditorText[item],
            });
            handles[item] = () => {
              setShowEditor(true);
              editorRef.current?.setEditForm(data);
            };
            break;
          case 'delete':
            items.push({
              key: item,
              label: actionsEditorText[item],
            });
            handles[item] = () =>
              Modal.confirm({
                type: 'warn',
                title: '确定删除此数据吗？',
                okText: '确定删除',
                cancelText: '取消',
                maskClosable: true,
                okType: 'danger',
                onOk: () =>
                  request(`/api/admin/resource/${resourceName}/delete`, { data, method: 'POST' }),
                okCancel: true,
              });
            break;
        }
      });
      return (
        <Dropdown key={i} menu={{ items: items, onClick: (v) => handles[v.key]() }}>
          <Button>操作</Button>
        </Dropdown>
      );
    },
  });

  console.log('tableColumns', tableColumns);

  return (
    <PageContainer loading={loading} title={meta?.headerTitle} subTitle={meta?.subTitle}>
      <ResourceEditor
        ref={editorRef}
        visible={showEditor}
        columns={columns}
        onCancel={() => setShowEditor(false)}
        title={meta?.headerTitle}
      />

      <ProTable
        actionRef={tableRef}
        {...meta}
        columns={tableColumns}
        toolbar={{
          actions: actions?.map((item) => {
            switch (item) {
              case 'create':
                return (
                  <Button
                    key={item}
                    onClick={() => {
                      const initialData: Record<string, any> = {};
                      meta?.columns?.forEach((col) => {
                        if (col.hideInForm) return;
                        initialData[col.dataIndex] = col.initialValue;
                      });
                      editorRef.current?.setCreateForm(initialData);
                      setShowEditor(true);
                    }}
                  >
                    创建
                  </Button>
                );
              case 'export':
                return (
                  <Button
                    key={item}
                    onClick={() =>
                      request(`/api/admin/resource/${resourceName}/export`, {
                        params: requestParams,
                      })
                    }
                  >
                    导出
                  </Button>
                );
            }
            return undefined;
          }),
        }}
        search={{}}
        request={(params, sort, filter) => {
          const { current, pageSize, ...p } = params;
          const d: Record<string, any> = {};
          // eslint-disable-next-line guard-for-in
          for (const pKey in p) {
            if (p[pKey] !== '') {
              // d[pKey] = {condition: 'like', value: p[pKey]};
              d[pKey] = p[pKey];
            }
          }
          const tmpParams = { current, pageSize, sort, filter: { ...filter, ...d } };
          setRequestParams(tmpParams);
          return request(`/api/admin/resource/${routeParams['name']}/list`, {
            params: tmpParams,
          }).then((res) => {
            setColumns(
              columns.map((column) => {
                if (res.with[column.dataIndex]) {
                  column.valueEnum = {};
                  for (const item of res.with[column.dataIndex]) {
                    column.valueEnum[item['value']] = item['label'];
                  }
                }
                return column;
              }),
            );
            console.log('request resources list', res);
            return res;
          });
        }}
      />
    </PageContainer>
  );
};
