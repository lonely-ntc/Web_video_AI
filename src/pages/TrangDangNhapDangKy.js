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
import useDangNhapDangKy from '../flows/useDangNhapDangKy';

function TrangDangNhapDangKy({ initialMode = 'login', onPasswordUpdated, onBackToDashboard }) {
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
        title: 'Kiểm tra hộp thư của bạn',
        description: `Chúng tôi đã gửi liên kết xác nhận đến ${form.email}. Mở email để kích hoạt tài khoản.`,
        action: 'Quay lại đăng nhập',
      },
      reset: {
        title: 'Email khôi phục đã được gửi',
        description: `Hãy mở liên kết được gửi đến ${form.email} để đặt lại mật khẩu.`,
        action: 'Quay lại đăng nhập',
      },
      'password-updated': {
        title: 'Mật khẩu đã được cập nhật',
        description: 'Bạn có thể tiếp tục sử dụng AI Video Studio với mật khẩu mới.',
        action: 'Tiếp tục vào Dashboard',
      },
    }[confirmation];

    return (
      <main className="auth-page">
        <LogoThuongHieu />
        <section className="auth-form-panel">
          <div className="auth-card auth-confirmation-card">
            <div className="auth-success-icon"><CheckCircle2 size={30} /></div>
            <span className="auth-form-eyebrow">Hoàn tất</span>
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
              <ArrowLeft size={16} /> Quay lại đăng nhập
            </button>
          )}

          {!isForgot && !isUpdatePassword && onBackToDashboard && (
            <button className="auth-back" type="button" onClick={onBackToDashboard}>
              <ArrowLeft size={16} /> Quay lại Dashboard
            </button>
          )}

          <div className="auth-form-heading">
            <span className="auth-form-eyebrow">
              {isRegister ? 'Bắt đầu miễn phí' : isForgot ? 'Khôi phục tài khoản' : isUpdatePassword ? 'Bảo mật tài khoản' : 'Chào mừng trở lại'}
            </span>
            <h2>
              {isRegister ? 'Tạo tài khoản mới' : isForgot ? 'Quên mật khẩu?' : isUpdatePassword ? 'Đặt mật khẩu mới' : 'Đăng nhập tài khoản'}
            </h2>
            <p>
              {isRegister
                ? 'Tạo tài khoản để bắt đầu xây dựng video AI của riêng bạn.'
                : isForgot
                  ? 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết khôi phục.'
                  : isUpdatePassword
                    ? 'Chọn mật khẩu mới có ít nhất 8 ký tự cho tài khoản của bạn.'
                    : 'Nhập thông tin để tiếp tục vào không gian sáng tạo.'}
            </p>
          </div>

          {!isForgot && !isUpdatePassword && (
            <div className="auth-tabs" role="tablist" aria-label="Chọn hình thức xác thực">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                className={mode === 'login' ? 'active' : ''}
                onClick={() => switchMode('login')}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                className={mode === 'register' ? 'active' : ''}
                onClick={() => switchMode('register')}
              >
                Đăng ký
              </button>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <ONhapXacNhanMatKhau
                id="fullName"
                label="Họ và tên"
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
                label={isUpdatePassword ? 'Mật khẩu mới' : 'Mật khẩu'}
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
                label="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={updateField('confirmPassword')}
                autoComplete="new-password"
                showPassword={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
              />
            )}

            {mode === 'login' && (
              <div className="auth-form-options">
                <span><ShieldCheck size={15} /> Phiên đăng nhập được bảo mật</span>
                <button type="button" onClick={() => switchMode('forgot')}>Quên mật khẩu?</button>
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
                <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách bảo mật.</span>
              </label>
            )}

            {duplicateEmail && isRegister && (
              <div className="auth-duplicate-email" role="alert">
                <CircleAlert size={20} />
                <div>
                  <strong>Email đã được sử dụng</strong>
                  <p>Tài khoản với email <b>{form.email.trim()}</b> đã tồn tại. Bạn có thể đăng nhập hoặc khôi phục mật khẩu.</p>
                </div>
                <div className="auth-duplicate-actions">
                  <button type="button" onClick={() => switchMode('login')}>Chuyển sang đăng nhập</button>
                  <button type="button" onClick={() => switchMode('forgot')}>Quên mật khẩu</button>
                </div>
              </div>
            )}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? (
                <><LoaderCircle className="auth-spinner" size={18} /> Đang xử lý...</>
              ) : (
                <>
                  {isRegister ? 'Tạo tài khoản' : isForgot ? 'Gửi liên kết khôi phục' : isUpdatePassword ? 'Cập nhật mật khẩu' : 'Đăng nhập'}
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {!isForgot && !isUpdatePassword && (
            <p className="auth-switch-copy">
              {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
              <button type="button" onClick={() => switchMode(isRegister ? 'login' : 'register')}>
                {isRegister ? 'Đăng nhập ngay' : 'Đăng ký miễn phí'}
              </button>
            </p>
          )}

          <p className="auth-security-note"><LockKeyhole size={13} /> Thông tin đăng nhập được bảo vệ bởi Supabase Auth.</p>
        </div>
      </section>
    </main>
  );
}

export default TrangDangNhapDangKy;
