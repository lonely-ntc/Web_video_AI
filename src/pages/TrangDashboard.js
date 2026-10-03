import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
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

// Chua co he thong goi cuoc rieng -> tam thoi coi 1 tai khoan duoc 5GB de
// tinh % dung luong da dung tren donut. Sua o day khi co bang goi cuoc that.
const TONG_DUNG_LUONG_GOI_BYTES = 5 * 1024 ** 3;

function dinhDangDungLuong(bytes) {
  if (!bytes) return '0 GB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function dinhDangThoiLuong(giay) {
  if (!giay) return '—';
  const phut = Math.floor(giay / 60);
  const giayConLai = Math.round(giay % 60);
  return `${phut}:${String(giayConLai).padStart(2, '0')}`;
}

function dinhDangNgay(ngay, locale) {
  if (!ngay) return '—';
  const giaTri = new Date(ngay);
  if (Number.isNaN(giaTri.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(giaTri);
}

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

// Cac card thong ke, tien trinh, danh sach gan day, va dung luong luu tru
// deu duoc TINH TU DU LIEU THAT trong component (xem cac useMemo o duoi),
// khong con la mang tinh (mock) nhu truoc.

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

// Chua co nguon du lieu that cho thong bao he thong / lich su hoat dong rieng
// tren dashboard -> de trong, tranh hien mock. Se noi voi bang that sau.
const notifications = [];
const activities = [];

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
        <small>{stat.detail ?? t(stat.detailKey)}</small>
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
  const [loaiToast, setLoaiToast] = useState('success');
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
    taiDanhSachVideo,
    doiTen: doiTenVideo,
    taiXuong: taiXuongVideo,
    xoa: xoaVideo,
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

  const thongKeKho = useMemo(() => {
    const taiLieuBytes = danhSachTaiLieu.reduce((tong, tl) => tong + (tl.sizeBytes || 0), 0);
    const anhBytes = danhSachAvatar.reduce((tong, av) => tong + (av.sizeBytes || 0), 0);
    const videoBytes = danhSachVideo.reduce((tong, vd) => tong + (vd.sizeBytes || 0), 0);
    // Am thanh giong doc chua co danh sach tong hop rieng o cap dashboard
    // (chi truy van theo tung chuong) -> tam thoi khong tinh vao day.
    const tongDaDung = taiLieuBytes + anhBytes + videoBytes;
    const tyLe = (bytes) => (tongDaDung > 0 ? Math.round((bytes / tongDaDung) * 100) : 0);

    // Ty le tren tong dung luong GOI (khong phai tren tong DA DUNG) de ve
    // dung vong tron conic-gradient: tong cac doan mau = % da dung cua goi.
    const pctGoi = (bytes) => (bytes / TONG_DUNG_LUONG_GOI_BYTES) * 100;
    const mocDoc = pctGoi(taiLieuBytes);
    const mocAnh = mocDoc + pctGoi(anhBytes);
    const mocAmThanh = mocAnh; // chua co du lieu am thanh tong hop
    const mocVideo = mocAmThanh + pctGoi(videoBytes);
    const conicGradient = `conic-gradient(#725cf6 0 ${mocDoc}%, #f27ca6 ${mocDoc}% ${mocAnh}%, `
      + `#f4a261 ${mocAnh}% ${mocAmThanh}%, #2e8cff ${mocAmThanh}% ${mocVideo}%, #eef0f5 ${mocVideo}% 100%)`;

    return {
      tongDaDung,
      phanTramGoi: Math.min(100, Math.round((tongDaDung / TONG_DUNG_LUONG_GOI_BYTES) * 100)),
      conicGradient,
      items: [
        { labelKey: 'dashboard.storage.documents', value: dinhDangDungLuong(taiLieuBytes), percent: tyLe(taiLieuBytes), color: '#725cf6' },
        { labelKey: 'dashboard.storage.images', value: dinhDangDungLuong(anhBytes), percent: tyLe(anhBytes), color: '#f27ca6' },
        { labelKey: 'dashboard.storage.audio', value: '0 KB', percent: 0, color: '#f4a261' },
        { labelKey: 'dashboard.storage.video', value: dinhDangDungLuong(videoBytes), percent: tyLe(videoBytes), color: '#2e8cff' },
      ],
    };
  }, [danhSachTaiLieu, danhSachAvatar, danhSachVideo]);

  const stats = useMemo(() => {
    const soVideoDangXuLy = danhSachVideo.filter((video) => video.status === 'rendering').length;
    return [
      {
        labelKey: 'dashboard.stats.projects',
        value: String(danhSachDuAn.length),
        detailKey: 'dashboard.stats.projectsDetail',
        detail: danhSachDuAn.length > 0 ? t('dashboard.stats.projectsActive', { count: danhSachDuAn.length }) : undefined,
        icon: FolderKanban,
        tone: 'purple',
      },
      {
        labelKey: 'dashboard.stats.videos',
        value: String(danhSachVideo.length),
        detailKey: 'dashboard.stats.videosDetail',
        detail: danhSachVideo.length > 0 ? t('dashboard.stats.videosActive', { count: danhSachVideo.length }) : undefined,
        icon: Video,
        tone: 'blue',
      },
      {
        labelKey: 'dashboard.stats.documents',
        value: String(danhSachTaiLieu.length),
        detailKey: 'dashboard.stats.documentsDetail',
        detail: danhSachTaiLieu.length > 0 ? t('dashboard.stats.documentsActive', { count: danhSachTaiLieu.length }) : undefined,
        icon: FileText,
        tone: 'orange',
      },
      {
        labelKey: 'dashboard.stats.avatars',
        value: String(danhSachAvatar.length),
        detailKey: 'dashboard.stats.avatarsDetail',
        detail: danhSachAvatar.length > 0 ? t('dashboard.stats.avatarsActive', { count: danhSachAvatar.length }) : undefined,
        icon: UserRound,
        tone: 'pink',
      },
      {
        labelKey: 'dashboard.stats.used',
        value: dinhDangDungLuong(thongKeKho.tongDaDung),
        detailKey: 'dashboard.stats.usedDetail',
        detail: thongKeKho.tongDaDung > 0 ? t('dashboard.stats.usedActive', { percent: thongKeKho.phanTramGoi }) : undefined,
        icon: HardDrive,
        tone: 'green',
      },
      {
        labelKey: 'dashboard.stats.processing',
        value: String(soVideoDangXuLy),
        detailKey: 'dashboard.stats.processingDetail',
        detail: soVideoDangXuLy > 0 ? t('dashboard.stats.processingActive', { count: soVideoDangXuLy }) : undefined,
        icon: Activity,
        tone: 'indigo',
      },
    ];
  }, [danhSachDuAn, danhSachVideo, danhSachTaiLieu, danhSachAvatar, thongKeKho, t]);

  const dsDangXuLy = useMemo(() => (
    danhSachVideo
      .filter((video) => video.status === 'rendering')
      .map((video) => ({
        id: video.id,
        projectName: danhSachDuAn.find((duAn) => duAn.id === video.projectId)?.name || '—',
        videoName: video.name,
        progress: 50,
        color: '#7762f4',
        statusLabel: t('dashboard.recent.processing'),
      }))
  ), [danhSachVideo, danhSachDuAn, t]);

  const dsGanDay = useMemo(() => {
    const NHAN_TRANG_THAI = {
      completed: { labelKey: 'dashboard.recent.completed', tone: 'success' },
      rendering: { labelKey: 'dashboard.recent.processing', tone: 'processing' },
      failed: { labelKey: 'dashboard.recent.failed', tone: 'draft' },
    };

    const tuVideo = danhSachVideo.map((video) => {
      const trangThai = NHAN_TRANG_THAI[video.status] || NHAN_TRANG_THAI.rendering;
      return {
        id: `video-${video.id}`,
        projectName: danhSachDuAn.find((duAn) => duAn.id === video.projectId)?.name || '—',
        videoName: video.name,
        createdAt: video.updatedAt || video.createdAt,
        statusLabel: t(trangThai.labelKey),
        tone: trangThai.tone,
        duration: dinhDangThoiLuong(video.duration),
        completed: video.status === 'completed',
        projectId: video.projectId,
      };
    });

    const duAnChuaCoVideo = danhSachDuAn
      .filter((duAn) => !danhSachVideo.some((video) => video.projectId === duAn.id))
      .map((duAn) => ({
        id: `project-${duAn.id}`,
        projectName: duAn.name,
        videoName: t('dashboard.recent.noVideoYet'),
        createdAt: duAn.updatedAt || duAn.createdAt,
        statusLabel: t('dashboard.recent.draft'),
        tone: 'draft',
        duration: '—',
        completed: false,
        projectId: duAn.id,
      }));

    return [...tuVideo, ...duAnChuaCoVideo]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 8);
  }, [danhSachVideo, danhSachDuAn, t]);

  const filteredRecentItems = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase(language);
    if (!query) return dsGanDay;
    return dsGanDay.filter((item) =>
      `${item.projectName} ${item.videoName} ${item.statusLabel}`
        .toLocaleLowerCase(language)
        .includes(query)
    );
  }, [dsGanDay, language, searchQuery]);

  const showToast = (message, loai = 'success') => {
    setToast(message);
    setLoaiToast(loai);
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
    if (action.id === 'createVideo') {
      setActiveMenu('Projects');
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

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0];
    const hanhDong = event.target.dataset.action;
    event.target.value = '';
    if (!file) return;

    const taiLenTheoHanhDong = {
      uploadPdf: taiLenTaiLieu,
      uploadWord: taiLenTaiLieu,
      uploadPowerPoint: taiLenTaiLieu,
      uploadAvatar: taiLenAvatar,
    };
    const taiLen = taiLenTheoHanhDong[hanhDong];
    if (!taiLen) {
      showToast(t('dashboard.fileSelected', { file: file.name }));
      return;
    }

    const { error } = await taiLen(file);
    if (error) {
      showToast(error.message || t('dashboard.uploadFailed'), 'error');
      return;
    }
    showToast(t('dashboard.fileUploaded', { file: file.name }));
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
    if (error) {
      showToast(t('createProjectPage.errors.saveFailed'), 'error');
      return;
    }

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
            onUploadAvatar={(file) => taiLenAvatar(file, projectDangMo.id)}
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
            onSelectAvatar={chonAvatar}
            onUploadAvatar={(file) => taiLenAvatar(file, projectDangMo.id)}
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
            projects={danhSachDuAn}
            videos={danhSachVideo}
            loading={dangTaiVideo}
            error={loiTaiVideo}
            onRetry={taiDanhSachVideo}
            onRename={doiTenVideo}
            onDownload={taiXuongVideo}
            onDelete={xoaVideo}
            onOpenProject={handleOpenProject}
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
                  {dsDangXuLy.map((item) => (
                    <article className="processing-item" key={item.id}>
                      <div className="processing-thumbnail">
                        <Video size={21} />
                        <span>{item.progress}%</span>
                      </div>
                      <div className="processing-info">
                        <div className="processing-title">
                          <div><span>{item.projectName}</span><strong>{item.videoName}</strong></div>
                          <strong style={{ color: item.color }}>{item.progress}%</strong>
                        </div>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={t('dashboard.progress.progressLabel', { video: item.videoName })}
                          aria-valuenow={item.progress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        >
                          <span style={{ width: `${item.progress}%`, backgroundColor: item.color }} />
                        </div>
                        <div className="processing-meta">
                          <span><Activity size={14} /> {item.statusLabel}</span>
                        </div>
                      </div>
                      <button className="icon-button"><MoreHorizontal size={19} /><span className="sr-only">{t('dashboard.progress.options')}</span></button>
                    </article>
                  ))}
                  {dsDangXuLy.length === 0 && (
                    <div className="empty-state compact">
                      <span className="empty-state-icon"><Video size={20} /></span>
                      <h3>{t('dashboard.progress.emptyTitle')}</h3>
                      <p>{t('dashboard.progress.emptyDescription')}</p>
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
                        <tr key={item.id}>
                          <td>
                            <div className="project-cell">
                              <span className="project-icon"><Play size={15} fill="currentColor" /></span>
                              <span><strong>{item.videoName}</strong><small>{item.projectName}</small></span>
                            </div>
                          </td>
                          <td data-label={t('dashboard.recent.time')}>{dinhDangNgay(item.createdAt, language)}</td>
                          <td data-label={t('dashboard.recent.status')}><span className={`status-badge ${item.tone}`}>{item.statusLabel}</span></td>
                          <td data-label={t('dashboard.recent.duration')}>{item.duration}</td>
                          <td>
                            <div className="table-actions">
                              <button title={t('dashboard.recent.openProject')} onClick={() => handleOpenProject(item.projectId)}><FolderOpen size={17} /></button>
                              <button title={t('dashboard.recent.viewVideo')} disabled={!item.completed} onClick={() => setActiveMenu('Videos')}><Eye size={17} /></button>
                              <button title={t('dashboard.recent.downloadVideo')} disabled={!item.completed} onClick={() => setActiveMenu('Videos')}><Download size={17} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filteredRecentItems.length === 0 && (
                    <div className="empty-state compact">
                      <span className="empty-state-icon"><Search size={20} /></span>
                      <h3>{t(searchQuery ? 'dashboard.recent.emptySearchTitle' : 'dashboard.recent.emptyTitle')}</h3>
                      <p>{t(searchQuery ? 'dashboard.recent.emptySearchDescription' : 'dashboard.recent.emptyDescription')}</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <aside className="dashboard-secondary">
              <section className="panel storage-panel">
                <SectionHeader title={t('dashboard.storage.title')} action={t('common.manage')} />
                <div className="storage-summary">
                  <div
                    className={`storage-donut ${thongKeKho.tongDaDung > 0 ? '' : 'empty'}`}
                    style={thongKeKho.tongDaDung > 0 ? { background: thongKeKho.conicGradient } : undefined}
                  >
                    <div><strong>{thongKeKho.phanTramGoi}%</strong><span>{t('dashboard.storage.used')}</span></div>
                  </div>
                  <div className="storage-numbers">
                    <span><small>{t('dashboard.storage.total')}</small><strong>{dinhDangDungLuong(TONG_DUNG_LUONG_GOI_BYTES)}</strong></span>
                    <span><small>{t('dashboard.storage.remaining')}</small><strong>{dinhDangDungLuong(Math.max(0, TONG_DUNG_LUONG_GOI_BYTES - thongKeKho.tongDaDung))}</strong></span>
                  </div>
                </div>
                <div className="storage-list">
                  {thongKeKho.items.map((item) => (
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
                    <div className="empty-state compact">
                      <span className="empty-state-icon"><Bell size={20} /></span>
                      <h3>{t('dashboard.notifications.emptyTitle')}</h3>
                      <p>{t('dashboard.notifications.emptyDescription')}</p>
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
                    <div className="empty-state compact">
                      <span className="empty-state-icon"><Activity size={20} /></span>
                      <h3>{t('dashboard.activities.emptyTitle')}</h3>
                      <p>{t('dashboard.activities.emptyDescription')}</p>
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
        <div className={`toast ${loaiToast === 'error' ? 'error' : ''}`} role="status">
          {loaiToast === 'error' ? <CircleAlert size={19} /> : <CheckCircle2 size={19} />}
          <span>{toast}</span>
          <button onClick={() => setToast('')}><X size={17} /><span className="sr-only">{t('dashboard.close')}</span></button>
        </div>
      )}
    </div>
  );
}

export default TrangDashboard;
