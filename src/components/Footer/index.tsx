import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-components';
import React from 'react';
import { useModel } from '@umijs/max';

const Footer: React.FC = () => {
  const { initialState } = useModel('@@initialState') as any
  const copyright = (initialState?.settings as any)?.footer ?? '数字资产管理系统'
  return (
    <DefaultFooter
      style={{ background: 'none' }}
      copyright={copyright}
      links={[]}
    />
  )
}

export default Footer;
