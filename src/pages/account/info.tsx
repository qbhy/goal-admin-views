import React from 'react';
import { PageContainer, ProDescriptions } from '@ant-design/pro-components';
import { Spin, message } from 'antd';
import { history } from '@umijs/max';
import { currentUser as fetchCurrentUser } from '@/services/ant-design-pro/api';

const AccountInfoPage: React.FC = () => {
  const [loading, setLoading] = React.useState<boolean>(true);
  const [data, setData] = React.useState<API.CurrentUser | undefined>(undefined);

  React.useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const resp = await fetchCurrentUser({ skipErrorHandler: true });
        setData(resp?.data);
      } catch (e: any) {
        message.warning('登录已过期，请重新登录');
        history.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  const dataSource = {
    name: data?.name || '-',
    userid: data?.userid || '-',
    email: data?.email || '-',
    phone: data?.phone || '-',
    access: data?.access || '-',
    avatar: data?.avatar || '',
  };

  return (
    <PageContainer header={{ title: '账号信息' }}>
      {loading ? (
        <div style={{ padding: 24 }}>
          <Spin />
        </div>
      ) : (
        <ProDescriptions column={2} title={data?.name} dataSource={dataSource}>
          <ProDescriptions.Item label="用户ID" dataIndex="userid" />
          <ProDescriptions.Item label="姓名/昵称" dataIndex="name" />
          <ProDescriptions.Item label="邮箱" dataIndex="email" />
          <ProDescriptions.Item label="手机号" dataIndex="phone" />
          <ProDescriptions.Item label="角色" dataIndex="access" />
          <ProDescriptions.Item label="头像" dataIndex="avatar" valueType="avatar" />
        </ProDescriptions>
      )}
    </PageContainer>
  );
};

export default AccountInfoPage;
