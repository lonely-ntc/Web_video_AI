import { useRef } from 'react';
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  CircleAlert,
  FolderKanban,
  HardDrive,
  KeyRound,
  LoaderCircle,
  Mail,
  MonitorSmartphone,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';
import useAnhDaiDien from '../flows/useAnhDaiDien';
import useHoSo from '../flows/useHoSo';
import '../styles/ho-so.css';

const thongKeHoSo = [
  { label: 'Dự án', value: '24', icon: FolderKanban, tone: 'purple' },
  { label: 'Video', value: '68', icon: Video, tone: 'blue' },
  { label: 'Đã sử dụng', value: '18.6 GB', icon: HardDrive, tone: 'green' },
];

function TrangHoSo({ user, onOpenSettings }) {
  const avatarInputRef = useRef(null);
  const {
    hoSo,
    dangTai,
    dangLuu,
    thongBao,
    loi,
    capNhatTruong,
    luuHoSo,
  } = useHoSo(user);
  const {
    avatarUrl,
    capNhatAnh,
    dangTaiAnh,
    loiAnh,
    thongBaoAnh,
  } = useAnhDaiDien(user);
  const tenHienThi = hoSo.displayName.trim() || hoSo.fullName.trim() || user?.email?.split('@')[0] || 'Người dùng';
  const chuCaiDau = tenHienThi
    .split(/\s+/)
    .slice(-2)
    .map((phan) => phan.charAt(0).toUpperCase())
    .join('');
  const ngayThamGia = user?.created_at
    ? new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
    : 'Chưa cập nhật';

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-glow profile-glow-one" />
        <div className="profile-hero-glow profile-glow-two" />
        <div className="profile-identity">
          <div className={`profile-avatar-large ${avatarUrl ? 'has-image' : ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={`Ảnh đại diện của ${tenHienThi}`} />
            ) : (
              <span>{chuCaiDau}</span>
            )}
            <i aria-label="Tài khoản đã xác thực"><BadgeCheck size={19} fill="currentColor" /></i>
          </div>
          <div className="profile-identity-copy">
            <span className="profile-eyebrow"><Sparkles size={14} /> Hồ sơ sáng tạo</span>
            <h1>{tenHienThi}</h1>
            <p><Mail size={14} /> {user?.email}</p>
            <div className="profile-tags">
              <span>Creator</span>
              <span><CalendarDays size={13} /> Tham gia {ngayThamGia}</span>
            </div>
            <input
              ref={avatarInputRef}
              className="profile-avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Chọn ảnh đại diện"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) capNhatAnh(file);
                event.target.value = '';
              }}
            />
            <button
              className="profile-avatar-button"
              type="button"
              disabled={dangTaiAnh}
              onClick={() => avatarInputRef.current?.click()}
            >
              {dangTaiAnh ? (
                <><LoaderCircle className="profile-spinner" size={15} /> Đang tải ảnh...</>
              ) : (
                <><Camera size={15} /> Đổi ảnh đại diện</>
              )}
            </button>
            {thongBaoAnh && <div className="profile-avatar-feedback success" role="status">{thongBaoAnh}</div>}
            {loiAnh && <div className="profile-avatar-feedback error" role="alert">{loiAnh}</div>}
          </div>
        </div>

        <div className="profile-stats" aria-label="Thống kê tài khoản">
          {thongKeHoSo.map(({ label, value, icon: Icon, tone }) => (
            <div className="profile-stat" key={label}>
              <span className={tone}><Icon size={17} /></span>
              <div><strong>{value}</strong><small>{label}</small></div>
            </div>
          ))}
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-card profile-form-card">
          <div className="profile-card-heading">
            <span><UserRound size={20} /></span>
            <div><h2>Thông tin cá nhân</h2><p>Cập nhật thông tin hiển thị trong AI Video Studio.</p></div>
          </div>

          <form
            className="profile-form"
            onSubmit={luuHoSo}
            aria-busy={dangTai || dangLuu}
          >
            {dangTai && (
              <div className="profile-loading" role="status">
                <LoaderCircle className="profile-spinner" size={17} />
                Đang tải thông tin từ Supabase...
              </div>
            )}
            <div className="profile-form-grid">
              <label className="profile-field" htmlFor="profileFullName">
                <span>Họ và tên</span>
                <div><UserRound size={17} /><input id="profileFullName" value={hoSo.fullName} onChange={capNhatTruong('fullName')} autoComplete="name" required /></div>
              </label>

              <label className="profile-field" htmlFor="profileDisplayName">
                <span>Tên hiển thị</span>
                <div><Sparkles size={17} /><input id="profileDisplayName" value={hoSo.displayName} onChange={capNhatTruong('displayName')} autoComplete="nickname" /></div>
              </label>

              <label className="profile-field" htmlFor="profileEmail">
                <span>Email</span>
                <div className="readonly"><Mail size={17} /><input id="profileEmail" value={user?.email || ''} readOnly /></div>
                <small>Email đăng nhập không chỉnh sửa tại đây.</small>
              </label>

              <label className="profile-field" htmlFor="profilePhone">
                <span>Số điện thoại</span>
                <div><Phone size={17} /><input id="profilePhone" value={hoSo.phone} onChange={capNhatTruong('phone')} autoComplete="tel" placeholder="Chưa cập nhật" /></div>
              </label>

              <label className="profile-field" htmlFor="profileCompany">
                <span>Công ty / Đơn vị</span>
                <div><Building2 size={17} /><input id="profileCompany" value={hoSo.company} onChange={capNhatTruong('company')} autoComplete="organization" placeholder="Tên công ty của bạn" /></div>
              </label>

              <label className="profile-field" htmlFor="profileJobTitle">
                <span>Vai trò công việc</span>
                <div><BriefcaseBusiness size={17} /><input id="profileJobTitle" value={hoSo.jobTitle} onChange={capNhatTruong('jobTitle')} autoComplete="organization-title" placeholder="Ví dụ: Content Creator" /></div>
              </label>
            </div>

            <label className="profile-field profile-bio" htmlFor="profileBio">
              <span>Giới thiệu bản thân</span>
              <textarea id="profileBio" value={hoSo.bio} onChange={capNhatTruong('bio')} rows="4" maxLength="240" placeholder="Chia sẻ ngắn về bạn và công việc sáng tạo của bạn..." />
              <small>{hoSo.bio.length}/240 ký tự</small>
            </label>

            {thongBao && <div className="profile-message success" role="status"><CheckCircle2 size={17} /> {thongBao}</div>}
            {loi && <div className="profile-message error" role="alert"><CircleAlert size={17} /> {loi}</div>}

            <div className="profile-form-actions">
              <span>Dữ liệu được lưu tại bảng public.profiles trên Supabase.</span>
              <button type="submit" disabled={dangLuu || dangTai}>
                {dangLuu ? <><LoaderCircle className="profile-spinner" size={17} /> Đang lưu...</> : <><Save size={17} /> Lưu thay đổi</>}
              </button>
            </div>
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card account-status-card">
            <div className="profile-card-heading compact">
              <span><ShieldCheck size={19} /></span>
              <div><h2>Trạng thái tài khoản</h2><p>Thông tin xác thực hiện tại.</p></div>
            </div>
            <div className="account-status-list">
              <div><span><Mail size={17} /></span><div><strong>Email</strong><small>{user?.email_confirmed_at ? 'Đã xác thực' : 'Chưa xác thực'}</small></div><CheckCircle2 className={user?.email_confirmed_at ? 'verified' : 'pending'} size={18} /></div>
              <div><span><CalendarDays size={17} /></span><div><strong>Thành viên từ</strong><small>{ngayThamGia}</small></div></div>
            </div>
          </section>

          <section className="profile-card security-card">
            <div className="profile-card-heading compact">
              <span><KeyRound size={19} /></span>
              <div><h2>Bảo mật</h2><p>Quản lý an toàn tài khoản.</p></div>
            </div>
            <div className="security-summary">
              <div><span><KeyRound size={18} /></span><div><strong>Mật khẩu</strong><small>Được bảo vệ bởi Supabase Auth</small></div></div>
              <div><span><MonitorSmartphone size={18} /></span><div><strong>Phiên đăng nhập</strong><small>Thiết bị hiện tại đang hoạt động</small></div></div>
            </div>
            <button className="profile-settings-button" type="button" onClick={onOpenSettings}><Settings size={16} /> Mở cài đặt tài khoản</button>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default TrangHoSo;
