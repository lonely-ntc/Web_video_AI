import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Download,
  Eye,
  FolderOpen,
  History as HistoryIcon,
  Loader2,
  LoaderCircle,
  MoreHorizontal,
  Play,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Video,
  X,
  XCircle,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/lich-su.css';

const SO_TAC_VU_MOI_TRANG = 8;

const LOAI_TAC_VU = [
  { id: 'video', labelKey: 'historyPage.taskType.video' },
  { id: 'docAnalysis', labelKey: 'historyPage.taskType.docAnalysis' },
  { id: 'outline', labelKey: 'historyPage.taskType.outline' },
  { id: 'script', labelKey: 'historyPage.taskType.script' },
  { id: 'image', labelKey: 'historyPage.taskType.image' },
  { id: 'voice', labelKey: 'historyPage.taskType.voice' },
  { id: 'avatarVideo', labelKey: 'historyPage.taskType.avatarVideo' },
  { id: 'render', labelKey: 'historyPage.taskType.render' },
  { id: 'saveResult', labelKey: 'historyPage.taskType.saveResult' },
];

const TRANG_THAI_TAC_VU = [
  { id: 'pending', labelKey: 'historyPage.status.pending', icon: Clock3 },
  { id: 'processing', labelKey: 'historyPage.status.processing', icon: Loader2 },
  { id: 'completed', labelKey: 'historyPage.status.completed', icon: CheckCircle2 },
  { id: 'failed', labelKey: 'historyPage.status.failed', icon: XCircle },
  { id: 'cancelled', labelKey: 'historyPage.status.cancelled', icon: Ban },
];

const KHOANG_THOI_GIAN = [
  { id: 'all', labelKey: 'historyPage.dateRange.all' },
  { id: 'today', labelKey: 'historyPage.dateRange.today' },
  { id: '7days', labelKey: 'historyPage.dateRange.last7Days' },
  { id: '30days', labelKey: 'historyPage.dateRange.last30Days' },
];

const TUY_CHON_SAP_XEP = [
  { id: 'newest', labelKey: 'historyPage.sort.newest' },
  { id: 'oldest', labelKey: 'historyPage.sort.oldest' },
  { id: 'durationDesc', labelKey: 'historyPage.sort.durationDesc' },
  { id: 'nameAsc', labelKey: 'historyPage.sort.nameAsc' },
];

const TRANG_THAI_ICON_MAP = TRANG_THAI_TAC_VU.reduce((banDo, item) => {
  banDo[item.id] = item.icon;
  return banDo;
}, {});

function dinhDangNgayGio(ngay, locale, fallback) {
  if (!ngay) return fallback;
  const giaTri = new Date(ngay);
  if (Number.isNaN(giaTri.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(giaTri);
}

function dinhDangThoiLuongGiay(giay) {
  if (!giay || giay <= 0) return '—';
  const phut = Math.floor(giay / 60);
  const giayConLai = Math.round(giay % 60);
  if (phut <= 0) return `${giayConLai}s`;
  return `${phut} phút ${giayConLai} giây`;
}

function tinhThoiLuong(batDau, ketThuc) {
  if (!batDau || !ketThuc) return 0;
  return Math.max(0, (new Date(ketThuc) - new Date(batDau)) / 1000);
}

function trongKhoangThoiGian(ngay, khoang) {
  if (khoang === 'all') return true;
  if (!ngay) return false;
  const giaTri = new Date(ngay);
  const bayGio = new Date();
  const soNgay = { today: 1, '7days': 7, '30days': 30 }[khoang] || 0;
  const nguong = new Date(bayGio);
  nguong.setDate(nguong.getDate() - soNgay);
  return giaTri >= nguong;
}

function TrangThaiBadge({ status }) {
  const { t } = useNgonNgu();
  const Icon = TRANG_THAI_ICON_MAP[status] || Clock3;
  return (
    <span className={`history-status ${status}`}>
      <Icon size={12} className={status === 'processing' ? 'spin' : ''} />
      {t(`historyPage.status.${status}`)}
    </span>
  );
}

function TrangLichSu({
  projects = [],
  tasks = [],
  loading = false,
  error = '',
  onRetry,
  onOpenProject,
  onOpenVideo,
  onCancelTask,
  onRetryTask,
  onDeleteTask,
}) {
  const { locale, t } = useNgonNgu();

  const [tuKhoa, setTuKhoa] = useState('');
  const [locProject, setLocProject] = useState('all');
  const [locLoai, setLocLoai] = useState('all');
  const [locTrangThai, setLocTrangThai] = useState('all');
  const [locThoiGian, setLocThoiGian] = useState('all');
  const [sapXep, setSapXep] = useState('newest');
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [menuDangMo, setMenuDangMo] = useState(null);
  const [tacVuXem, setTacVuXem] = useState(null);

  const danhSachTacVu = useMemo(() => (Array.isArray(tasks) ? tasks : []), [tasks]);
  const danhSachProject = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects],
  );

  const tenProjectTheoId = useMemo(() => {
    const banDo = new Map(danhSachProject.map((duAn) => [duAn.id, duAn.name]));
    return (projectId) => banDo.get(projectId) || '';
  }, [danhSachProject]);

  const thongKe = useMemo(() => {
    const hoanThanh = danhSachTacVu.filter((tv) => tv.status === 'completed');
    const tongThoiGian = hoanThanh.reduce(
      (tong, tv) => tong + tinhThoiLuong(tv.startedAt, tv.finishedAt),
      0,
    );
    return {
      total: danhSachTacVu.length,
      processing: danhSachTacVu.filter((tv) => tv.status === 'processing' || tv.status === 'pending').length,
      completed: hoanThanh.length,
      failed: danhSachTacVu.filter((tv) => tv.status === 'failed').length,
      avgDuration: hoanThanh.length ? tongThoiGian / hoanThanh.length : 0,
    };
  }, [danhSachTacVu]);

  const tacVuDaLoc = useMemo(() => {
    const timKiem = tuKhoa.trim().toLocaleLowerCase(locale);
    const ketQua = danhSachTacVu.filter((tacVu) => {
      const dungProject = locProject === 'all' || tacVu.projectId === locProject;
      const dungLoai = locLoai === 'all' || tacVu.type === locLoai;
      const dungTrangThai = locTrangThai === 'all' || tacVu.status === locTrangThai;
      const dungThoiGian = trongKhoangThoiGian(tacVu.startedAt, locThoiGian);
      const noiDung = `${tacVu.name} ${tenProjectTheoId(tacVu.projectId)} ${tacVu.code}`.toLocaleLowerCase(locale);
      return dungProject && dungLoai && dungTrangThai && dungThoiGian && (!timKiem || noiDung.includes(timKiem));
    });

    const sapXepBang = {
      newest: (a, b) => new Date(b.startedAt) - new Date(a.startedAt),
      oldest: (a, b) => new Date(a.startedAt) - new Date(b.startedAt),
      durationDesc: (a, b) => tinhThoiLuong(b.startedAt, b.finishedAt) - tinhThoiLuong(a.startedAt, a.finishedAt),
      nameAsc: (a, b) => a.name.localeCompare(b.name, locale),
    };
    return [...ketQua].sort(sapXepBang[sapXep] || sapXepBang.newest);
  }, [danhSachTacVu, locLoai, locProject, locThoiGian, locTrangThai, locale, sapXep, tenProjectTheoId, tuKhoa]);

  const coBoLoc = Boolean(tuKhoa) || locProject !== 'all' || locLoai !== 'all'
    || locTrangThai !== 'all' || locThoiGian !== 'all';
  const tongSoTrang = Math.max(1, Math.ceil(tacVuDaLoc.length / SO_TAC_VU_MOI_TRANG));
  const trangHopLe = Math.min(trangHienTai, tongSoTrang);
  const tacVuTrongTrang = tacVuDaLoc.slice(
    (trangHopLe - 1) * SO_TAC_VU_MOI_TRANG,
    trangHopLe * SO_TAC_VU_MOI_TRANG,
  );

  const lamMoi = async () => {
    setDangLamMoi(true);
    await onRetry?.();
    setDangLamMoi(false);
  };

  const dsHanhDong = (tacVu) => {
    const danhSach = [{ id: 'view', labelKey: 'historyPage.actions.view', icon: Eye }];
    if (tacVu.projectId) danhSach.push({ id: 'openProject', labelKey: 'historyPage.actions.openProject', icon: FolderOpen });
    if (tacVu.status === 'completed' && tacVu.hasVideo) {
      danhSach.push({ id: 'openVideo', labelKey: 'historyPage.actions.openVideo', icon: Video });
    }
    if (tacVu.status === 'failed') danhSach.push({ id: 'retry', labelKey: 'historyPage.actions.retry', icon: RotateCcw });
    if (tacVu.status === 'pending' || tacVu.status === 'processing') {
      danhSach.push({ id: 'cancel', labelKey: 'historyPage.actions.cancel', icon: Ban });
    }
    danhSach.push({ id: 'delete', labelKey: 'historyPage.actions.delete', icon: Trash2, danger: true });
    return danhSach;
  };

  const xuLyHanhDong = (hanhDong, tacVu) => {
    setMenuDangMo(null);
    if (hanhDong === 'view') {
      setTacVuXem(tacVu);
    } else if (hanhDong === 'openProject') {
      if (tacVu.projectId) onOpenProject?.(tacVu.projectId);
    } else if (hanhDong === 'openVideo') {
      onOpenVideo?.(tacVu.videoId);
    } else if (hanhDong === 'retry') {
      onRetryTask?.(tacVu.id);
    } else if (hanhDong === 'cancel') {
      onCancelTask?.(tacVu.id);
    } else if (hanhDong === 'delete') {
      onDeleteTask?.(tacVu.id);
      if (tacVuXem?.id === tacVu.id) setTacVuXem(null);
    }
  };

  return (
    <main className="history-page">
      <section className="history-hero">
        <div>
          <span className="history-eyebrow"><HistoryIcon size={15} /> {t('historyPage.eyebrow')}</span>
          <h1>{t('historyPage.title')}</h1>
          <p>{t('historyPage.description')}</p>
        </div>
        <div className="history-hero-actions">
          <button type="button" className="history-refresh" onClick={lamMoi}>
            <RefreshCw size={16} className={dangLamMoi ? 'spin' : ''} /> {t('historyPage.refresh')}
          </button>
          <button
            type="button"
            className="history-export"
            onClick={() => {
              const lienKet = document.createElement('a');
              lienKet.href = `data:application/json,${encodeURIComponent(JSON.stringify(tacVuDaLoc, null, 2))}`;
              lienKet.download = 'lich-su-tac-vu.json';
              lienKet.click();
            }}
          >
            <Download size={16} /> {t('historyPage.exportLog')}
          </button>
        </div>
      </section>

      <section className="history-stats" aria-label={t('historyPage.stats.label')}>
        <article className="history-stat-card">
          <span className="tone-purple"><HistoryIcon size={19} /></span>
          <div><strong>{thongKe.total}</strong><small>{t('historyPage.stats.total')}</small></div>
        </article>
        <article className="history-stat-card">
          <span className="tone-blue"><Loader2 size={19} /></span>
          <div><strong>{thongKe.processing}</strong><small>{t('historyPage.stats.processing')}</small></div>
        </article>
        <article className="history-stat-card">
          <span className="tone-green"><CheckCircle2 size={19} /></span>
          <div><strong>{thongKe.completed}</strong><small>{t('historyPage.stats.completed')}</small></div>
        </article>
        <article className="history-stat-card">
          <span className="tone-red"><XCircle size={19} /></span>
          <div><strong>{thongKe.failed}</strong><small>{t('historyPage.stats.failed')}</small></div>
        </article>
        <article className="history-stat-card">
          <span className="tone-orange"><Clock3 size={19} /></span>
          <div><strong>{dinhDangThoiLuongGiay(thongKe.avgDuration)}</strong><small>{t('historyPage.stats.avgDuration')}</small></div>
        </article>
      </section>

      <section className="history-toolbar" aria-label={t('historyPage.toolbarLabel')}>
        <label className="history-search">
          <Search size={17} />
          <input
            value={tuKhoa}
            onChange={(event) => { setTuKhoa(event.target.value); setTrangHienTai(1); }}
            placeholder={t('historyPage.searchPlaceholder')}
            aria-label={t('historyPage.searchLabel')}
          />
        </label>

        <select
          className="history-select"
          value={locProject}
          aria-label={t('historyPage.filters.project')}
          onChange={(event) => { setLocProject(event.target.value); setTrangHienTai(1); }}
        >
          <option value="all">{t('historyPage.filters.allProjects')}</option>
          {danhSachProject.map((duAn) => (
            <option value={duAn.id} key={duAn.id}>{duAn.name}</option>
          ))}
        </select>

        <select
          className="history-select"
          value={locLoai}
          aria-label={t('historyPage.filters.taskType')}
          onChange={(event) => { setLocLoai(event.target.value); setTrangHienTai(1); }}
        >
          <option value="all">{t('historyPage.filters.allTypes')}</option>
          {LOAI_TAC_VU.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <select
          className="history-select"
          value={locTrangThai}
          aria-label={t('historyPage.filters.status')}
          onChange={(event) => { setLocTrangThai(event.target.value); setTrangHienTai(1); }}
        >
          <option value="all">{t('historyPage.filters.allStatuses')}</option>
          {TRANG_THAI_TAC_VU.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <select
          className="history-select"
          value={locThoiGian}
          aria-label={t('historyPage.filters.dateRange')}
          onChange={(event) => { setLocThoiGian(event.target.value); setTrangHienTai(1); }}
        >
          {KHOANG_THOI_GIAN.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <select
          className="history-select"
          value={sapXep}
          aria-label={t('historyPage.sort.label')}
          onChange={(event) => setSapXep(event.target.value)}
        >
          {TUY_CHON_SAP_XEP.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>
      </section>

      <section className="history-list-panel">
        <div className="history-list-heading">
          <h2>{t('historyPage.listTitle')}</h2>
          <p>{t('historyPage.resultCount', { count: tacVuDaLoc.length })}</p>
        </div>

        {loading ? (
          <div className="history-empty">
            <LoaderCircle className="history-empty-spinner" size={27} />
            <h3>{t('historyPage.loading')}</h3>
          </div>
        ) : error ? (
          <div className="history-empty" role="alert">
            <span className="tone-red"><CircleAlert size={25} /></span>
            <h3>{t('historyPage.loadErrorTitle')}</h3>
            <p>{error}</p>
            <button type="button" className="history-empty-retry" onClick={onRetry}>{t('historyPage.retry')}</button>
          </div>
        ) : tacVuTrongTrang.length > 0 ? (
          <div className="history-table" role="table">
            <div className="history-row history-row-head" role="row">
              <span>{t('historyPage.columns.name')}</span>
              <span>{t('historyPage.columns.project')}</span>
              <span>{t('historyPage.columns.type')}</span>
              <span>{t('historyPage.columns.started')}</span>
              <span>{t('historyPage.columns.finished')}</span>
              <span>{t('historyPage.columns.duration')}</span>
              <span>{t('historyPage.columns.progress')}</span>
              <span>{t('historyPage.columns.status')}</span>
              <span />
            </div>

            {tacVuTrongTrang.map((tacVu) => (
              <div
                className="history-row"
                role="row"
                key={tacVu.id}
                onClick={() => setTacVuXem(tacVu)}
              >
                <span role="cell" className="history-cell-name">
                  {tacVu.name}
                  <small>{tacVu.code}</small>
                </span>
                <span role="cell" className="history-cell-muted">{tenProjectTheoId(tacVu.projectId) || t('historyPage.noProject')}</span>
                <span role="cell" className="history-cell-muted">{t(`historyPage.taskType.${tacVu.type}`)}</span>
                <span role="cell" className="history-cell-muted">{dinhDangNgayGio(tacVu.startedAt, locale, '—')}</span>
                <span role="cell" className="history-cell-muted">{dinhDangNgayGio(tacVu.finishedAt, locale, '—')}</span>
                <span role="cell" className="history-cell-muted">
                  {dinhDangThoiLuongGiay(tinhThoiLuong(tacVu.startedAt, tacVu.finishedAt))}
                </span>
                <span role="cell">
                  <div className="history-progress-track">
                    <span style={{ width: `${tacVu.progress}%` }} className={tacVu.status} />
                  </div>
                  <small>{tacVu.progress}%</small>
                </span>
                <span role="cell"><TrangThaiBadge status={tacVu.status} /></span>
                <span role="cell" className="history-menu-anchor" onClick={(event) => event.stopPropagation()}>
                  <button
                    type="button"
                    className="history-menu-button"
                    aria-label={t('historyPage.menuLabel', { name: tacVu.name })}
                    aria-expanded={menuDangMo === tacVu.id}
                    onClick={() => setMenuDangMo((hienTai) => (hienTai === tacVu.id ? null : tacVu.id))}
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {menuDangMo === tacVu.id && (
                    <div className="history-action-menu">
                      {dsHanhDong(tacVu).map(({ id, labelKey, icon: Icon, danger }) => (
                        <button
                          type="button"
                          key={id}
                          className={danger ? 'danger' : ''}
                          onClick={() => xuLyHanhDong(id, tacVu)}
                        >
                          <Icon size={15} /> {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  )}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="history-empty">
            <span><HistoryIcon size={32} /></span>
            <h3>{t(coBoLoc ? 'historyPage.emptyFilteredTitle' : 'historyPage.emptyTitle')}</h3>
            <p>{t(coBoLoc ? 'historyPage.emptyFilteredDescription' : 'historyPage.emptyDescription')}</p>
          </div>
        )}

        {!loading && !error && tacVuDaLoc.length > 0 && (
          <nav className="history-pagination" aria-label={t('historyPage.pagination.label')}>
            <button
              type="button"
              disabled={trangHopLe <= 1}
              aria-label={t('historyPage.pagination.previous')}
              onClick={() => setTrangHienTai((trang) => Math.max(1, trang - 1))}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{t('historyPage.pagination.page', { current: trangHopLe, total: tongSoTrang })}</span>
            <button
              type="button"
              disabled={trangHopLe >= tongSoTrang}
              aria-label={t('historyPage.pagination.next')}
              onClick={() => setTrangHienTai((trang) => Math.min(tongSoTrang, trang + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </nav>
        )}
      </section>

      {tacVuXem && (
        <div className="history-drawer-overlay" role="presentation" onClick={() => setTacVuXem(null)}>
          <aside
            className="history-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={tacVuXem.name}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="history-drawer-head">
              <h3>{tacVuXem.name}</h3>
              <button type="button" aria-label={t('historyPage.actions.view')} onClick={() => setTacVuXem(null)}>
                <X size={18} />
              </button>
            </div>

            <dl className="history-drawer-meta">
              <div><dt>{t('historyPage.drawer.code')}</dt><dd>{tacVuXem.code}</dd></div>
              <div><dt>{t('historyPage.columns.project')}</dt><dd>{tenProjectTheoId(tacVuXem.projectId) || t('historyPage.noProject')}</dd></div>
              <div><dt>{t('historyPage.drawer.startedDate')}</dt><dd>{dinhDangNgayGio(tacVuXem.startedAt, locale, '—')}</dd></div>
              <div><dt>{t('historyPage.drawer.finishedDate')}</dt><dd>{dinhDangNgayGio(tacVuXem.finishedAt, locale, '—')}</dd></div>
              <div>
                <dt>{t('historyPage.drawer.totalDuration')}</dt>
                <dd>{dinhDangThoiLuongGiay(tinhThoiLuong(tacVuXem.startedAt, tacVuXem.finishedAt))}</dd>
              </div>
              <div><dt>{t('historyPage.columns.status')}</dt><dd><TrangThaiBadge status={tacVuXem.status} /></dd></div>
            </dl>

            <div className="history-drawer-section">
              <h4>{t('historyPage.drawer.pipelineTitle')}</h4>
              {tacVuXem.pipeline?.length > 0 ? (
                <ol className="history-timeline">
                  {tacVuXem.pipeline.map((buoc) => (
                    <li className={`history-timeline-step ${buoc.status}`} key={buoc.id}>
                      <span className="history-timeline-marker" />
                      <div className="history-timeline-body">
                        <div className="history-timeline-row">
                          <strong>{buoc.id} {buoc.name}</strong>
                          <TrangThaiBadge status={buoc.status === 'notRun' ? 'pending' : buoc.status} />
                        </div>
                        {buoc.status !== 'notRun' && (
                          <div className="history-timeline-times">
                            <span>{dinhDangNgayGio(buoc.startedAt, locale, '—')}</span>
                            {buoc.finishedAt && <span>→ {dinhDangNgayGio(buoc.finishedAt, locale, '—')}</span>}
                            {buoc.durationSeconds > 0 && <span>({dinhDangThoiLuongGiay(buoc.durationSeconds)})</span>}
                          </div>
                        )}
                        {buoc.message && <p className="history-timeline-message">{buoc.message}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="history-timeline-empty">{t('historyPage.drawer.noSteps')}</p>
              )}
            </div>

            {tacVuXem.error && (
              <div className="history-drawer-section history-error-section">
                <h4><AlertTriangle size={14} /> {t('historyPage.drawer.errorTitle')}</h4>
                <dl className="history-drawer-meta">
                  <div><dt>{t('historyPage.error.code')}</dt><dd>{tacVuXem.error.code}</dd></div>
                  <div><dt>{t('historyPage.error.type')}</dt><dd>{tacVuXem.error.type}</dd></div>
                  <div><dt>{t('historyPage.error.workflow')}</dt><dd>{tacVuXem.error.workflow}</dd></div>
                  <div><dt>{t('historyPage.error.node')}</dt><dd>{tacVuXem.error.node}</dd></div>
                  <div><dt>{t('historyPage.error.time')}</dt><dd>{dinhDangNgayGio(tacVuXem.error.occurredAt, locale, '—')}</dd></div>
                </dl>
                <p className="history-error-message">{tacVuXem.error.message}</p>
                {tacVuXem.error.detail && <pre className="history-error-detail">{tacVuXem.error.detail}</pre>}
                <div className="history-error-actions">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(tacVuXem.error, null, 2))}
                  >
                    <Copy size={14} /> {t('historyPage.error.copy')}
                  </button>
                  <button type="button" onClick={() => xuLyHanhDong('retry', tacVuXem)}>
                    <RotateCcw size={14} /> {t('historyPage.error.retryFromStep')}
                  </button>
                  {tacVuXem.projectId && (
                    <button type="button" onClick={() => onOpenProject?.(tacVuXem.projectId)}>
                      <FolderOpen size={14} /> {t('historyPage.actions.openProject')}
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="history-drawer-actions">
              {tacVuXem.projectId && (
                <button type="button" onClick={() => xuLyHanhDong('openProject', tacVuXem)}>
                  <FolderOpen size={15} /> {t('historyPage.actions.openProject')}
                </button>
              )}
              {tacVuXem.status === 'completed' && tacVuXem.hasVideo && (
                <button type="button" onClick={() => xuLyHanhDong('openVideo', tacVuXem)}>
                  <Play size={15} /> {t('historyPage.actions.openVideo')}
                </button>
              )}
              {tacVuXem.status === 'failed' && (
                <button type="button" onClick={() => xuLyHanhDong('retry', tacVuXem)}>
                  <RotateCcw size={15} /> {t('historyPage.actions.retry')}
                </button>
              )}
              {(tacVuXem.status === 'pending' || tacVuXem.status === 'processing') && (
                <button type="button" onClick={() => xuLyHanhDong('cancel', tacVuXem)}>
                  <Ban size={15} /> {t('historyPage.actions.cancel')}
                </button>
              )}
              <button type="button" className="danger" onClick={() => xuLyHanhDong('delete', tacVuXem)}>
                <Trash2 size={15} /> {t('historyPage.actions.delete')}
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

export default TrangLichSu;
