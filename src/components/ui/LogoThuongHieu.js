import { FileText, ShieldCheck, Sparkles, Video } from 'lucide-react';
import logo from '../../assets/images/logo.png';

const authBenefits = [
  { icon: Video, text: 'Tạo video AI chuyên nghiệp trong vài phút' },
  { icon: FileText, text: 'Biến tài liệu thành kịch bản tự động' },
  { icon: ShieldCheck, text: 'Dữ liệu và dự án được lưu trữ an toàn' },
];

// Thanh phan UI gioi thieu thuong hieu tren trang xac thuc.
function LogoThuongHieu() {
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
          <span className="auth-kicker"><Sparkles size={15} /> Sáng tạo không giới hạn</span>
          <h1>Biến ý tưởng của bạn thành video ấn tượng.</h1>
          <p>Một không gian duy nhất để viết kịch bản, tạo Avatar AI, lồng tiếng và xuất bản video.</p>

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
          <p>“AI Video Studio giúp đội ngũ của tôi rút ngắn hàng giờ sản xuất xuống chỉ còn vài phút.”</p>
          <span>Minh Anh · Creative Lead</span>
        </div>
      </div>
    </section>
  );
}

export default LogoThuongHieu;
