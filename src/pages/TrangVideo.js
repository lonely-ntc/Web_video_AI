import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Download,
  FolderKanban,
  FolderOpen,
  HardDrive,
  Loader2,
  MoreHorizontal,
  Pause,
  PencilLine,
  Play,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  Video as VideoIcon,
  X,
  XCircle,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/video.css';

const SO_VIDEO_MOI_TRANG = 8;

const boLocTrangThai = [
  { id: 'all', labelKey: 'videoPage.filters.all' },
  { id: 'pending', labelKey: 'videoPage.status.pending' },
  { id: 'rendering', labelKey: 'videoPage.status.rendering' },
  { id: 'completed', labelKey: 'videoPage.status.completed' },
  { id: 'failed', labelKey: 'videoPage.status.failed' },
];

const tuyChonSapXep = [
  { id: 'newest', labelKey: 'videoPage.sort.newest' },
  { id: 'oldest', labelKey: 'videoPage.sort.oldest' },
  { id: 'nameAsc', labelKey: 'videoPage.sort.nameAsc' },
  { id: 'sizeDesc', labelKey: 'videoPage.sort.sizeDesc' },
];

const thaoTacVideo = [
  { id: 'play', labelKey: 'videoPage.menu.play', icon: Play },
  { id: 'download', labelKey: 'videoPage.menu.download', icon: Download },
  { id: 'share', labelKey: 'videoPage.menu.share', icon: Share2 },
  { id: 'openProject', labelKey: 'videoPage.menu.openProject', icon: FolderOpen },
  { id: 'rename', labelKey: 'videoPage.menu.rename', icon: PencilLine },
  { id: 'delete', labelKey: 'videoPage.menu.delete', icon: Trash2, danger: true },
];

const TRANG_THAI_ICON = {
  pending: Clock3,
  rendering: Loader2,
  completed: CheckCircle2,
  failed: XCircle,
};

function dinhDangNgay(ngay, locale, fallback) {
  if (!ngay) return fallback;
  const giaTri = new Date(ngay);
  if (Number.isNaN(giaTri.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(giaTri);
}

function dinhDangDungLuong(bytes) {
  if (!bytes) return '0 KB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function dinhDangThoiLuong(giay) {
  const phut = Math.floor(giay / 60);
  const giayConLai = Math.round(giay % 60);
  return `${phut}:${String(giayConLai).padStart(2, '0')}`;
}

function ModalNen({ title, onClose, children }) {
  return (
    <div className="video-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="video-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="video-modal-head">
          <h3>{title}</h3>
          <button type="button" aria-label={title} onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function TheVideo({
  video, projectName, dangTaiXuong, menuDangMo, onToggleMenu, onOpen, onAction,
}) {
  const { locale, t } = useNgonNgu();
  const IconTrangThai = TRANG_THAI_ICON[video.status] || Clock3;
  const chuaCoFile = video.status !== 'completed' || !video.fileUrl;

  return (
    <article className="video-item">
      <button type="button" className="video-cover" onClick={onOpen} aria-label={video.name}>
        <span className="video-cover-placeholder"><VideoIcon size={32} /></span>
        {video.duration > 0 && (
          <span className="video-duration-badge">{dinhDangThoiLuong(video.duration)}</span>
        )}
        {!chuaCoFile && (
          <span className="video-play-overlay"><Play size={22} /></span>
        )}
        <span className={`video-status-badge ${video.status}`}>
          <IconTrangThai size={11} className={video.status === 'rendering' ? 'spin' : ''} />
          {t(`videoPage.status.${video.status}`)}
        </span>
      </button>

      <div className="video-content">
        <div className="video-title-row">
          <h3>{video.name}</h3>
          <div className="video-menu-anchor">
            <button
              type="button"
              className="video-menu-button"
              aria-label={t('videoPage.menuLabel', { name: video.name })}
              aria-expanded={menuDangMo}
              onClick={onToggleMenu}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuDangMo && (
              <div className="video-action-menu">
                {thaoTacVideo.map(({ id, labelKey, icon: Icon, danger }) => (
                  <button
                    type="button"
                    key={id}
                    className={danger ? 'danger' : ''}
                    disabled={
                      ((id === 'play' || id === 'download' || id === 'share') && chuaCoFile)
                      || (id === 'download' && dangTaiXuong)
                    }
                    onClick={() => onAction(id)}
                  >
                    <Icon size={15} /> {t(labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="video-project-line">
          <FolderKanban size={13} /> {projectName || t('videoPage.noProject')}
        </p>

        <div className="video-meta">
          <span>{video.resolution || '—'}</span>
          <span>{dinhDangDungLuong(video.sizeBytes)}</span>
          <span>{dinhDangNgay(video.createdAt, locale, t('common.notUpdated'))}</span>
        </div>
      </div>
    </article>
  );
}

function TrangVideo({
  projects = [],
  videos = [],
  loading = false,
  error = '',
  onRetry,
  onRename,
  onDownload,
  onDelete,
  onOpenProject,
}) {
  const { locale, t } = useNgonNgu();

  const [tuKhoa, setTuKhoa] = useState('');
  const [boLoc, setBoLoc] = useState('all');
  const [sapXep, setSapXep] = useState('newest');
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [menuDangMo, setMenuDangMo] = useState(null);
  const [videoXem, setVideoXem] = useState(null);
  const [videoDoiTen, setVideoDoiTen] = useState(null);
  const [tenMoi, setTenMoi] = useState('');
  const [dangTaiXuongId, setDangTaiXuongId] = useState(null);
  const [loiTaiXuong, setLoiTaiXuong] = useState('');
  const [thongBaoChiaSe, setThongBaoChiaSe] = useState('');

  const danhSachProject = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects],
  );

  const tenProjectTheoId = useMemo(() => {
    const banDo = new Map(danhSachProject.map((duAn) => [duAn.id, duAn.name]));
    return (projectId) => banDo.get(projectId) || '';
  }, [danhSachProject]);

  const danhSachVideo = useMemo(
    () => (Array.isArray(videos) ? videos : []),
    [videos],
  );

  const thongKe = useMemo(() => ({
    total: danhSachVideo.length,
    rendering: danhSachVideo.filter((video) => video.status === 'rendering').length,
    completed: danhSachVideo.filter((video) => video.status === 'completed').length,
    failed: danhSachVideo.filter((video) => video.status === 'failed').length,
    storageBytes: danhSachVideo.reduce((tong, video) => tong + (video.sizeBytes || 0), 0),
  }), [danhSachVideo]);

  const videoDaLoc = useMemo(() => {
    const timKiem = tuKhoa.trim().toLocaleLowerCase(locale);
    const ketQua = danhSachVideo.filter((video) => {
      const dungBoLoc = boLoc === 'all' || video.status === boLoc;
      const noiDung = `${video.name} ${tenProjectTheoId(video.projectId)}`.toLocaleLowerCase(locale);
      return dungBoLoc && (!timKiem || noiDung.includes(timKiem));
    });

    const sapXepBang = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      nameAsc: (a, b) => a.name.localeCompare(b.name, locale),
      sizeDesc: (a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0),
    };
    return [...ketQua].sort(sapXepBang[sapXep] || sapXepBang.newest);
  }, [boLoc, danhSachVideo, locale, sapXep, tenProjectTheoId, tuKhoa]);

  const coBoLoc = Boolean(tuKhoa) || boLoc !== 'all';
  const tongSoTrang = Math.max(1, Math.ceil(videoDaLoc.length / SO_VIDEO_MOI_TRANG));
  const trangHopLe = Math.min(trangHienTai, tongSoTrang);
  const videoTrongTrang = videoDaLoc.slice(
    (trangHopLe - 1) * SO_VIDEO_MOI_TRANG,
    trangHopLe * SO_VIDEO_MOI_TRANG,
  );
  const lamMoi = async () => {
    setDangLamMoi(true);
    await onRetry?.();
    setDangLamMoi(false);
  };

  const taiXuongVideo = async (video) => {
    if (!onDownload) return;
    setLoiTaiXuong('');
    setDangTaiXuongId(video.id);
    const { data, error: loi } = await onDownload(video.id) || {};
    setDangTaiXuongId(null);

    if (loi || !data?.url) {
      setLoiTaiXuong(t('videoPage.errors.downloadFailed'));
      return;
    }

    const lienKet = document.createElement('a');
    lienKet.href = data.url;
    lienKet.download = `${video.name}.${(video.format || 'mp4').toLowerCase()}`;
    lienKet.rel = 'noopener noreferrer';
    document.body.appendChild(lienKet);
    lienKet.click();
    document.body.removeChild(lienKet);
  };

  const chiaSeVideo = async (video) => {
    if (!video.fileUrl) return;
    setThongBaoChiaSe('');
    try {
      await navigator.clipboard.writeText(video.fileUrl);
      setThongBaoChiaSe(t('videoPage.shareCopied'));
    } catch {
      setThongBaoChiaSe(t('videoPage.errors.shareFailed'));
    }
  };

  const xuLyThaoTac = (thaoTac, video) => {
    setMenuDangMo(null);
    if (thaoTac === 'play') {
      setVideoXem(video);
    } else if (thaoTac === 'download') {
      taiXuongVideo(video);
    } else if (thaoTac === 'share') {
      chiaSeVideo(video);
    } else if (thaoTac === 'openProject') {
      if (video.projectId) onOpenProject?.(video.projectId);
    } else if (thaoTac === 'rename') {
      setVideoDoiTen(video);
      setTenMoi(video.name);
    } else if (thaoTac === 'delete') {
      onDelete?.(video.id);
      if (videoXem?.id === video.id) setVideoXem(null);
    }
  };

  const luuDoiTen = async () => {
    const ten = tenMoi.trim();
    if (!ten || !videoDoiTen) return;
    const { error: loi } = await onRename?.(videoDoiTen.id, ten) || {};
    if (!loi) setVideoDoiTen(null);
  };

  return (
    <main className="video-page">
      <section className="video-hero">
        <div>
          <span className="video-eyebrow"><VideoIcon size={15} /> {t('videoPage.eyebrow')}</span>
          <h1>{t('videoPage.title')}</h1>
          <p>{t('videoPage.description')}</p>
        </div>
        <div className="video-hero-mark" aria-hidden="true">
          <VideoIcon size={35} />
        </div>
      </section>

      <section className="video-stats" aria-label={t('videoPage.stats.label')}>
        <article className="video-stat-card">
          <span className="tone-purple"><VideoIcon size={19} /></span>
          <div><strong>{thongKe.total}</strong><small>{t('videoPage.stats.total')}</small></div>
        </article>
        <article className="video-stat-card">
          <span className="tone-blue"><Loader2 size={19} /></span>
          <div><strong>{thongKe.rendering}</strong><small>{t('videoPage.stats.rendering')}</small></div>
        </article>
        <article className="video-stat-card">
          <span className="tone-green"><CheckCircle2 size={19} /></span>
          <div><strong>{thongKe.completed}</strong><small>{t('videoPage.stats.completed')}</small></div>
        </article>
        <article className="video-stat-card">
          <span className="tone-red"><XCircle size={19} /></span>
          <div><strong>{thongKe.failed}</strong><small>{t('videoPage.stats.failed')}</small></div>
        </article>
        <article className="video-stat-card">
          <span className="tone-orange"><HardDrive size={19} /></span>
          <div><strong>{dinhDangDungLuong(thongKe.storageBytes)}</strong><small>{t('videoPage.stats.storage')}</small></div>
        </article>
      </section>

      <section className="video-toolbar" aria-label={t('videoPage.toolbarLabel')}>
        <label className="video-search">
          <Search size={17} />
          <input
            value={tuKhoa}
            onChange={(event) => { setTuKhoa(event.target.value); setTrangHienTai(1); }}
            placeholder={t('videoPage.searchPlaceholder')}
            aria-label={t('videoPage.searchLabel')}
          />
        </label>

        <select
          className="video-select"
          value={boLoc}
          aria-label={t('videoPage.filters.label')}
          onChange={(event) => { setBoLoc(event.target.value); setTrangHienTai(1); }}
        >
          {boLocTrangThai.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <select
          className="video-select"
          value={sapXep}
          aria-label={t('videoPage.sort.label')}
          onChange={(event) => setSapXep(event.target.value)}
        >
          {tuyChonSapXep.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <button type="button" className="video-refresh" onClick={lamMoi}>
          <RefreshCw size={16} className={dangLamMoi ? 'spin' : ''} /> {t('videoPage.refresh')}
        </button>
      </section>

      <section className="video-list-panel">
        <div className="video-list-heading">
          <h2>{t('videoPage.listTitle')}</h2>
          <p>{t('videoPage.resultCount', { count: videoDaLoc.length })}</p>
        </div>

        {loading ? (
          <div className="video-grid" aria-live="polite" aria-label={t('videoPage.loading')}>
            {Array.from({ length: 8 }).map((_, chiSo) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="video-skeleton-card" key={chiSo} aria-hidden="true">
                <div className="skeleton skeleton-thumb" />
                <div className="video-skeleton-card-body">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="video-empty" role="alert">
            <span className="tone-red"><CircleAlert size={25} /></span>
            <h3>{t('videoPage.loadErrorTitle')}</h3>
            <p>{error}</p>
            <button type="button" onClick={onRetry}>{t('videoPage.retry')}</button>
          </div>
        ) : videoTrongTrang.length > 0 ? (
          <div className="video-grid">
            {videoTrongTrang.map((video) => (
              <TheVideo
                video={video}
                projectName={tenProjectTheoId(video.projectId)}
                dangTaiXuong={dangTaiXuongId === video.id}
                menuDangMo={menuDangMo === video.id}
                key={video.id}
                onToggleMenu={() => setMenuDangMo((hienTai) => (hienTai === video.id ? null : video.id))}
                onOpen={() => setVideoXem(video)}
                onAction={(thaoTac) => xuLyThaoTac(thaoTac, video)}
              />
            ))}
          </div>
        ) : (
          <div className="video-empty">
            <span><VideoIcon size={32} /></span>
            <h3>{t(coBoLoc ? 'videoPage.emptyFilteredTitle' : 'videoPage.emptyTitle')}</h3>
            <p>{t(coBoLoc ? 'videoPage.emptyFilteredDescription' : 'videoPage.emptyDescription')}</p>
          </div>
        )}

        {!loading && !error && videoDaLoc.length > 0 && (
          <nav className="video-pagination" aria-label={t('videoPage.pagination.label')}>
            <button
              type="button"
              disabled={trangHopLe <= 1}
              aria-label={t('videoPage.pagination.previous')}
              onClick={() => setTrangHienTai((trang) => Math.max(1, trang - 1))}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{t('videoPage.pagination.page', { current: trangHopLe, total: tongSoTrang })}</span>
            <button
              type="button"
              disabled={trangHopLe >= tongSoTrang}
              aria-label={t('videoPage.pagination.next')}
              onClick={() => setTrangHienTai((trang) => Math.min(tongSoTrang, trang + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </nav>
        )}
      </section>

      {videoDoiTen && (
        <ModalNen title={t('videoPage.renameModal.title')} onClose={() => setVideoDoiTen(null)}>
          <div className="video-modal-body">
            <label>
              {t('videoPage.renameModal.label')}
              <input value={tenMoi} onChange={(event) => setTenMoi(event.target.value)} autoFocus />
            </label>
            <div className="video-modal-actions">
              <button type="button" className="ghost" onClick={() => setVideoDoiTen(null)}>
                {t('videoPage.renameModal.cancel')}
              </button>
              <button type="button" className="primary" onClick={luuDoiTen}>
                {t('videoPage.renameModal.save')}
              </button>
            </div>
          </div>
        </ModalNen>
      )}

      {videoXem && (
        <div className="video-drawer-overlay" role="presentation" onClick={() => setVideoXem(null)}>
          <aside
            className="video-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={videoXem.name}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="video-drawer-head">
              <h3>{videoXem.name}</h3>
              <button type="button" aria-label={t('videoPage.menu.play')} onClick={() => setVideoXem(null)}>
                <X size={18} />
              </button>
            </div>

            {videoXem.status === 'completed' && videoXem.fileUrl ? (
              <video className="video-drawer-player" src={videoXem.fileUrl} controls />
            ) : (
              <div className="video-drawer-preview">
                <Pause size={26} />
                <span className={`video-status-badge ${videoXem.status}`}>
                  {t(`videoPage.status.${videoXem.status}`)}
                </span>
              </div>
            )}

            <dl className="video-drawer-meta">
              <div><dt>{t('videoPage.columns.project')}</dt><dd>{tenProjectTheoId(videoXem.projectId) || t('videoPage.noProject')}</dd></div>
              <div><dt>{t('videoPage.drawer.duration')}</dt><dd>{dinhDangThoiLuong(videoXem.duration)}</dd></div>
              <div><dt>{t('videoPage.columns.resolution')}</dt><dd>{videoXem.resolution || '—'}</dd></div>
              <div><dt>{t('videoPage.drawer.fps')}</dt><dd>{videoXem.fps ? `${videoXem.fps} fps` : '—'}</dd></div>
              <div><dt>{t('videoPage.drawer.aspectRatio')}</dt><dd>{videoXem.aspectRatio || '—'}</dd></div>
              <div><dt>{t('videoPage.drawer.format')}</dt><dd>{videoXem.format || '—'}</dd></div>
              <div><dt>{t('videoPage.columns.size')}</dt><dd>{dinhDangDungLuong(videoXem.sizeBytes)}</dd></div>
              <div>
                <dt>{t('videoPage.drawer.createdDate')}</dt>
                <dd>{dinhDangNgay(videoXem.createdAt, locale, t('common.notUpdated'))}</dd>
              </div>
              <div>
                <dt>{t('videoPage.drawer.renderedDate')}</dt>
                <dd>{dinhDangNgay(videoXem.renderedAt, locale, '—')}</dd>
              </div>
            </dl>

            <div className="video-drawer-actions">
              <button
                type="button"
                disabled={videoXem.status !== 'completed' || dangTaiXuongId === videoXem.id}
                onClick={() => xuLyThaoTac('download', videoXem)}
              >
                <Download size={15} /> {t('videoPage.menu.download')}
              </button>
              <button
                type="button"
                disabled={videoXem.status !== 'completed'}
                onClick={() => xuLyThaoTac('share', videoXem)}
              >
                <Share2 size={15} /> {t('videoPage.menu.share')}
              </button>
              <button
                type="button"
                onClick={() => xuLyThaoTac('rename', videoXem)}
              >
                <PencilLine size={15} /> {t('videoPage.menu.rename')}
              </button>
              <button
                type="button"
                disabled={!videoXem.projectId}
                onClick={() => xuLyThaoTac('openProject', videoXem)}
              >
                <FolderOpen size={15} /> {t('videoPage.menu.openProject')}
              </button>
              <button type="button" className="danger" onClick={() => xuLyThaoTac('delete', videoXem)}>
                <Trash2 size={15} /> {t('videoPage.menu.delete')}
              </button>
            </div>
            {(loiTaiXuong || thongBaoChiaSe) && (
              <p className={`video-drawer-note ${loiTaiXuong ? 'error' : ''}`} role="status">
                {loiTaiXuong || thongBaoChiaSe}
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default TrangVideo;
