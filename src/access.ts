/**
 * @see https://umijs.org/docs/max/access#access
 * */
export default function access(
  initialState: { currentUser?: API.CurrentUser } | undefined,
) {
  const { currentUser } = initialState ?? {};
  const role = currentUser?.access;

  const isSuper = role === 'super';
  const isAdmin = role === 'admin';
  const isObserver = role === 'observer';
  const isCustomerService = role === 'customerservice';

  return {
    // 原有权限：管理员（admin 或 super），超级管理员（super）
    canAdmin: !!role && (isAdmin || isSuper),
    canSuper: !!role && isSuper,

    // 新增角色标识
    canObserver: !!role && isObserver,
    canCustomerService: !!role && isCustomerService,

    // 写权限：仅 super 与 admin 可写
    canWrite: !!role && (isSuper || isAdmin),

    // 板块可见性控制
    // 用户管理：super/admin/observer/customerservice 可见
    canUsersSectionVisible: !!role && (isSuper || isAdmin || isObserver || isCustomerService),
    // 流转与记录：super/admin/observer/customerservice 可见
    canLogsSectionVisible: !!role && (isSuper || isAdmin || isObserver || isCustomerService),
    // 其他业务板块：super/admin/observer 可见，客服不可见
    canNonCSSectionsVisible: !!role && (isSuper || isAdmin || isObserver),
    // 合成管理统一隐藏
    canSynthesisVisible: false,
  };
}
