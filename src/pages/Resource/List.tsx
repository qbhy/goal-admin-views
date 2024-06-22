import { ActionType, PageContainer, ProTable } from '@ant-design/pro-components';
import React, { useEffect, useRef } from 'react';
import { request, useRequest } from '@@/plugin-request';
import { useParams } from '@@/exports';

export default () => {
  const routeParams = useParams();
  const {
    data: meta,
    loading,
    refresh,
  } = useRequest(() => request(`/api/admin/resource/${routeParams['name']}/meta`));
  const tableRef = useRef<ActionType>(null);

  useEffect(() => {
    refresh();
    tableRef.current?.reload();
  }, [routeParams]);

  console.log('meta', meta);

  return (
    <PageContainer loading={loading} title={meta?.title} subTitle={meta?.subTitle}>
      <ProTable
        actionRef={tableRef}
        {...meta}
        request={(params, sort, filter) => {
          return request(`/api/admin/resource/${routeParams['name']}/list`, {
            params: { ...params, sort, filter },
          });
        }}
      />
    </PageContainer>
  );
};
