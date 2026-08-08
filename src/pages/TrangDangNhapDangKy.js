import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import LogoThuongHieu from '../components/ui/LogoThuongHieu';
import ONhapXacNhanMatKhau from '../components/ui/ONhapXacNhanMatKhau';
import ONhapMatKhau from '../components/ui/ONhapMatKhau';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useDangNhapDangKy from '../flows/useDangNhapDangKy';

function TrangDangNhapDangKy({ initialMode = 'login', onPasswordUpdated, onBackToDashboard }) {
  const { t } = useNgonNgu();
  const {
    confirmation,
    duplicateEmail,
    error,
    form,
    handleSubmit,
    loading,
    mode,
    setShowPassword,
    showPassword,
    switchMode,
    updateField,
  } = useDangNhapDangKy(initialMode);

  if (confirmation) {
    const confirmationCopy = {
      signup: {
        title: t('auth.signupConfirmationTitle'),
        description: t('auth.signupConfirmationDescription', { email: form.email }),
        action: t('auth.backToLogin'),
      },
      reset: {
        title: t('auth.resetConfirmationTitle'),
        description: t('auth.resetConfirmationDescription', { email: form.email }),
        action: t('auth.backToLogin'),
      },
      'password-updated': {
        title: t('auth.passwordUpdatedTitle'),
        description: t('auth.passwordUpdatedDescription'),
        action: t('auth.continueToDashboard'),
      },
    }[confirmation];

    return (
      <main className="auth-page">
        <LogoThuongHieu />
        <section className="auth-form-panel">
          <div className="auth-card auth-confirmation-card">
            <div className="auth-success-icon"><CheckCircle2 size={30} /></div>
            <span className="auth-form-eyebrow">{t('auth.complete')}</span>
            <h2>{confirmationCopy.title}</h2>
            <p>{confirmationCopy.description}</p>
            <button
              className="auth-submit"
              onClick={() => {
                if (confirmation === 'password-updated') onPasswordUpdated?.();
                else switchMode('login');
              }}
            >
              {confirmationCopy.action} <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </main>
    );
  }

  const isRegister = mode === 'register';
  const isForgot = mode === 'forgot';
  const isUpdatePassword = mode === 'update-password';

  return (
    <main className="auth-page">
      <LogoThuongHieu />

      <section className="auth-form-panel">
        <div className={`auth-card ${isRegister ? 'register-card' : ''}`}>
          <div className="auth-mobile-brand">
            <img src={logo} alt="Logo AI Video Studio" />
            <strong>AI Video Studio</strong>
          </div>

          {(isForgot || isUpdatePassword) && !isUpdatePassword && (
            <button className="auth-back" type="button" onClick={() => switchMode('login')}>
              <ArrowLeft size={16} /> {t('auth.backToLogin')}
            </button>
          )}

          {!isForgot && !isUpdatePassword && onBackToDashboard && (
            <button className="auth-back" type="button" onClick={onBackToDashboard}>
              <ArrowLeft size={16} /> {t('auth.backToDashboard')}
            </button>
          )}

          <div className="auth-form-heading">
            <span className="auth-form-eyebrow">
              {isRegister
                ? t('auth.startFree')
                : isForgot
                  ? t('auth.recoverAccount')
                  : isUpdatePassword
                    ? t('auth.accountSecurity')
                    : t('auth.welcomeBack')}
            </span>
            <h2>
              {isRegister
                ? t('auth.createAccountTitle')
                : isForgot
                  ? t('auth.forgotPasswordTitle')
                  : isUpdatePassword
                    ? t('auth.newPasswordTitle')
                    : t('auth.loginTitle')}
            </h2>
            <p>
              {isRegister
                ? t('auth.registerDescription')
                : isForgot
                  ? t('auth.forgotDescription')
                  : isUpdatePassword
                    ? t('auth.updatePasswordDescription')
                    : t('auth.loginDescription')}
            </p>
          </div>

          {!isForgot && !isUpdatePassword && (
            <div className="auth-tabs" role="tablist" aria-label={t('auth.authMethod')}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
              >
                {t('auth.login')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
              >
                {t('auth.register')}
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <ONhapXacNhanMatKhau
                id="fullName"
                label={t('auth.fullName')}
                value={form.fullName}
                onChange={updateField('fullName')}
                autoComplete="name"
              />
            )}

            {!isUpdatePassword && (
              <ONhapXacNhanMatKhau
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
              />
            )}

            {!isForgot && (
              <ONhapMatKhau
                id="password"
                label={isUpdatePassword ? t('auth.newPassword') : t('auth.password')}
                value={form.password}
                onChange={updateField('password')}
                autoComplete={isRegister ? 'new-password' : isUpdatePassword ? 'new-password' : 'current-password'}
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            )}

            {(isRegister || isUpdatePassword) && (
              <ONhapMatKhau
                id="confirmPassword"
                label={t('auth.confirmPassword')}
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            )}

            {mode === 'login' && (
              <div className="auth-form-options">
                <span><ShieldCheck size={15} /> {t('auth.secureSession')}</span>
                <button type="button" onClick={() => switchMode('forgot')}>{t('auth.forgotPassword')}</button>
              </div>
            )}

            {isRegister && (
              <label className="auth-terms">
                <input
                  type="checkbox"
                  checked={form.acceptedTerms}
                  onChange={updateField('acceptedTerms')}
                />
                <span className="auth-checkbox"><Check size={13} /></span>
                <span>{t('auth.acceptTerms')}</span>
              </label>
            )}

            {duplicateEmail && isRegister && (
              <div className="auth-duplicate-email" role="alert">
                <CircleAlert size={20} />
                <div>
                  <strong>{t('auth.duplicateTitle')}</strong>
                  <p>{t('auth.duplicateDescription', { email: form.email.trim() })}</p>
                </div>
                <div className="auth-duplicate-actions">
                  <button type="button" onClick={() => switchMode('login')}>{t('auth.switchToLogin')}</button>
                  <button type="button" onClick={() => switchMode('forgot')}>{t('auth.forgotPassword')}</button>
                </div>
              </div>
            )}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <><LoaderCircle className="auth-spinner" size={18} /> {t('auth.loading')}</>
              ) : (
                <>
                  {isRegister
                    ? t('auth.createAccount')
                    : isForgot
                      ? t('auth.sendRecovery')
                      : isUpdatePassword
                        ? t('auth.updatePassword')
                        : t('auth.login')}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {!isForgot && !isUpdatePassword && (
            <p className="auth-switch-copy">
              {isRegister ? t('auth.haveAccount') : t('auth.noAccount')}{' '}
              <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                {isRegister ? t('auth.loginNow') : t('auth.registerFree')}
              </button>
            </p>
          )}

          <p className="auth-security-note"><LockKeyhole size={13} /> {t('auth.securityNote')}</p>
        </div>
      </section>
    </main>
  );
}

export default TrangDangNhapDangKy;
