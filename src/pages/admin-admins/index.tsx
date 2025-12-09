import React, { useRef, useState } from 'react';
import { PageContainer, ProTable, ModalForm, ProFormText, ProFormSelect, type ProColumns, type ActionType } from '@ant-design/pro-components';
import { Avatar, Button, Space, Popconfirm, message, Tag, Modal, Descriptions } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { adminAdmins, adminDeleteAdmin, adminUpdateAdmin } from '@/services/ant-design-pro/api';
import { useModel, history } from '@umijs/max';

type AdminItem = {
  id: number;
  username: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  role: 'super' | 'admin';
  created_at?: string;
};

const AdminsPage: React.FC = () => {
  const actionRef = useRef<ActionType>(null);
  const [selectedRows, setSelectedRows] = useState<AdminItem[]>([]);
  const [editing, setEditing] = useState<AdminItem | null>(null);
  const [detail, setDetail] = useState<{ open: boolean; identity?: number; data?: AdminItem }>({ open: false });
  const { initialState } = useModel('@@initialState');
  const currentAccess = initialState?.currentUser?.access;

  const openDetail = (record: AdminItem) => {
    setDetail({ open: true, identity: record.id, data: record });
  };

  const columns: ProColumns<AdminItem>[] = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    {
      title: '头像',
      dataIndex: 'avatar',
      hideInSearch: true,
      render: (_, record) => (record?.avatar ? <Avatar src={record.avatar} /> : '-'),
      width: 80,
    },
    { title: '账号', dataIndex: 'username' },
    { title: '昵称', dataIndex: 'nickname', ellipsis: true },
    { title: '邮箱', dataIndex: 'email' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (_, record) => (
        <Tag color={record.role === 'super' ? 'red' : 'blue'}>{record.role}</Tag>
      ),
    },
    { title: '创建时间', dataIndex: 'created_at', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => {
        const canDelete = record.role !== 'super';
        return [
          currentAccess === 'super' ? (
            <a key="edit" onClick={() => setEditing(record)}>编辑</a>
          ) : null,
          <a key="detail" onClick={() => openDetail(record)}>资料</a>,
          canDelete ? (
            <Popconfirm
              key="delete"
              title={`确认删除管理员 ${record.username}？`}
              okText="删除"
              cancelText="取消"
              onConfirm={async () => {
                const resp = await adminDeleteAdmin({ id: record.id });
                const code = (resp as any)?.code;
                const msg = (resp as any)?.msg || '';
                if (code === 0) {
                  message.success('删除成功');
                  actionRef.current?.reload();
                } else {
                  message.error(msg || '删除失败');
                }
              }}
            >
              <Button size="small" danger type="link" icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          ) : (
            <span key="no-delete" style={{ color: '#999' }}>不可删除</span>
          ),
        ];
      },
    },
  ];

  return (
    <PageContainer header={{ title: '管理员管理' }}>
      {currentAccess === 'super' ? (
        <>
          <ProTable<AdminItem>
            rowKey="id"
            actionRef={actionRef}
            columns={columns}
            rowSelection={{
              onChange: (_, rows) => setSelectedRows(rows),
            }}
            toolBarRender={() => (currentAccess === 'super' ? [
              <Space key="toolbar">
                <Button type="primary" onClick={() => history.push('/admin/admins/create')}>
                  新建管理员
                </Button>
                <Button disabled>{`选择了 ${selectedRows.length} 项`}</Button>
              </Space>,
            ] : [])}
            search={{ labelWidth: 'auto' }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            request={async (params) => {
              const resp = await adminAdmins({
                current: params.current,
                pageSize: params.pageSize,
                username: (params as any).username,
                nickname: (params as any).nickname,
                phone: (params as any).phone,
                email: (params as any).email,
              });
              return resp as any;
            }}
          />
          <Modal
            title="管理员详情"
            open={detail.open}
            onCancel={() => setDetail({ open: false })}
            footer={null}
          >
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="ID">{detail.data?.id ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="头像">{detail.data?.avatar ? <Avatar src={detail.data.avatar} /> : '-'}</Descriptions.Item>
              <Descriptions.Item label="账号">{detail.data?.username ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="昵称">{detail.data?.nickname ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="邮箱">{detail.data?.email ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="角色">{detail.data ? <Tag color={detail.data.role === 'super' ? 'red' : 'blue'}>{detail.data.role}</Tag> : '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.data?.created_at ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Modal>
          <ModalForm
            title="编辑管理员"
            open={!!editing}
            onOpenChange={(open) => !open && setEditing(null)}
            initialValues={editing || {}}
            onFinish={async (values) => {
              if (!editing) return true;
              const payload: any = { id: editing.id };
              ['username','nickname','avatar','phone','email','role','password'].forEach((k) => {
                const v = (values as any)[k];
                if (typeof v === 'string' && v.length > 0) payload[k] = v;
              });
              const resp = await adminUpdateAdmin(payload);
              const code = (resp as any)?.code;
              const msg = (resp as any)?.msg || '';
              if (code === 0) {
                message.success('更新成功');
                setEditing(null);
                actionRef.current?.reload();
                return true;
              }
              message.error(msg || '更新失败');
              return false;
            }}
          >
            <ProFormText name="username" label="账号" placeholder="输入账号" />
            <ProFormText.Password name="password" label="新密码（可选）" placeholder="不填则不修改" />
            <ProFormText name="nickname" label="昵称" />
            <ProFormText name="avatar" label="头像URL" />
            <ProFormText name="email" label="邮箱" />
            <ProFormSelect
              name="role"
              label="角色"
              options={[
                {label:'超级管理员（super）', value:'super'},
                {label:'管理员（admin）', value:'admin'},
                {label:'观察员（observer）', value:'observer'},
                {label:'客服（customerservice）', value:'customerservice'},
              ]}
              placeholder="选择角色"
            />
          </ModalForm>
        </>
      ) : (
        <div style={{ padding: 16 }}>暂无权限访问该页面</div>
      )}
    </PageContainer>
  );
};

export default AdminsPage;
