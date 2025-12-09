export default {
  'GET /api/admin/menu': {
    data: [
      {
        path: '/admin/resources/user',
        name: '用户管理',
        icon: 'user',
        children: [
          { path: '/admin/resources/user/users', name: '用户列表', icon: 'user' },
          { path: '/admin/resources/user/realnames', name: '实名管理', icon: 'idcard' },
          { path: '/admin/resources/user/external_user_auth', name: '外部用户授权', icon: 'link' },
          { path: '/admin/resources/user/login_logs', name: '登录日志', icon: 'audit' },
          { path: '/admin/resources/user/phone_change_logs', name: '手机号修改日志', icon: 'phone' },
          { path: '/admin/resources/user/notifications', name: '通知管理', icon: 'bell' },
        ],
      },
      {
        path: '/admin/resources/collectible',
        name: '藏品管理',
        icon: 'appstore',
        children: [
          { path: '/admin/resources/collectible/collectible_models', name: '藏品模型', icon: 'appstore' },
          { path: '/admin/resources/collectible/collectible_issuances', name: '发行批次', icon: 'profile' },
          { path: '/admin/resources/collectible/collectible_instances', name: '藏品实例', icon: 'database' },
          { path: '/admin/resources/collectible/issuers', name: '发行方管理', icon: 'team' },
        ],
      },
    ],
  },
}
