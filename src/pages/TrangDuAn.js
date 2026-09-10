import { useMemo, useState } from 'react';
import {
  Archive,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Copy,
  FileText,
  FolderKanban,
  Grid2X2,
  List as ListIcon,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash2,
  Video,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/du-an.css';

const SO_DU_AN_MOI_TRANG = 9;
const DANH_SACH_DU_AN_RONG = [];

const boLocDuAn = [
  { id: 'all', labelKey: 'projectsPage.filters.all' },
  { id: 'inProgress', labelKey: 'projectsPage.filters.inProgress' },
  { id: 'completed', labelKey: 'projectsPage.filters.completed' },
  { id: 'archived', labelKey: 'projectsPage.filters.archived' },
];

const thongKeDuAn = [
  { id: 'total', labelKey: 'projectsPage.stats.total', icon: FolderKanban, tone: 'purple' },
  { id: 'inProgress', labelKey: 'projectsPage.stats.inProgress', icon: Video, tone: 'blue' },
  { id: 'completed', labelKey: 'projectsPage.stats.completed', icon: CheckCircle2, tone: 'green' },
  { id: 'archived', labelKey: 'projectsPage.stats.archived', icon: Archive, tone: 'orange' },
];

const thaoTacDuAn = [
  { id: 'rename', labelKey: 'projectsPage.actions.rename', icon: PencilLine },
  { id: 'duplicate', labelKey: 'projectsPage.actions.duplicate', icon: Copy },
  { id: 'archive', labelKey: 'projectsPage.actions.archive', icon: Archive },
  { id: 'delete', labelKey: 'projectsPage.actions.delete', icon: Trash2, danger: true },
];

function dinhDangNgay(ngay, locale, fallback) {
  if (!ngay) return fallback;
  const giaTri = new Date(ngay);
  if (Number.isNaN(giaTri.getTime())) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(giaTri);
}

function TheDuAn({
  duAn,
  cheDoHienThi,
  menuDangMo,
  onToggleMenu,
  onOpen,
  onAction,
}) {
  const { locale, t } = useNgonNgu();
  const tienDo = Math.min(100, Math.max(0, Number(duAn.progress) || 0));
  const trangThai = duAn.status || 'inProgress';

  return (
    <article className={`project-item project-${cheDoHienThi}`}>
      <div className="project-cover">
        {duAn.coverUrl ? (
          <img src={duAn.coverUrl} alt={t('projectsPage.coverAlt', { name: duAn.name })} />
        ) : (
          <div className="project-cover-placeholder">
            <FolderKanban size={30} />
          </div>
        )}
        <span className={`project-status ${trangThai}`}>
          {t(`projectsPage.status.${trangThai}`)}
        </span>
      </div>

      <div className="project-content">
        <div className="project-title-row">
          <div>
            <h3>{duAn.name}</h3>
          </div>
          <div className="project-menu-anchor">
            <button
              className="project-menu-button"
              type="button"
              aria-label={t('projectsPage.menuLabel', { name: duAn.name })}
              aria-expanded={menuDangMo}
              onClick={onToggleMenu}
            >
              <MoreHorizontal size={19} />
            </button>
            {menuDangMo && (
              <div className="project-action-menu">
                {thaoTacDuAn.map(({ id, labelKey, icon: Icon, danger }) => (
                  <button
                    className={danger ? 'danger' : ''}
                    type="button"
                    key={id}
                    onClick={() => onAction(id)}
                  >
                    <Icon size={15} /> {t(labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="project-meta">
          <span><FileText size={14} /> {t('projectsPage.documentCount', { count: duAn.documentCount || 0 })}</span>
          <span><Video size={14} /> {t('projectsPage.videoCount', { count: duAn.videoCount || 0 })}</span>
        </div>

        <div className="project-progress">
          <div>
            <span>{t('projectsPage.progress')}</span>
            <strong>{tienDo}%</strong>
          </div>
          <div
            className="project-progress-track"
            role="progressbar"
            aria-label={t('projectsPage.progressLabel', { name: duAn.name })}
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={tienDo}
          >
            <span style={{ width: `${tienDo}%` }} />
          </div>
        </div>

        <div className="project-footer">
          <span>{t('projectsPage.updated', {
            date: dinhDangNgay(duAn.updatedAt, locale, t('common.notUpdated')),
          })}</span>
          <button type="button" onClick={onOpen}>
            {t('projectsPage.openProject')} <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </article>
  );
}

function TrangDuAn({
  user,
  projects,
  onLogin,
  onCreateProject,
  onOpenProject,
  onProjectAction,
  loading = false,
  error = '',
  onRetry,
}) {
  const { language, t } = useNgonNgu();
  const [tuKhoa, setTuKhoa] = useState('');
  const [boLoc, setBoLoc] = useState('all');
  const [cheDoHienThi, setCheDoHienThi] = useState('card');
  const [sapXep, setSapXep] = useState('updatedDesc');
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [menuDangMo, setMenuDangMo] = useState(null);

  const danhSachDuAn = Array.isArray(projects) ? projects : DANH_SACH_DU_AN_RONG;
  const thongKe = useMemo(() => ({
    total: danhSachDuAn.length,
    inProgress: danhSachDuAn.filter((duAn) => duAn.status === 'inProgress').length,
    completed: danhSachDuAn.filter((duAn) => duAn.status === 'completed').length,
    archived: danhSachDuAn.filter((duAn) => duAn.status === 'archived').length,
  }), [danhSachDuAn]);

  const duAnDaLoc = useMemo(() => {
    const timKiem = tuKhoa.trim().toLocaleLowerCase(language);
    const ketQua = danhSachDuAn.filter((duAn) => {
      const dungBoLoc = boLoc === 'all' || duAn.status === boLoc;
      const noiDung = `${duAn.name || ''} ${duAn.description || ''}`.toLocaleLowerCase(language);
      return dungBoLoc && (!timKiem || noiDung.includes(timKiem));
    });

    const sapXepBang = {
      updatedDesc: (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      createdDesc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      nameAsc: (a, b) => a.name.localeCompare(b.name, language),
      nameDesc: (a, b) => b.name.localeCompare(a.name, language),
    };
    return [...ketQua].sort(sapXepBang[sapXep] || sapXepBang.updatedDesc);
  }, [boLoc, danhSachDuAn, language, sapXep, tuKhoa]);

  const tongSoTrang = Math.max(1, Math.ceil(duAnDaLoc.length / SO_DU_AN_MOI_TRANG));
  const trangHopLe = Math.min(trangHienTai, tongSoTrang);
  const duAnTrongTrang = duAnDaLoc.slice(
    (trangHopLe - 1) * SO_DU_AN_MOI_TRANG,
    trangHopLe * SO_DU_AN_MOI_TRANG,
  );

  const taoProjectMoi = () => {
    if (!user) {
      onLogin?.();
      return;
    }
    onCreateProject?.();
  };

  const capNhatBoLoc = (boLocMoi) => {
    setBoLoc(boLocMoi);
    setTrangHienTai(1);
    setMenuDangMo(null);
  };

  return (
    <main className="projects-page">
      <section className="projects-hero">
        <div>
          <span className="projects-eyebrow"><FolderKanban size={15} /> {t('projectsPage.eyebrow')}</span>
          <h1>{t('projectsPage.title')}</h1>
          <p>{t('projectsPage.description')}</p>
        </div>
        <div className="projects-hero-mark" aria-hidden="true">
          <FolderKanban size={35} />
        </div>
      </section>

      <section className="projects-toolbar" aria-label={t('projectsPage.toolbarLabel')}>
        <label className="projects-search">
          <Search size={18} />
          <input
            value={tuKhoa}
            onChange={(event) => {
              setTuKhoa(event.target.value);
              setTrangHienTai(1);
            }}
            placeholder={t('projectsPage.searchPlaceholder')}
            aria-label={t('projectsPage.searchLabel')}
          />
        </label>

        <div className="projects-filters" role="group" aria-label={t('projectsPage.filters.label')}>
          {boLocDuAn.map(({ id, labelKey }) => (
            <button
              type="button"
              className={boLoc === id ? 'active' : ''}
              aria-pressed={boLoc === id}
              key={id}
              onClick={() => capNhatBoLoc(id)}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <select
          className="projects-sort"
          value={sapXep}
          aria-label={t('projectsPage.sort.label')}
          onChange={(event) => setSapXep(event.target.value)}
        >
          <option value="updatedDesc">{t('projectsPage.sort.updatedDesc')}</option>
          <option value="createdDesc">{t('projectsPage.sort.createdDesc')}</option>
          <option value="nameAsc">{t('projectsPage.sort.nameAsc')}</option>
          <option value="nameDesc">{t('projectsPage.sort.nameDesc')}</option>
        </select>

        <button className="new-project-button" type="button" onClick={taoProjectMoi}>
          <Plus size={18} /> {t('projectsPage.newProject')}
        </button>
      </section>

      <section className="projects-stats" aria-label={t('projectsPage.stats.label')}>
        {thongKeDuAn.map(({ id, labelKey, icon: Icon, tone }) => (
          <article className="project-stat-card" key={id}>
            <span className={tone}><Icon size={20} /></span>
            <div><strong>{thongKe[id]}</strong><small>{t(labelKey)}</small></div>
          </article>
        ))}
      </section>

      <section className="projects-list-panel">
        <div className="projects-list-heading">
          <div>
            <h2>{t('projectsPage.listTitle')}</h2>
            <p>{t('projectsPage.resultCount', { count: duAnDaLoc.length })}</p>
          </div>
          <div className="projects-view-toggle" role="group" aria-label={t('projectsPage.view.label')}>
            <button
              type="button"
              className={cheDoHienThi === 'card' ? 'active' : ''}
              aria-label={t('projectsPage.view.card')}
              aria-pressed={cheDoHienThi === 'card'}
              onClick={() => setCheDoHienThi('card')}
            >
              <Grid2X2 size={17} />
            </button>
            <button
              type="button"
              className={cheDoHienThi === 'list' ? 'active' : ''}
              aria-label={t('projectsPage.view.list')}
              aria-pressed={cheDoHienThi === 'list'}
              onClick={() => setCheDoHienThi('list')}
            >
              <ListIcon size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="projects-skeleton-grid" aria-live="polite" aria-label={t('projectsPage.loading')}>
            {Array.from({ length: 6 }).map((_, chiSo) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="projects-skeleton-card" key={chiSo} aria-hidden="true">
                <div className="skeleton skeleton-thumb" />
                <div className="projects-skeleton-card-body">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '85%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '55%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="projects-state error" role="alert">
            <span><CircleAlert size={25} /></span>
            <h3>{t('projectsPage.loadErrorTitle')}</h3>
            <p>{error}</p>
            <button type="button" onClick={onRetry}>{t('projectsPage.retry')}</button>
          </div>
        ) : duAnTrongTrang.length > 0 ? (
          <div className={`projects-collection ${cheDoHienThi}`}>
            {duAnTrongTrang.map((duAn) => (
              <TheDuAn
                duAn={duAn}
                cheDoHienThi={cheDoHienThi}
                menuDangMo={menuDangMo === duAn.id}
                key={duAn.id}
                onToggleMenu={() => setMenuDangMo((hienTai) => (
                  hienTai === duAn.id ? null : duAn.id
                ))}
                onOpen={() => onOpenProject?.(duAn.id)}
                onAction={(thaoTac) => {
                  setMenuDangMo(null);
                  onProjectAction?.(thaoTac, duAn.id);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="projects-empty">
            <span><FolderKanban size={32} /></span>
            <h3>{t(tuKhoa || boLoc !== 'all'
              ? 'projectsPage.emptyFilteredTitle'
              : 'projectsPage.emptyTitle')}</h3>
            <p>{t(tuKhoa || boLoc !== 'all'
              ? 'projectsPage.emptyFilteredDescription'
              : 'projectsPage.emptyDescription')}</p>
            {!tuKhoa && boLoc === 'all' && (
              <button type="button" onClick={taoProjectMoi}>
                <Plus size={17} /> {t('projectsPage.newProject')}
              </button>
            )}
          </div>
        )}

        {!loading && !error && (
        <nav className="projects-pagination" aria-label={t('projectsPage.pagination.label')}>
          <button
            type="button"
            disabled={trangHopLe <= 1}
            aria-label={t('projectsPage.pagination.previous')}
            onClick={() => setTrangHienTai((trang) => Math.max(1, trang - 1))}
          >
            <ChevronLeft size={17} />
          </button>
          <span>{t('projectsPage.pagination.page', { current: trangHopLe, total: tongSoTrang })}</span>
          <button
            type="button"
            disabled={trangHopLe >= tongSoTrang}
            aria-label={t('projectsPage.pagination.next')}
            onClick={() => setTrangHienTai((trang) => Math.min(tongSoTrang, trang + 1))}
          >
            <ChevronRight size={17} />
          </button>
        </nav>
        )}
      </section>
    </main>
  );
}

export default TrangDuAn;
