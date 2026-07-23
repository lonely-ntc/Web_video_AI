import {
  BellRing,
  Check,
  CircleAlert,
  FileCheck2,
  Languages,
  Megaphone,
  Moon,
  Palette,
  Sun,
  Type,
  Video,
} from 'lucide-react';
import CongTacBatTat from '../components/ui/CongTacBatTat';
import '../styles/cai-dat.css';

const tuyChonThongBao = [
  {
    key: 'videoCompleted',
    title: 'Video hoàn thành',
    description: 'Nhận thông báo ngay khi video đã sẵn sàng để xem hoặc tải xuống.',
    icon: Video,
    tone: 'purple',
  },
  {
    key: 'documentUploaded',
    title: 'Upload tài liệu thành công',
    description: 'Xác nhận khi PDF, Word hoặc PowerPoint đã được tải lên hệ thống.',
    icon: FileCheck2,
    tone: 'blue',
  },
  {
    key: 'videoFailed',
    title: 'Tạo video thất bại',
    description: 'Cảnh báo khi có lỗi để bạn có thể kiểm tra và tạo lại video.',
    icon: CircleAlert,
    tone: 'red',
  },
  {
    key: 'systemUpdates',
    title: 'Cập nhật hệ thống',
    description: 'Nhận tin về tính năng mới, bảo trì và các thay đổi quan trọng.',
    icon: Megaphone,
    tone: 'orange',
  },
];

function TrangCaiDat({ caiDat, onAppearanceChange, onNotificationToggle }) {
  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <span className="settings-eyebrow"><Palette size={15} /> Không gian của bạn</span>
          <h1>Cài đặt</h1>
          <p>Tùy chỉnh giao diện và lựa chọn những thông báo bạn muốn nhận.</p>
        </div>
        <span className="settings-saved"><Check size={15} /> Đã lưu tự động</span>
      </header>

      <div className="settings-layout">
        <section className="settings-card appearance-settings">
          <div className="settings-section-title">
            <span><Palette size={20} /></span>
            <div>
              <h2>Cài đặt giao diện</h2>
              <p>Điều chỉnh cách AI Video Studio hiển thị trên thiết bị của bạn.</p>
            </div>
          </div>

          <div className="settings-group">
            <div className="settings-label">
              <strong>Chế độ hiển thị</strong>
              <span>Chọn giao diện sáng hoặc tối.</span>
            </div>
            <div className="theme-options" role="group" aria-label="Chế độ hiển thị">
              <button
                type="button"
                className={caiDat.theme === 'light' ? 'selected' : ''}
                aria-pressed={caiDat.theme === 'light'}
                onClick={() => onAppearanceChange('theme', 'light')}
              >
                <span className="theme-preview light"><Sun size={21} /></span>
                <span><strong>Chế độ sáng</strong><small>Light Mode</small></span>
                {caiDat.theme === 'light' && <Check className="option-check" size={16} />}
              </button>
              <button
                type="button"
                className={caiDat.theme === 'dark' ? 'selected' : ''}
                aria-pressed={caiDat.theme === 'dark'}
                onClick={() => onAppearanceChange('theme', 'dark')}
              >
                <span className="theme-preview dark"><Moon size={21} /></span>
                <span><strong>Chế độ tối</strong><small>Dark Mode</small></span>
                {caiDat.theme === 'dark' && <Check className="option-check" size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-copy">
              <span className="settings-row-icon"><Languages size={19} /></span>
              <div><strong>Ngôn ngữ</strong><span>Ngôn ngữ hiển thị của hệ thống.</span></div>
            </div>
            <select
              value={caiDat.language}
              onChange={(event) => onAppearanceChange('language', event.target.value)}
              aria-label="Ngôn ngữ"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>

          <div className="settings-row font-size-row">
            <div className="settings-row-copy">
              <span className="settings-row-icon"><Type size={19} /></span>
              <div><strong>Kích thước chữ</strong><span>Điều chỉnh chữ phù hợp với mắt của bạn.</span></div>
            </div>
            <div className="font-size-options" role="group" aria-label="Kích thước chữ">
              {[
                ['small', 'Nhỏ'],
                ['medium', 'Vừa'],
                ['large', 'Lớn'],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={caiDat.fontSize === value ? 'selected' : ''}
                  aria-pressed={caiDat.fontSize === value}
                  onClick={() => onAppearanceChange('fontSize', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-card notification-settings">
          <div className="settings-section-title">
            <span><BellRing size={20} /></span>
            <div>
              <h2>Cài đặt thông báo</h2>
              <p>Bật hoặc tắt từng loại thông báo từ hệ thống.</p>
            </div>
          </div>

          <div className="notification-settings-list">
            {tuyChonThongBao.map(({ key, title, description, icon: Icon, tone }) => (
              <div className="notification-setting-row" key={key}>
                <span className={`notification-setting-icon ${tone}`}><Icon size={19} /></span>
                <div><strong>{title}</strong><p>{description}</p></div>
                <CongTacBatTat
                  checked={caiDat.notifications[key]}
                  label={`${title}: ${caiDat.notifications[key] ? 'đang bật' : 'đang tắt'}`}
                  onChange={() => onNotificationToggle(key)}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default TrangCaiDat;
