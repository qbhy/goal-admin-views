import { Helmet, useIntl, useNavigate, Link } from '@umijs/max';
import { App } from 'antd';
import { createStyles } from 'antd-style';
import React,{useRef} from 'react';
import {
  LoginForm,
  ProForm,
  ProFormText,
  ProFormCaptcha,
  ProFormTextArea,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { Footer } from '@/components';
import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { adminGetCaptcha, adminSendSms, adminResetPassword } from '@/services/ant-design-pro/api';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflow: 'auto',
    backgroundImage:
      "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
    backgroundSize: '100% 100%',
  },
}));


const ResetPassword: React.FC = () => {
  const intl = useIntl();
  const { styles } = useStyles();
  const { message } = App.useApp();
  const [captchaImg, setCaptchaImg] = React.useState<string>('');
  const [captchaId, setCaptchaId] = React.useState<string>('');
  const navigate = useNavigate();
  // @ts-ignore
  const formRef = useRef<ProFormInstance>();

  const refreshCaptcha = async () => {
    try {
      const resp = await adminGetCaptcha();
      const data = resp?.data || {};
      setCaptchaImg(data?.image_base64 || data?.ImageBase64 || '');
      setCaptchaId(data?.captcha_id || data?.CaptchaId || '');
    } catch (_) {
      // ignore
    }
  };

  React.useEffect(() => {
    refreshCaptcha();
  }, []);

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {intl.formatMessage({ id: 'menu.resetPassword', defaultMessage: '重置密码' })}
          {Settings.title && ` - ${Settings.title}`}
        </title>
      </Helmet>
      <div
        style={{
          flex: '1',
          padding: '32px 0',
        }}
      >
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          title={Settings.title}
          subTitle={intl.formatMessage({ id: 'pages.layouts.userLayout.title' })}
          formRef={formRef}
          submitter={{
            searchConfig: {
              submitText: '提交',
            },
          }}
          onFinish={async (values: any) => {
            const phone: string = values?.phone;
            const code: string = values?.sms_code;
            const newPassword: string = values?.new_password;
            if (!phone) {
              message.warning('请输入手机号');
              return false;
            }
            if (!/^1\d{10}$/.test(phone)) {
              message.warning('手机号格式错误');
              return false;
            }
            if (!code || code.length !== 6) {
              message.warning('请输入6位短信验证码');
              return false;
            }
            if (!newPassword || newPassword.length < 6) {
              message.warning('新密码至少6位');
              return false;
            }
            const resp = await adminResetPassword({ phone, code, newPassword });
            const ok = resp?.data?.success ?? resp?.success;
            if (ok) {
              message.success('密码重置成功，请使用新密码登录');
              // 跳转到登录页
              navigate('/admin/login');
              return true;
            }
            const msgText = resp?.data?.message || resp?.message || '重置失败，请稍后重试';
            message.error(msgText);
            return false;
          }}
        >
          {/* 手机号 */}
          <ProFormText
            fieldProps={{ size: 'large', prefix: <MobileOutlined /> }}
            name="phone"
            placeholder="请输入手机号"
            rules={[
              { required: true, message: '请输入手机号！' },
              { pattern: /^1\d{10}$/, message: '手机号格式错误！' },
            ]}
          />

          {/* 图形验证码 */}
          <ProFormText
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
              addonAfter: (
                <>
                  {captchaImg ? (
                    <img
                      src={captchaImg}
                      alt="captcha"
                      style={{ height: 32, cursor: 'pointer' }}
                      onClick={refreshCaptcha}
                    />
                  ) : (
                    <a onClick={refreshCaptcha}>获取图形验证码</a>
                  )}
                </>
              ),
            }}
            name="captcha_code"
            placeholder="请输入图形验证码"
            rules={[{ required: true, message: '请输入图形验证码！' }]}
          />

          {/* 短信验证码 */}
          <ProFormCaptcha
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            captchaProps={{ size: 'large' }}
            phoneName="phone"
            placeholder="请输入短信验证码"
            captchaTextRender={(timing, count) => (timing ? `${count} 获取验证码` : '获取验证码')}
            name="sms_code"
            rules={[{ required: true, message: '请输入短信验证码！' }]}
            onGetCaptcha={async (phone) => {
              const phoneValue = phone || formRef.current?.getFieldValue?.('phone');
              const code = formRef.current?.getFieldValue?.('captcha_code');
              if (!phoneValue) {
                message.warning('请先填写手机号');
                return Promise.reject();
              }
              if (!/^1\d{10}$/.test(String(phoneValue))) {
                message.warning('手机号格式错误');
                return Promise.reject();
              }
              if (!captchaId || !code) {
                message.warning('请先完成图形验证码');
                return Promise.reject();
              }
              const resp = await adminSendSms({ phone: String(phoneValue), type: 'reset', captchaId, captchaCode: String(code) });
              const ok = resp?.data?.success ?? resp?.success;
              if (ok) {
                message.success('短信验证码已发送');
                return true;
              }
              const msgText = resp?.data?.message || resp?.message || '发送失败，请稍后重试';
              message.error(msgText);
              refreshCaptcha();
              return Promise.reject();
            }}
          />

          {/* 新密码 */}
          <ProFormText.Password
            fieldProps={{ size: 'large', prefix: <LockOutlined /> }}
            name="new_password"
            placeholder="请输入新密码（至少6位）"
            rules={[{ required: true, message: '请输入新密码！' }]}
          />

          {/* 返回登录 */}
          <div style={{ textAlign: 'center', marginTop: 8, marginBottom: 8 }}>
            <span style={{ color: '#666' }}>记起密码了？</span>
            <Link to="/admin/login" style={{ marginLeft: 8 }}>
              返回登录
            </Link>
          </div>
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
