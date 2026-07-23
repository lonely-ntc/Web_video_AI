import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AudioLines,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileText,
  FileUp,
  Files,
  FolderKanban,
  FolderOpen,
  HardDrive,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MoreHorizontal,
  Play,
  Plus,
  Presentation,
  Search,
  Settings,
  Sparkles,
  Upload,
  UserRound,
  UserRoundPlus,
  Video,
  X,
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import NenDashboard from '../components/ui/NenDashboard';
import NutDangNhap from '../components/ui/NutDangNhap';
import NutDieuHuong from '../components/ui/NutDieuHuong';
import NutThongBao from '../components/ui/NutThongBao';
import TrangCaiDat from './TrangCaiDat';
import TrangHoSo from './TrangHoSo';
import '../App.css';

const navigationItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Projects', icon: FolderKanban },
  { label: 'Documents', icon: Files },
  { label: 'Avatar AI', icon: UserRound },
  { label: 'Voice Library', icon: AudioLines },
  { label: 'Videos', icon: Video },
  { label: 'History', icon: History },
  { label: 'Storage', icon: HardDrive },
];

const accountItems = [
  { label: 'Profile', icon: UserRound },
  { label: 'Settings', icon: Settings },
];

const stats = [
  {
    label: 'Tổng dự án',
    value: '24',
    detail: '+3 trong tháng này',
    icon: FolderKanban,
    tone: 'purple',
  },
  {
    label: 'Tổng video',
    value: '68',
    detail: '12 video mới',
    icon: Video,
    tone: 'blue',
  },
  {
    label: 'Tài liệu',
    value: '142',
    detail: 'PDF, Word, Slides',
    icon: FileText,
    tone: 'orange',
  },
  {
    label: 'Avatar AI',
    value: '8',
    detail: '5 avatar sẵn sàng',
    icon: UserRound,
    tone: 'pink',
  },
  {
    label: 'Đã sử dụng',
    value: '18.6 GB',
    detail: '37% của 50 GB',
    icon: HardDrive,
    tone: 'green',
  },
  {
    label: 'Đang xử lý',
    value: '3',
    detail: 'Khoảng 12 phút còn lại',
    icon: Activity,
    tone: 'indigo',
  },
];

const quickActions = [
  {
    label: 'Tạo Project mới',
    description: 'Bắt đầu không gian làm việc',
    icon: Plus,
    tone: 'purple',
  },
  {
    label: 'Upload PDF',
    description: 'Nhập nội dung từ PDF',
    icon: FileUp,
    tone: 'red',
    accept: '.pdf,application/pdf',
  },
  {
    label: 'Upload Word',
    description: 'Nhập file DOC hoặc DOCX',
    icon: FileText,
    tone: 'blue',
    accept:
      '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    label: 'Upload PowerPoint',
    description: 'Nhập file trình chiếu',
    icon: Presentation,
    tone: 'orange',
    accept:
      '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  {
    label: 'Upload Avatar',
    description: 'Thêm nhân vật của bạn',
    icon: UserRoundPlus,
    tone: 'pink',
    accept: 'image/*',
  },
  {
    label: 'Tạo Video AI',
    description: 'Biến ý tưởng thành video',
    icon: Sparkles,
    tone: 'indigo',
    featured: true,
  },
];

const processingVideos = [
  {
    project: 'Ra mắt sản phẩm Lumi',
    video: 'Giới thiệu sản phẩm 60s',
    progress: 78,
    status: 'Đang tổng hợp giọng nói',
    started: 'Bắt đầu lúc 14:22',
    color: '#725cf6',
  },
  {
    project: 'Khóa học Marketing',
    video: 'Bài 04 — Hiểu khách hàng',
    progress: 42,
    status: 'Đang tạo chuyển động Avatar',
    started: 'Bắt đầu lúc 14:35',
    color: '#2e8cff',
  },
  {
    project: 'Bản tin nội bộ',
    video: 'Bản tin tháng 07/2026',
    progress: 16,
    status: 'Đang phân tích kịch bản',
    started: 'Bắt đầu lúc 14:48',
    color: '#f59e5b',
  },
];

const recentItems = [
  {
    project: 'Chiến dịch hè 2026',
    video: 'Summer Brand Story',
    created: '2 phút trước',
    status: 'Hoàn thành',
    duration: '02:14',
    tone: 'success',
  },
  {
    project: 'Onboarding nhân sự',
    video: 'Chào mừng thành viên mới',
    created: 'Hôm nay, 13:40',
    status: 'Đang xử lý',
    duration: '—',
    tone: 'processing',
  },
  {
    project: 'Hướng dẫn sản phẩm',
    video: 'Thiết lập tài khoản',
    created: 'Hôm qua, 16:25',
    status: 'Hoàn thành',
    duration: '03:08',
    tone: 'success',
  },
  {
    project: 'Social Media Q3',
    video: '5 mẹo làm việc hiệu quả',
    created: '20/07/2026',
    status: 'Bản nháp',
    duration: '—',
    tone: 'draft',
  },
];

const notifications = [
  {
    title: 'Video đã tạo thành công',
    detail: 'Summer Brand Story đã sẵn sàng để xem.',
    time: '2 phút trước',
    tone: 'success',
    icon: CheckCircle2,
    unread: true,
  },
  {
    title: 'Upload tài liệu thành công',
    detail: 'Brand_Guideline_2026.pdf đã được tải lên.',
    time: '18 phút trước',
    tone: 'info',
    icon: Upload,
    unread: true,
  },
  {
    title: 'Avatar đã được cập nhật',
    detail: 'Avatar Chương Studio đã xử lý xong.',
    time: '1 giờ trước',
    tone: 'purple',
    icon: UserRound,
    unread: true,
  },
  {
    title: 'Tạo video thất bại',
    detail: 'Không thể xử lý video Product Demo v2.',
    time: 'Hôm qua',
    tone: 'danger',
    icon: CircleAlert,
    unread: false,
  },
];

const activities = [
  { action: 'Đăng nhập vào hệ thống', time: '14:52', icon: UserRound },
  { action: 'Tạo Project “Bản tin nội bộ”', time: '14:47', icon: Plus },
  { action: 'Upload Brand_Guideline_2026.pdf', time: '14:34', icon: Upload },
  { action: 'Tạo video “Summer Brand Story”', time: '13:48', icon: Video },
  { action: 'Xóa video “Product Demo v1”', time: 'Hôm qua', icon: History },
];

const storageItems = [
  { label: 'Tài liệu', value: '3.2 GB', percent: 17, color: '#725cf6' },
  { label: 'Hình ảnh', value: '2.4 GB', percent: 13, color: '#f27ca6' },
  { label: 'Âm thanh', value: '4.1 GB', percent: 22, color: '#f4a261' },
  { label: 'Video', value: '8.9 GB', percent: 48, color: '#2e8cff' },
];

function Sidebar({ activeMenu, onSelect, isOpen, onClose, user, onLogin }) {
  const renderItems = (items) =>
    items.map(({ label, icon: Icon }) => (
      <NutDieuHuong
        key={label}
        label={label}
        icon={Icon}
        active={activeMenu === label}
        count={label === 'Videos' ? 3 : undefined}
        onClick={() => {
          if (!user && label === 'Profile') {
            onLogin();
            onClose();
            return;
          }
          onSelect(label);
          onClose();
        }}
      />
    ));

  return (
    <>
      <button
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        aria-label="Đóng menu"
        onClick={onClose}
      />
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">
            <img className="brand-logo" src={logo} alt="Logo AI Video Studio" />
          </div>
          <div>
            <strong>AI Video</strong>
            <span>Studio</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Điều hướng chính">
          <span className="nav-label">Không gian làm việc</span>
          {renderItems(navigationItems)}
          <span className="nav-label account-label">Tài khoản</span>
          {renderItems(accountItems)}
        </nav>

      </aside>
    </>
  );
}

function Header({
  onMenuOpen,
  searchQuery,
  onSearchChange,
  user,
  onLogin,
  onSignOut,
  onProfileOpen,
  onSettingsOpen,
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName =
    user?.user_metadata?.full_name?.trim() || user?.email?.split('@')[0] || 'Người dùng';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenuOpen}>
        <Menu size={22} />
        <span className="sr-only">Mở menu</span>
      </button>

      <div className="search-box">
        <Search size={19} />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm project, video, tài liệu..."
          aria-label="Tìm kiếm"
        />
        <span className="search-shortcut">⌘ K</span>
      </div>

      <div className="topbar-actions">
        <div className="popover-anchor">
          <NutThongBao
            count={3}
            isOpen={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setProfileOpen(false);
            }}
          />
          {notificationsOpen && (
            <div className="header-popover notification-popover">
              <div className="popover-title">
                <strong>Thông báo mới</strong>
                <button>Đánh dấu đã đọc</button>
              </div>
              {notifications.slice(0, 3).map(({ title, time, icon: Icon, tone }) => (
                <div className="mini-notification" key={title}>
                  <span className={`notification-icon ${tone}`}><Icon size={16} /></span>
                  <div><strong>{title}</strong><span>{time}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {user && (
          <>
            <div className="topbar-divider" />
            <div className="popover-anchor">
              <button
                className="profile-button"
                onClick={() => {
                  setProfileOpen((current) => !current);
                  setNotificationsOpen(false);
                }}
                aria-expanded={profileOpen}
              >
                <span className={`user-avatar ${avatarUrl ? 'has-image' : ''}`}>
                  {avatarUrl ? <img src={avatarUrl} alt="" /> : initials}
                </span>
                <span className="user-copy"><strong>{displayName}</strong><small>Creator</small></span>
                <ChevronDown size={16} />
              </button>
              {profileOpen && (
                <div className="header-popover profile-popover">
                  <strong>{displayName}</strong>
                  <span>{user.email}</span>
                  <button
                    onClick={() => {
                      onProfileOpen();
                      setProfileOpen(false);
                    }}
                  >
                    <UserRound size={16} /> Xem hồ sơ
                  </button>
                  <button
                    onClick={() => {
                      onSettingsOpen();
                      setProfileOpen(false);
                    }}
                  >
                    <Settings size={16} /> Cài đặt tài khoản
                  </button>
                  <button className="logout-button" onClick={onSignOut}>
                    <LogOut size={16} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {!user && (
          <NutDangNhap onClick={onLogin} />
        )}
      </div>
    </header>
  );
}

function StatCard({ stat }) {
  const Icon = stat.icon;
  return (
    <article className="stat-card">
      <div className={`stat-icon ${stat.tone}`}><Icon size={21} /></div>
      <div className="stat-content">
        <span>{stat.label}</span>
        <strong>{stat.value}</strong>
        <small>{stat.detail}</small>
      </div>
    </article>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <button className="text-button">{action} <ChevronRight size={16} /></button>}
    </div>
  );
}

function TrangDashboard({
  user,
  onLogin,
  onSignOut,
  caiDat,
  onAppearanceChange,
  onNotificationToggle,
}) {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user && activeMenu === 'Profile') {
      setActiveMenu('Dashboard');
    }
  }, [activeMenu, user]);

  const filteredRecentItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('vi');
    if (!query) return recentItems;
    return recentItems.filter((item) =>
      `${item.project} ${item.video} ${item.status}`.toLocaleLowerCase('vi').includes(query)
    );
  }, [searchQuery]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const handleQuickAction = (action) => {
    if (!user) {
      onLogin();
      return;
    }
    if (action.accept && fileInputRef.current) {
      fileInputRef.current.accept = action.accept;
      fileInputRef.current.dataset.action = action.label;
      fileInputRef.current.click();
      return;
    }
    showToast(`${action.label}: sẵn sàng bắt đầu.`);
  };

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (file) showToast(`${file.name} đã được chọn để tải lên.`);
    event.target.value = '';
  };

  return (
    <div className="app-shell">
      <NenDashboard />
      <Sidebar
        activeMenu={activeMenu}
        onSelect={setActiveMenu}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        onLogin={onLogin}
      />

      <div className="workspace">
        <Header
          onMenuOpen={() => setSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          user={user}
          onLogin={onLogin}
          onSignOut={onSignOut}
          onProfileOpen={() => setActiveMenu('Profile')}
          onSettingsOpen={() => setActiveMenu('Settings')}
        />

        {activeMenu === 'Settings' ? (
          <TrangCaiDat
            caiDat={caiDat}
            onAppearanceChange={onAppearanceChange}
            onNotificationToggle={onNotificationToggle}
          />
        ) : activeMenu === 'Profile' && user ? (
          <TrangHoSo
            user={user}
            onOpenSettings={() => setActiveMenu('Settings')}
          />
        ) : (
          <main className="dashboard">
            <section className="welcome-card">
            <div className="welcome-copy">
              <span className="eyebrow"><Sparkles size={15} /> Không gian sáng tạo của bạn</span>
              <h1>
                {user
                  ? `Xin chào, ${user.user_metadata?.full_name?.trim()?.split(/\s+/).slice(-1)[0] || user.email?.split('@')[0]}`
                  : 'Xin chào'}{' '}
                <span className="welcome-wave" aria-hidden="true">👋</span>
              </h1>
              <p>
                {user
                  ? 'Chào mừng bạn quay trở lại AI Video Studio. Hôm nay, hãy biến một ý tưởng mới thành video.'
                  : 'Khám phá AI Video Studio ngay hôm nay. Đăng nhập để tạo, lưu và quản lý các dự án của bạn.'}
              </p>
              <div className="welcome-actions">
                <button className="primary-button" onClick={() => handleQuickAction(quickActions[5])}>
                  <Sparkles size={18} /> Tạo Video AI
                </button>
                <button className="secondary-button" onClick={() => handleQuickAction(quickActions[0])}>
                  <Plus size={18} /> Project mới
                </button>
              </div>
            </div>
            <div className="welcome-visual" aria-hidden="true">
              <div className="visual-orbit orbit-one" />
              <div className="visual-orbit orbit-two" />
              <div className="video-preview-card">
                <span className="preview-badge">AI STUDIO</span>
                <div className="preview-play"><Play size={22} fill="currentColor" /></div>
                <div className="preview-lines"><i /><i /><i /><i /><i /></div>
                <div className="preview-footer"><span>Brand Story</span><small>00:42 / 01:00</small></div>
              </div>
            </div>
            </section>

          <section className="stats-grid" aria-label="Thống kê tổng quan">
            {stats.map((stat) => <StatCard stat={stat} key={stat.label} />)}
          </section>

          <section className="panel quick-actions-panel">
            <SectionHeader
              title="Tạo nhanh"
              description="Bắt đầu công việc phổ biến chỉ với một thao tác."
            />
            <div className="quick-actions-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    className={`quick-action ${action.featured ? 'featured' : ''}`}
                    key={action.label}
                    onClick={() => handleQuickAction(action)}
                  >
                    <span className={`quick-icon ${action.tone}`}><Icon size={21} /></span>
                    <span><strong>{action.label}</strong><small>{action.description}</small></span>
                    <ChevronRight className="quick-arrow" size={17} />
                  </button>
                );
              })}
            </div>
            <input
              className="sr-only"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
              tabIndex="-1"
            />
          </section>

          <div className="dashboard-grid">
            <div className="dashboard-primary">
              <section className="panel progress-panel">
                <SectionHeader
                  title="Tiến trình tạo video"
                  description="3 video đang được hệ thống xử lý."
                  action="Xem tất cả"
                />
                <div className="processing-list">
                  {processingVideos.map((item) => (
                    <article className="processing-item" key={item.video}>
                      <div className="processing-thumbnail">
                        <Video size={21} />
                        <span>{item.progress}%</span>
                      </div>
                      <div className="processing-info">
                        <div className="processing-title">
                          <div><span>{item.project}</span><strong>{item.video}</strong></div>
                          <strong style={{ color: item.color }}>{item.progress}%</strong>
                        </div>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`Tiến trình ${item.video}`}
                          aria-valuenow={item.progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          <span style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                        </div>
                        <div className="processing-meta">
                          <span><Activity size={14} /> {item.status}</span>
                          <span><Clock3 size={14} /> {item.started}</span>
                        </div>
                      </div>
                      <button className="icon-button"><MoreHorizontal size={19} /><span className="sr-only">Tùy chọn</span></button>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel recent-panel">
                <SectionHeader
                  title="Dự án & video gần đây"
                  description={searchQuery ? `${filteredRecentItems.length} kết quả phù hợp` : 'Tiếp tục công việc gần nhất của bạn.'}
                  action="Xem tất cả"
                />
                <div className="recent-table-wrap">
                  <table className="recent-table">
                    <thead><tr><th>Project / Video</th><th>Thời gian tạo</th><th>Trạng thái</th><th>Thời lượng</th><th><span className="sr-only">Thao tác</span></th></tr></thead>
                    <tbody>
                      {filteredRecentItems.map((item) => (
                        <tr key={item.video}>
                          <td>
                            <div className="project-cell">
                              <span className="project-icon"><Play size={15} fill="currentColor" /></span>
                              <span><strong>{item.video}</strong><small>{item.project}</small></span>
                            </div>
                          </td>
                          <td data-label="Thời gian">{item.created}</td>
                          <td data-label="Trạng thái"><span className={`status-badge ${item.tone}`}>{item.status}</span></td>
                          <td data-label="Thời lượng">{item.duration}</td>
                          <td>
                            <div className="table-actions">
                              <button title="Mở Project"><FolderOpen size={17} /></button>
                              <button title="Xem Video" disabled={item.status !== 'Hoàn thành'}><Eye size={17} /></button>
                              <button title="Tải Video" disabled={item.status !== 'Hoàn thành'}><Download size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecentItems.length === 0 && (
                    <div className="empty-search"><Search size={24} /><strong>Không tìm thấy kết quả</strong><span>Thử tìm bằng tên project hoặc video khác.</span></div>
                  )}
                </div>
              </section>
            </div>

            <aside className="dashboard-secondary">
              <section className="panel storage-panel">
                <SectionHeader title="Dung lượng lưu trữ" action="Quản lý" />
                <div className="storage-summary">
                  <div className="storage-donut">
                    <div><strong>18.6</strong><span>GB đã dùng</span></div>
                  </div>
                  <div className="storage-numbers">
                    <span><small>Tổng dung lượng</small><strong>50 GB</strong></span>
                    <span><small>Còn lại</small><strong>31.4 GB</strong></span>
                  </div>
                </div>
                <div className="storage-list">
                  {storageItems.map((item) => (
                    <div className="storage-row" key={item.label}>
                      <span className="storage-color" style={{ backgroundColor: item.color }} />
                      <span className="storage-label">{item.label}</span>
                      <div className="storage-bar"><span style={{ width: `${item.percent}%`, backgroundColor: item.color }} /></div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel notifications-panel">
                <SectionHeader title="Thông báo hệ thống" action="Xem tất cả" />
                <div className="notification-list">
                  {notifications.map(({ title, detail, time, tone, icon: Icon, unread }) => (
                    <article className={`notification-item ${unread ? 'unread' : ''}`} key={title}>
                      <span className={`notification-icon ${tone}`}><Icon size={17} /></span>
                      <div><strong>{title}</strong><p>{detail}</p><small>{time}</small></div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel activity-panel">
                <SectionHeader title="Lịch sử hoạt động" action="Xem tất cả" />
                <div className="activity-list">
                  {activities.map(({ action, time, icon: Icon }, index) => (
                    <div className="activity-item" key={action}>
                      <span className="activity-icon"><Icon size={15} /></span>
                      <div><strong>{action}</strong><small>{time}</small></div>
                      {index < activities.length - 1 && <i />}
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
          </main>
        )}
      </div>

      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={19} />
          <span>{toast}</span>
          <button onClick={() => setToast('')}><X size={17} /><span className="sr-only">Đóng</span></button>
        </div>
      )}
    </div>
  );
}

export default TrangDashboard;
