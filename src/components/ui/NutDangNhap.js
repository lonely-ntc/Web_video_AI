import { ArrowRight } from 'lucide-react';
import { useNgonNgu } from '../../contexts/NgonNguContext';
import './NutDangNhap.css';

// Nut dang nhap tren thanh dieu huong.
function NutDangNhap({ onClick }) {
  const { t } = useNgonNgu();

  return (
    <button className="login-cta" type="button" onClick={onClick}>
      <ArrowRight className="login-arrow login-arrow-left" aria-hidden="true" />
      <span className="login-cta-label">{t('header.login')}</span>
      <span className="login-circle" aria-hidden="true" />
      <ArrowRight className="login-arrow login-arrow-right" aria-hidden="true" />
    </button>
  );
}

export default NutDangNhap;
