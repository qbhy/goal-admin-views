import React from 'react';
import { PageContainer, ProForm, ProFormText, ProFormSelect } from '@ant-design/pro-components';
import { Card, message } from 'antd';
import { history } from '@umijs/max';
import { adminCreateAdmin } from '@/services/ant-design-pro/api';

const CreateAdminPage: React.FC = () => {
  const handleSubmit = async (values: any) => {
    const payload = {
      username: values.username,
      password: values.password,
      nickname: values.nickname,
      avatar: values.avatar,
      phone: values.phone,
      email: values.email,
      role: values.role,
    } as any;

    const resp = await adminCreateAdmin(payload);
    const code = (resp as any)?.code;
    const msg = (resp as any)?.msg || '';
    if (code === 0) {
      message.success('创建成功');
      history.push('/admin/admins');
    } else {
      message.error(msg || '创建失败');
    }
  };

  return (
    <PageContainer header={{ title: '新建管理员' }}>
      <Card>
        <ProForm onFinish={handleSubmit} submitter={{ searchConfig: { submitText: '提交' } }}>
          <ProFormText
            name="username"
            label="账号"
            placeholder="请输入账号"
            rules={[{ required: true, message: '账号为必填项' }]}
          />
          <ProFormText.Password
            name="password"
            label="密码"
            placeholder="请输入密码"
            rules={[{ required: true, message: '密码为必填项' }]}
          />
          <ProFormText name="nickname" label="昵称" placeholder="可选" />
          <ProFormText name="avatar" label="头像地址" placeholder="可选，填写图片 URL" />
          <ProFormText name="email" label="邮箱" placeholder="可选" />
          <ProFormSelect
            name="role"
            label="角色"
            options={[
              { label: '管理员（admin）', value: 'admin' },
              { label: '超级管理员（super）', value: 'super' },
              { label: '观察员（observer）', value: 'observer' },
              { label: '客服（customerservice）', value: 'customerservice' },
            ]}
            initialValue="admin"
          />
        </ProForm>
      </Card>
    </PageContainer>
  );
};

export default CreateAdminPage;
