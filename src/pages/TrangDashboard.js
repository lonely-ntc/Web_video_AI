import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  MoreHorizontal,
  Play,
  Plus,
  Presentation,
  Search,
  Settings,
  Sparkles,
  UserRound,
  UserRoundPlus,
  Video,
  X,
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import CongTacGiaoDien from '../components/ui/CongTacGiaoDien';
import NenDashboard from '../components/ui/NenDashboard';
import NutDangNhap from '../components/ui/NutDangNhap';
import NutDieuHuong from '../components/ui/NutDieuHuong';
import NutThuGonSidebar from '../components/ui/NutThuGonSidebar';
import NutThongBao from '../components/ui/NutThongBao';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useAvatarAI from '../flows/useAvatarAI';
import useChuong from '../flows/useChuong';
import useDuAn from '../flows/useDuAn';
import useLichSu from '../flows/useLichSu';
import useTaiLieu from '../flows/useTaiLieu';
import useVideo from '../flows/useVideo';
import TrangCaiDat from './TrangCaiDat';
import TrangChiTietChuong from './TrangChiTietChuong';
import TrangChiTietDuAn from './TrangChiTietDuAn';
import TrangAvatar from './TrangAvatar';
import TrangDuAn from './TrangDuAn';
import TrangHoSo from './TrangHoSo';
import TrangLichSu from './TrangLichSu';
import TrangTaiLieu from './TrangTaiLieu';
import TrangTaoDuAn from './TrangTaoDuAn';
import TrangTaoVideoAI from './TrangTaoVideoAI';
import TrangVideo from './TrangVideo';
import '../App.css';

const navigationItems = [
  { id: 'Dashboard', labelKey: 'navigation.dashboard', icon: LayoutDashboard },
  { id: 'Projects', labelKey: 'navigation.projects', icon: FolderKanban },
  { id: 'Documents', labelKey: 'navigation.documents', icon: Files },
  { id: 'Avatar AI', labelKey: 'navigation.avatarAi', icon: UserRound },
  { id: 'Videos', labelKey: 'navigation.videos', icon: Video },
  { id: 'History', labelKey: 'navigation.history', icon: History },
];

const accountItems = [
  { id: 'Profile', labelKey: 'navigation.profile', icon: UserRound },
  { id: 'Settings', labelKey: 'navigation.settings', icon: Settings },
];

const stats = [
  {
    labelKey: 'dashboard.stats.projects',
    value: '0',
    detailKey: 'dashboard.stats.projectsDetail',
    icon: FolderKanban,
    tone: 'purple',
  },
  {
    labelKey: 'dashboard.stats.videos',
    value: '0',
    detailKey: 'dashboard.stats.videosDetail',
    icon: Video,
    tone: 'blue',
  },
  {
    labelKey: 'dashboard.stats.documents',
    value: '0',
    detailKey: 'dashboard.stats.documentsDetail',
    icon: FileText,
    tone: 'orange',
  },
  {
    labelKey: 'dashboard.stats.avatars',
    value: '0',
    detailKey: 'dashboard.stats.avatarsDetail',
    icon: UserRound,
    tone: 'pink',
  },
  {
    labelKey: 'dashboard.stats.used',
    value: '0 GB',
    detailKey: 'dashboard.stats.usedDetail',
    icon: HardDrive,
    tone: 'green',
  },
  {
    labelKey: 'dashboard.stats.processing',
    value: '0',
    detailKey: 'dashboard.stats.processingDetail',
    icon: Activity,
    tone: 'indigo',
  },
];

const quickActions = [
  {
    id: 'newProject',
    labelKey: 'dashboard.actions.newProject',
    descriptionKey: 'dashboard.actions.newProjectDescription',
    icon: Plus,
    tone: 'purple',
  },
  {
    id: 'uploadPdf',
    labelKey: 'dashboard.actions.uploadPdf',
    descriptionKey: 'dashboard.actions.uploadPdfDescription',
    icon: FileUp,
    tone: 'red',
    accept: '.pdf,application/pdf',
  },
  {
    id: 'uploadWord',
    labelKey: 'dashboard.actions.uploadWord',
    descriptionKey: 'dashboard.actions.uploadWordDescription',
    icon: FileText,
    tone: 'blue',
    accept:
      '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  {
    id: 'uploadPowerPoint',
    labelKey: 'dashboard.actions.uploadPowerPoint',
    descriptionKey: 'dashboard.actions.uploadPowerPointDescription',
    icon: Presentation,
    tone: 'orange',
    accept:
      '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  {
    id: 'uploadAvatar',
    labelKey: 'dashboard.actions.uploadAvatar',
    descriptionKey: 'dashboard.actions.uploadAvatarDescription',
    icon: UserRoundPlus,
    tone: 'pink',
    accept: 'image/*',
  },
  {
    id: 'createVideo',
    labelKey: 'dashboard.actions.createVideo',
    descriptionKey: 'dashboard.actions.createVideoDescription',
    icon: Sparkles,
    tone: 'indigo',
    featured: true,
  },
];

const processingVideos = [];

const recentItems = [];

const notifications = [];

const activities = [];

const storageItems = [
  { labelKey: 'dashboard.storage.documents', value: '0 GB', percent: 0, color: '#725cf6' },
  { labelKey: 'dashboard.storage.images', value: '0 GB', percent: 0, color: '#f27ca6' },
  { labelKey: 'dashboard.storage.audio', value: '0 GB', percent: 0, color: '#f4a261' },
  { labelKey: 'dashboard.storage.video', value: '0 GB', percent: 0, color: '#2e8cff' },
];

function Sidebar({
  activeMenu,
  onSelect,
  isOpen,
  isCollapsed,
  onClose,
  user,
  onLogin,
}) {
  const { t } = useNgonNgu();
  const renderItems = (items) =>
    items.map(({ id, labelKey, icon: Icon }) => (
      <NutDieuHuong
        key={id}
        label={t(labelKey)}
        icon={Icon}
        active={
          activeMenu === id
          || (id === 'Projects' && ['CreateProject', 'ProjectDetail'].includes(activeMenu))
        }
        collapsed={isCollapsed}
        onClick={() => {
          if (!user && id === 'Profile') {
            onLogin();
            onClose();
            return;
          }
          onSelect(id);
          onClose();
        }}
      />
    ));

  return (
    <>
      <button
        className={`sidebar-overlay ${isOpen ? 'visible' : ''}`}
        aria-label={t('navigation.closeMenu')}
        onClick={onClose}
      />
      <aside
        className={`sidebar ${isOpen ? 'open' : ''} ${isCollapsed ? 'collapsed' : ''}`}
        aria-label={t('navigation.sidebar')}
      >
        <div className="sidebar-brand">
          <div className="brand-mark">
            <img className="brand-logo" src={logo} alt="Logo AI Video Studio" />
          </div>
          <div>
            <strong>AI Video</strong>
            <span>Studio</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label={t('navigation.mainNavigation')}>
          <span className="nav-label">{t('navigation.workspace')}</span>
          {renderItems(navigationItems)}
          <span className="nav-label account-label">{t('navigation.account')}</span>
          {renderItems(accountItems)}
        </nav>
      </aside>
    </>
  );
}

function Header({
  onMenuToggle,
  sidebarCollapsed,
  searchQuery,
  onSearchChange,
  theme,
  onThemeChange,
  user,
  onLogin,
  onSignOut,
  onProfileOpen,
  onSettingsOpen,
}) {
  const { t } = useNgonNgu();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName =
    user?.user_metadata?.full_name?.trim()
    || user?.email?.split('@')[0]
    || t('header.userFallback');
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initials = displayName
    .split(/\s+/)
    .slice(-2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <header className="topbar">
      <NutThuGonSidebar
        expanded={!sidebarCollapsed}
        onToggle={onMenuToggle}
      />

      <div className="search-box">
        <Search size={19} />
        <input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t('header.searchPlaceholder')}
          aria-label={t('header.searchLabel')}
        />
        <span className="search-shortcut">⌘ K</span>
      </div>

      <div className="topbar-actions">
        <CongTacGiaoDien
          checked={theme === 'dark'}
          onChange={(batCheDoToi) => onThemeChange(batCheDoToi ? 'dark' : 'light')}
        />
        <div className="popover-anchor">
          <NutThongBao
            count={0}
            isOpen={notificationsOpen}
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setProfileOpen(false);
            }}
          />
          {notificationsOpen && (
            <div className="header-popover notification-popover">
              <div className="popover-title">
                <strong>{t('header.newNotifications')}</strong>
                {notifications.length > 0 && <button>{t('header.markAsRead')}</button>}
              </div>
              {notifications.slice(0, 3).map(({ titleKey, timeKey, icon: Icon, tone }) => (
                <div className="mini-notification" key={titleKey}>
                  <span className={`notification-icon ${tone}`}><Icon size={16} /></span>
                  <div><strong>{t(titleKey)}</strong><span>{t(timeKey)}</span></div>
                </div>
              ))}
              {notifications.length === 0 && (
                <div className="popover-empty">{t('dashboard.notifications.emptyTitle')}</div>
              )}
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
                <span className="user-copy"><strong>{displayName}</strong><small>{t('common.creator')}</small></span>
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
                    <UserRound size={16} /> {t('header.viewProfile')}
                  </button>
                  <button
                    onClick={() => {
                      onSettingsOpen();
                      setProfileOpen(false);
                    }}
                  >
                    <Settings size={16} /> {t('header.accountSettings')}
                  </button>
                  <button className="logout-button" onClick={onSignOut}>
                    <LogOut size={16} /> {t('header.signOut')}
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
  const { t } = useNgonNgu();
  const Icon = stat.icon;
  return (
    <article className="stat-card">
      <div className={`stat-icon ${stat.tone}`}><Icon size={21} /></div>
      <div className="stat-content">
        <span>{t(stat.labelKey)}</span>
        <strong>{stat.value}</strong>
        <small>{t(stat.detailKey)}</small>
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
  const { language, t } = useNgonNgu();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState('');
  const [projectDangMoId, setProjectDangMoId] = useState(null);
  const [chuongDangMoId, setChuongDangMoId] = useState(null);
  const fileInputRef = useRef(null);
  const {
    danhSachDuAn,
    dangTaiDuAn,
    dangLuuDuAn,
    loiTaiDuAn,
    loiLuuDuAn,
    taiDanhSachDuAn,
    luuDuAn,
    capNhatProject,
    xoaProject,
    xoaLoiLuuDuAn,
  } = useDuAn(user);
  const {
    danhSachChuong,
    dangTaiChuong,
    loiTaiChuong,
    dangLuuChuong,
    loiLuuChuong,
    taiDanhSachChuong,
    luuChuongMoi,
    xoaChuong,
    chonAvatar,
    chonVoice,
    xoaLoiLuuChuong,
  } = useChuong(user, projectDangMoId);
  const {
    danhSachTaiLieu,
    dangTaiTaiLieu,
    loiTaiTaiLieu,
    dangTaiLenMap,
    loiTaiLenTaiLieu,
    taiDanhSachTaiLieu,
    taiLenTaiLieu,
    doiTen: doiTenTaiLieu,
    diChuyen: diChuyenTaiLieu,
    taiXuong: taiXuongTaiLieu,
    xoa: xoaTaiLieu,
    xoaLoiTaiLen,
  } = useTaiLieu(user);
  const {
    danhSachAvatar,
    dangTaiAvatar,
    loiTaiAvatar,
    dangTaiLenMap: dangTaiLenAvatarMap,
    loiTaiLenAvatar,
    taiDanhSachAvatar,
    taiLenAvatar,
    doiTen: doiTenAvatar,
    datMacDinh: datAvatarMacDinh,
    diChuyen: diChuyenAvatar,
    taiXuong: taiXuongAvatar,
    xoa: xoaAvatar,
    xoaLoiTaiLen: xoaLoiTaiLenAvatar,
  } = useAvatarAI(user);
  const {
    danhSachVideo,
    dangTaiVideo,
    loiTaiVideo,
    dangTaiLenMap: dangTaiLenVideoMap,
    loiTaiLenVideo,
    taiDanhSachVideo,
    taiLenVideo,
    doiTen: doiTenVideo,
    taiXuong: taiXuongVideo,
    xoa: xoaVideo,
    xoaLoiTaiLen: xoaLoiTaiLenVideo,
  } = useVideo(user);
  const {
    danhSachTacVu,
    dangTaiLichSu,
    loiTaiLichSu,
    taiDanhSachLichSu,
    huy: huyTacVu,
    chayLai: chayLaiTacVu,
    xoa: xoaTacVu,
  } = useLichSu(user);
  const projectDangMo = useMemo(
    () => danhSachDuAn.find((duAn) => duAn.id === projectDangMoId) || null,
    [danhSachDuAn, projectDangMoId],
  );
  const chuongDangMo = useMemo(
    () => danhSachChuong.find((chuong) => chuong.id === chuongDangMoId) || null,
    [danhSachChuong, chuongDangMoId],
  );

  useEffect(() => {
    if (!user && ['Profile', 'CreateProject', 'ProjectDetail', 'ChapterDetail', 'VideoGenerator'].includes(activeMenu)) {
      setProjectDangMoId(null);
      setChuongDangMoId(null);
      setActiveMenu('Dashboard');
    }
  }, [activeMenu, user]);

  const filteredRecentItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(language);
    if (!query) return recentItems;
    return recentItems.filter((item) =>
      `${t(item.projectKey)} ${t(item.videoKey)} ${t(item.statusKey)}`
        .toLocaleLowerCase(language)
        .includes(query)
    );
  }, [language, searchQuery, t]);

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 3200);
  };

  const handleQuickAction = (action) => {
    if (!user) {
      onLogin();
      return;
    }
    if (action.id === 'newProject') {
      setActiveMenu('CreateProject');
      return;
    }
    if (action.accept && fileInputRef.current) {
      fileInputRef.current.accept = action.accept;
      fileInputRef.current.dataset.action = action.id;
      fileInputRef.current.click();
      return;
    }
    showToast(t('dashboard.readyToStart', { action: t(action.labelKey) }));
  };

  const handleFileSelected = (event) => {
    const file = event.target.files?.[0];
    if (file) showToast(t('dashboard.fileSelected', { file: file.name }));
    event.target.value = '';
  };

  const handleSidebarToggle = () => {
    if (window.innerWidth <= 860) {
      setSidebarCollapsed(false);
      setSidebarOpen(true);
      return;
    }
    setSidebarCollapsed((hienTai) => !hienTai);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
    if (window.innerWidth <= 860) {
      setSidebarCollapsed(true);
    }
  };

  const handleSaveProject = async (duLieu, hanhDong) => {
    const { error } = await luuDuAn(duLieu);
    if (error) return;

    const thongBaoTheoHanhDong = {
      save: 'createProjectPage.savedForBackend',
      createVideo: 'createProjectPage.videoReadyForBackend',
    };
    showToast(t(thongBaoTheoHanhDong[hanhDong] || thongBaoTheoHanhDong.save));
    setActiveMenu('Projects');
  };

  const handleOpenProject = (projectId) => {
    setProjectDangMoId(projectId);
    setActiveMenu('ProjectDetail');
  };

  const handleOpenChapter = (chapterId) => {
    setChuongDangMoId(chapterId);
    setActiveMenu('ChapterDetail');
  };

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <NenDashboard />
      <Sidebar
        activeMenu={activeMenu}
        onSelect={setActiveMenu}
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        onClose={handleSidebarClose}
        user={user}
        onLogin={onLogin}
      />

      <div className="workspace">
        <Header
          onMenuToggle={handleSidebarToggle}
          sidebarCollapsed={sidebarCollapsed}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          theme={caiDat.theme}
          onThemeChange={(theme) => onAppearanceChange('theme', theme)}
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
        ) : activeMenu === 'Projects' ? (
          <TrangDuAn
            user={user}
            projects={danhSachDuAn}
            loading={dangTaiDuAn}
            error={loiTaiDuAn}
            onLogin={onLogin}
            onCreateProject={() => setActiveMenu('CreateProject')}
            onOpenProject={handleOpenProject}
            onRetry={taiDanhSachDuAn}
          />
        ) : activeMenu === 'ProjectDetail' && projectDangMo ? (
          <TrangChiTietDuAn
            project={projectDangMo}
            onBack={() => setActiveMenu('Projects')}
            onOpenChapter={handleOpenChapter}
            onEditProject={capNhatProject}
            onDeleteProject={xoaProject}
            danhSachChuong={danhSachChuong}
            dangTaiChuong={dangTaiChuong}
            loiTaiChuong={loiTaiChuong}
            dangLuuChuong={dangLuuChuong}
            loiLuuChuong={loiLuuChuong}
            taiDanhSachChuong={taiDanhSachChuong}
            luuChuongMoi={luuChuongMoi}
            xoaChuong={xoaChuong}
            xoaLoiLuuChuong={xoaLoiLuuChuong}
          />
        ) : activeMenu === 'ChapterDetail' && projectDangMo && chuongDangMo ? (
          <TrangChiTietChuong
            user={user}
            project={projectDangMo}
            chuong={chuongDangMo}
            avatars={danhSachAvatar}
            onBack={() => setActiveMenu('ProjectDetail')}
            onSelectAvatar={chonAvatar}
            onUploadAvatar={(file) => taiLenAvatar(file)}
            onCreateVideo={() => setActiveMenu('VideoGenerator')}
          />
        ) : activeMenu === 'VideoGenerator' && projectDangMo && chuongDangMo ? (
          <TrangTaoVideoAI
            user={user}
            project={projectDangMo}
            chuong={chuongDangMo}
            avatars={danhSachAvatar}
            onBack={() => setActiveMenu('ChapterDetail')}
            onSaveVoiceConfig={chonVoice}
          />
        ) : activeMenu === 'CreateProject' && user ? (
          <TrangTaoDuAn
            dangLuu={dangLuuDuAn}
            loiLuu={loiLuuDuAn}
            onCancel={() => setActiveMenu('Projects')}
            onClearError={xoaLoiLuuDuAn}
            onSubmitProject={handleSaveProject}
          />
        ) : activeMenu === 'Profile' && user ? (
          <TrangHoSo user={user} onOpenStorage={() => setActiveMenu('Storage')} />
        ) : activeMenu === 'Documents' ? (
          <TrangTaiLieu
            user={user}
            projects={danhSachDuAn}
            documents={danhSachTaiLieu}
            loading={dangTaiTaiLieu}
            error={loiTaiTaiLieu}
            uploadingMap={dangTaiLenMap}
            uploadError={loiTaiLenTaiLieu}
            onLogin={onLogin}
            onRetry={taiDanhSachTaiLieu}
            onUpload={(file) => taiLenTaiLieu(file)}
            onRename={doiTenTaiLieu}
            onMove={diChuyenTaiLieu}
            onDownload={taiXuongTaiLieu}
            onDelete={xoaTaiLieu}
            onClearUploadError={xoaLoiTaiLen}
          />
        ) : activeMenu === 'Avatar AI' ? (
          <TrangAvatar
            user={user}
            projects={danhSachDuAn}
            avatars={danhSachAvatar}
            loading={dangTaiAvatar}
            error={loiTaiAvatar}
            uploadingMap={dangTaiLenAvatarMap}
            uploadError={loiTaiLenAvatar}
            onLogin={onLogin}
            onRetry={taiDanhSachAvatar}
            onUpload={(file) => taiLenAvatar(file)}
            onRename={doiTenAvatar}
            onSetDefault={datAvatarMacDinh}
            onMove={diChuyenAvatar}
            onDownload={taiXuongAvatar}
            onDelete={xoaAvatar}
            onClearUploadError={xoaLoiTaiLenAvatar}
          />
        ) : activeMenu === 'Videos' ? (
          <TrangVideo
            user={user}
            projects={danhSachDuAn}
            videos={danhSachVideo}
            loading={dangTaiVideo}
            error={loiTaiVideo}
            uploadingMap={dangTaiLenVideoMap}
            uploadError={loiTaiLenVideo}
            onLogin={onLogin}
            onRetry={taiDanhSachVideo}
            onUpload={(file) => taiLenVideo(file)}
            onRename={doiTenVideo}
            onDownload={taiXuongVideo}
            onDelete={xoaVideo}
            onOpenProject={handleOpenProject}
            onClearUploadError={xoaLoiTaiLenVideo}
          />
        ) : activeMenu === 'History' ? (
          <TrangLichSu
            projects={danhSachDuAn}
            tasks={danhSachTacVu}
            loading={dangTaiLichSu}
            error={loiTaiLichSu}
            onRetry={taiDanhSachLichSu}
            onOpenProject={handleOpenProject}
            onOpenVideo={() => setActiveMenu('Videos')}
            onCancelTask={huyTacVu}
            onRetryTask={chayLaiTacVu}
            onDeleteTask={xoaTacVu}
          />
        ) : (
          <main className="dashboard">
            <section className="welcome-card">
            <div className="welcome-copy">
              <span className="eyebrow"><Sparkles size={15} /> {t('dashboard.eyebrow')}</span>
              <h1>
                {user
                  ? t('dashboard.greetingName', {
                    name: user.user_metadata?.full_name?.trim()?.split(/\s+/).slice(-1)[0]
                      || user.email?.split('@')[0],
                  })
                  : t('dashboard.greeting')}{' '}
                <span className="welcome-wave" aria-hidden="true">👋</span>
              </h1>
              <p>
                {user
                  ? t('dashboard.welcomeUser')
                  : t('dashboard.welcomeGuest')}
              </p>
              <div className="welcome-actions">
                <button className="primary-button" onClick={() => handleQuickAction(quickActions[5])}>
                  <Sparkles size={18} /> {t('dashboard.createVideo')}
                </button>
                <button className="secondary-button" onClick={() => handleQuickAction(quickActions[0])}>
                  <Plus size={18} /> {t('dashboard.newProject')}
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
                <div className="preview-footer"><span>{t('dashboard.previewEmpty')}</span><small>00:00 / 00:00</small></div>
              </div>
            </div>
            </section>

          <section className="stats-grid" aria-label={t('dashboard.overviewLabel')}>
            {stats.map((stat) => <StatCard stat={stat} key={stat.labelKey} />)}
          </section>

          <section className="panel quick-actions-panel">
            <SectionHeader
              title={t('dashboard.quickTitle')}
              description={t('dashboard.quickDescription')}
            />
            <div className="quick-actions-grid">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    className={`quick-action ${action.featured ? 'featured' : ''}`}
                    key={action.id}
                    onClick={() => handleQuickAction(action)}
                  >
                    <span className={`quick-icon ${action.tone}`}><Icon size={21} /></span>
                    <span><strong>{t(action.labelKey)}</strong><small>{t(action.descriptionKey)}</small></span>
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
                  title={t('dashboard.progress.title')}
                  description={t('dashboard.progress.description')}
                  action={t('common.viewAll')}
                />
                <div className="processing-list">
                  {processingVideos.map((item) => (
                    <article className="processing-item" key={item.videoKey}>
                      <div className="processing-thumbnail">
                        <Video size={21} />
                        <span>{item.progress}%</span>
                      </div>
                      <div className="processing-info">
                        <div className="processing-title">
                          <div><span>{t(item.projectKey)}</span><strong>{t(item.videoKey)}</strong></div>
                          <strong style={{ color: item.color }}>{item.progress}%</strong>
                        </div>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={t('dashboard.progress.progressLabel', { video: t(item.videoKey) })}
                          aria-valuenow={item.progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          <span style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                        </div>
                        <div className="processing-meta">
                          <span><Activity size={14} /> {t(item.statusKey)}</span>
                          <span><Clock3 size={14} /> {t(item.startedKey)}</span>
                        </div>
                      </div>
                      <button className="icon-button"><MoreHorizontal size={19} /><span className="sr-only">{t('dashboard.progress.options')}</span></button>
                    </article>
                  ))}
                  {processingVideos.length === 0 && (
                    <div className="panel-empty">
                      <Video size={23} />
                      <strong>{t('dashboard.progress.emptyTitle')}</strong>
                      <span>{t('dashboard.progress.emptyDescription')}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="panel recent-panel">
                <SectionHeader
                  title={t('dashboard.recent.title')}
                  description={searchQuery
                    ? t('dashboard.recent.resultCount', { count: filteredRecentItems.length })
                    : t('dashboard.recent.description')}
                  action={t('common.viewAll')}
                />
                <div className="recent-table-wrap">
                  <table className="recent-table">
                    <thead><tr><th>{t('dashboard.recent.projectVideo')}</th><th>{t('dashboard.recent.createdAt')}</th><th>{t('dashboard.recent.status')}</th><th>{t('dashboard.recent.duration')}</th><th><span className="sr-only">{t('dashboard.recent.actions')}</span></th></tr></thead>
                    <tbody>
                      {filteredRecentItems.map((item) => (
                        <tr key={item.videoKey}>
                          <td>
                            <div className="project-cell">
                              <span className="project-icon"><Play size={15} fill="currentColor" /></span>
                              <span><strong>{t(item.videoKey)}</strong><small>{t(item.projectKey)}</small></span>
                            </div>
                          </td>
                          <td data-label={t('dashboard.recent.time')}>{item.createdKey ? t(item.createdKey) : item.created}</td>
                          <td data-label={t('dashboard.recent.status')}><span className={`status-badge ${item.tone}`}>{t(item.statusKey)}</span></td>
                          <td data-label={t('dashboard.recent.duration')}>{item.duration}</td>
                          <td>
                            <div className="table-actions">
                              <button title={t('dashboard.recent.openProject')}><FolderOpen size={17} /></button>
                              <button title={t('dashboard.recent.viewVideo')} disabled={!item.completed}><Eye size={17} /></button>
                              <button title={t('dashboard.recent.downloadVideo')} disabled={!item.completed}><Download size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecentItems.length === 0 && (
                    <div className="empty-search">
                      <Search size={24} />
                      <strong>{t(searchQuery ? 'dashboard.recent.emptySearchTitle' : 'dashboard.recent.emptyTitle')}</strong>
                      <span>{t(searchQuery ? 'dashboard.recent.emptySearchDescription' : 'dashboard.recent.emptyDescription')}</span>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="dashboard-secondary">
              <section className="panel storage-panel">
                <SectionHeader title={t('dashboard.storage.title')} action={t('common.manage')} />
                <div className="storage-summary">
                  <div className="storage-donut empty">
                    <div><strong>0</strong><span>{t('dashboard.storage.used')}</span></div>
                  </div>
                  <div className="storage-numbers">
                    <span><small>{t('dashboard.storage.total')}</small><strong>0 GB</strong></span>
                    <span><small>{t('dashboard.storage.remaining')}</small><strong>0 GB</strong></span>
                  </div>
                </div>
                <div className="storage-list">
                  {storageItems.map((item) => (
                    <div className="storage-row" key={item.labelKey}>
                      <span className="storage-color" style={{ backgroundColor: item.color }} />
                      <span className="storage-label">{t(item.labelKey)}</span>
                      <div className="storage-bar"><span style={{ width: `${item.percent}%`, backgroundColor: item.color }} /></div>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel notifications-panel">
                <SectionHeader title={t('dashboard.notifications.title')} action={t('common.viewAll')} />
                <div className="notification-list">
                  {notifications.map(({ titleKey, detailKey, timeKey, tone, icon: Icon, unread }) => (
                    <article className={`notification-item ${unread ? 'unread' : ''}`} key={titleKey}>
                      <span className={`notification-icon ${tone}`}><Icon size={17} /></span>
                      <div><strong>{t(titleKey)}</strong><p>{t(detailKey)}</p><small>{t(timeKey)}</small></div>
                    </article>
                  ))}
                  {notifications.length === 0 && (
                    <div className="panel-empty compact">
                      <strong>{t('dashboard.notifications.emptyTitle')}</strong>
                      <span>{t('dashboard.notifications.emptyDescription')}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="panel activity-panel">
                <SectionHeader title={t('dashboard.activities.title')} action={t('common.viewAll')} />
                <div className="activity-list">
                  {activities.map(({ actionKey, time, timeKey, icon: Icon }, index) => (
                    <div className="activity-item" key={actionKey}>
                      <span className="activity-icon"><Icon size={15} /></span>
                      <div><strong>{t(actionKey)}</strong><small>{timeKey ? t(timeKey) : time}</small></div>
                      {index < activities.length - 1 && <i />}
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="panel-empty compact">
                      <strong>{t('dashboard.activities.emptyTitle')}</strong>
                      <span>{t('dashboard.activities.emptyDescription')}</span>
                    </div>
                  )}
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
          <button onClick={() => setToast('')}><X size={17} /><span className="sr-only">{t('dashboard.close')}</span></button>
        </div>
      )}
    </div>
  );
}

export default TrangDashboard;
