import { FileText, ShieldCheck, Sparkles, Video } from 'lucide-react';
import logo from '../../assets/images/logo.png';
import { useNgonNgu } from '../../contexts/NgonNguContext';

// Thanh phan UI gioi thieu thuong hieu tren trang xac thuc.
function LogoThuongHieu() {
  const { t } = useNgonNgu();
  const authBenefits = [
    { icon: Video, text: t('auth.benefits.video') },
    { icon: FileText, text: t('auth.benefits.document') },
    { icon: ShieldCheck, text: t('auth.benefits.secure') },
  ];

  return (
    <section className="auth-brand-panel">
      <div className="auth-brand-glow glow-one" />
      <div className="auth-brand-glow glow-two" />
      <div className="auth-brand-content">
        <div className="auth-brand">
          <img src={logo} alt="Logo AI Video Studio" />
          <div><strong>AI Video</strong><span>Studio</span></div>
        </div>

        <div className="auth-pitch">
          <span className="auth-kicker"><Sparkles size={15} /> {t('auth.unlimitedCreativity')}</span>
          <h1>{t('auth.pitchTitle')}</h1>
          <p>{t('auth.pitchDescription')}</p>

          <div className="auth-benefits">
            {authBenefits.map(({ icon: Icon, text }) => (
              <div className="auth-benefit" key={text}>
                <span><Icon size={17} /></span>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="auth-quote">
          <div className="auth-quote-stars">★★★★★</div>
          <p>{t('auth.quote')}</p>
          <span>{t('auth.quoteAuthor')}</span>
        </div>
      </div>
    </section>
  );
}

export default LogoThuongHieu;
