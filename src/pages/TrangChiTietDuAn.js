import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  CircleAlert,
  FileText,
  FolderKanban,
  Globe2,
  LayoutGrid,
  Layers3,
  LoaderCircle,
  MonitorPlay,
  Plus,
  Settings2,
  Trash2,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/chi-tiet-du-an.css';

const ngonNguDuAn = [
  { id: 'vi', labelKey: 'createProjectPage.languages.vietnamese' },
  { id: 'en', labelKey: 'createProjectPage.languages.english' },
];

const templateVideo = [
  { id: 'basic', labelKey: 'createProjectPage.templates.basic' },
  { id: 'presentation', labelKey: 'createProjectPage.templates.presentation' },
  { id: 'social', labelKey: 'createProjectPage.templates.social' },
  { id: 'training', labelKey: 'createProjectPage.templates.training' },
];

const khoaDanhMuc = {
  education: 'createProjectPage.categories.education',
  technology: 'createProjectPage.categories.technology',
  marketing: 'createProjectPage.categories.marketing',
  business: 'createProjectPage.categories.business',
  other: 'createProjectPage.categories.other',
};

const khoaNgonNgu = {
  vi: 'createProjectPage.languages.vietnamese',
  en: 'createProjectPage.languages.english',
};

const khoaTemplate = {
  basic: 'createProjectPage.templates.basic',
  presentation: 'createProjectPage.templates.presentation',
  social: 'createProjectPage.templates.social',
  training: 'createProjectPage.templates.training',
};

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

const CAC_MOC_THOI_GIAN = [
  { gioiHan: 60, chia: 1, khoaDonVi: 'projectDetailPage.timeAgo.secondsUnit' },
  { gioiHan: 3600, chia: 60, khoaDonVi: 'projectDetailPage.timeAgo.minutesUnit' },
  { gioiHan: 86400, chia: 3600, khoaDonVi: 'projectDetailPage.timeAgo.hoursUnit' },
  { gioiHan: 2592000, chia: 86400, khoaDonVi: 'projectDetailPage.timeAgo.daysUnit' },
  { gioiHan: 31536000, chia: 2592000, khoaDonVi: 'projectDetailPage.timeAgo.monthsUnit' },
  { gioiHan: Infinity, chia: 31536000, khoaDonVi: 'projectDetailPage.timeAgo.yearsUnit' },
];

function dinhDangThoiGianTruoc(ngay, t, fallback) {
  if (!ngay) return fallback;
  const giaTri = new Date(ngay);
  if (Number.isNaN(giaTri.getTime())) return fallback;

  const giaySau = Math.max(0, Math.floor((Date.now() - giaTri.getTime()) / 1000));
  if (giaySau < 30) return t('projectDetailPage.timeAgo.justNow');

  const moc = CAC_MOC_THOI_GIAN.find((item) => giaySau < item.gioiHan) || CAC_MOC_THOI_GIAN.at(-1);
  const soLuong = Math.max(1, Math.floor(giaySau / moc.chia));
  return t('projectDetailPage.timeAgo.pattern', { count: soLuong, unit: t(moc.khoaDonVi) });
}

function useNhipDongHo(khoangCachMs) {
  const [, ep] = useState(0);
  useEffect(() => {
    const boDem = setInterval(() => ep((giaTri) => giaTri + 1), khoangCachMs);
    return () => clearInterval(boDem);
  }, [khoangCachMs]);
}

function taoDuLieuChinhSua(project) {
  return {
    name: project.name || '',
    description: project.description || '',
    language: project.defaultLanguage || 'vi',
    template: project.template || 'basic',
    defaultSettingsEnabled: Boolean(project.defaultSettingsEnabled),
    defaultAvatar: project.defaultAvatar || '',
    defaultVoice: project.defaultVoice || '',
    aspectRatio: project.aspectRatio || '16:9',
    resolution: project.resolution || '1080p',
  };
}

function ModalChinhSua({ project, dangLuu, loiLuu, onClose, onSave }) {
  const { t } = useNgonNgu();
  const [duLieu, setDuLieu] = useState(() => taoDuLieuChinhSua(project));

  const capNhatTruong = (tenTruong) => (event) => {
    setDuLieu((hienTai) => ({ ...hienTai, [tenTruong]: event.target.value }));
  };

  const xuLyLuu = async (event) => {
    event.preventDefault();
    if (!duLieu.name.trim()) return;
    const { error } = await onSave(duLieu) || {};
    if (!error) onClose();
  };

  return (
    <div className="project-edit-overlay" role="presentation" onClick={onClose}>
      <form
        className="project-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('projectDetailPage.editModal.title')}
        onClick={(event) => event.stopPropagation()}
        onSubmit={xuLyLuu}
      >
        <div className="project-edit-head">
          <h3>{t('projectDetailPage.editModal.title')}</h3>
          <button type="button" aria-label={t('projectDetailPage.editModal.title')} onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="project-edit-body">
          <label className="project-edit-field full">
            <span>{t('createProjectPage.basic.name')} <b>*</b></span>
            <input value={duLieu.name} onChange={capNhatTruong('name')} maxLength="100" autoFocus required />
          </label>

          <label className="project-edit-field full">
            <span>{t('createProjectPage.basic.projectDescription')}</span>
            <textarea value={duLieu.description} onChange={capNhatTruong('description')} maxLength="300" rows="3" />
          </label>

          <label className="project-edit-field">
            <span>{t('createProjectPage.basic.template')}</span>
            <select value={duLieu.template} onChange={capNhatTruong('template')}>
              {templateVideo.map(({ id, labelKey }) => (
                <option value={id} key={id}>{t(labelKey)}</option>
              ))}
            </select>
          </label>

          <label className="project-edit-field">
            <span>{t('createProjectPage.basic.language')}</span>
            <select value={duLieu.language} onChange={capNhatTruong('language')}>
              {ngonNguDuAn.map(({ id, labelKey }) => (
                <option value={id} key={id}>{t(labelKey)}</option>
              ))}
            </select>
          </label>

          <div className="project-edit-divider">
            <Settings2 size={14} /> {t('createProjectPage.defaults.title')}
            <button
              type="button"
              className={`project-edit-toggle ${duLieu.defaultSettingsEnabled ? 'on' : ''}`}
              role="switch"
              aria-checked={duLieu.defaultSettingsEnabled}
              onClick={() => setDuLieu((hienTai) => ({
                ...hienTai,
                defaultSettingsEnabled: !hienTai.defaultSettingsEnabled,
              }))}
            >
              <i />
            </button>
          </div>

          {duLieu.defaultSettingsEnabled && (
            <>
              <label className="project-edit-field">
                <span><UserRound size={13} /> {t('createProjectPage.defaults.avatar')}</span>
                <select value={duLieu.defaultAvatar} onChange={capNhatTruong('defaultAvatar')}>
                  <option value="">{t('createProjectPage.defaults.notSelected')}</option>
                </select>
              </label>

              <label className="project-edit-field">
                <span><AudioLines size={13} /> {t('createProjectPage.defaults.voice')}</span>
                <select value={duLieu.defaultVoice} onChange={capNhatTruong('defaultVoice')}>
                  <option value="">{t('createProjectPage.defaults.notSelected')}</option>
                </select>
              </label>

              <label className="project-edit-field">
                <span><MonitorPlay size={13} /> {t('createProjectPage.defaults.ratio')}</span>
                <select value={duLieu.aspectRatio} onChange={capNhatTruong('aspectRatio')}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </label>

              <label className="project-edit-field">
                <span><LayoutGrid size={13} /> {t('createProjectPage.defaults.resolution')}</span>
                <select value={duLieu.resolution} onChange={capNhatTruong('resolution')}>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="2160p">2160p (4K)</option>
                </select>
              </label>
            </>
          )}
        </div>

        {loiLuu && (
          <p className="project-edit-error" role="alert"><CircleAlert size={14} /> {loiLuu}</p>
        )}

        <div className="project-edit-actions">
          <button type="button" className="ghost" onClick={onClose}>{t('createProjectPage.cancel')}</button>
          <button type="submit" className="primary" disabled={dangLuu}>
            {dangLuu
              ? <><LoaderCircle className="project-edit-spinner" size={15} /> {t('createProjectPage.saving')}</>
              : t('createProjectPage.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function ModalXoa({ project, dangXoa, onClose, onConfirm }) {
  const { t } = useNgonNgu();
  return (
    <div className="project-edit-overlay" role="presentation" onClick={onClose}>
      <div
        className="project-edit-modal project-delete-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('projectDetailPage.deleteModal.title')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="project-edit-head">
          <h3>{t('projectDetailPage.deleteModal.title')}</h3>
          <button type="button" aria-label={t('projectDetailPage.deleteModal.title')} onClick={onClose}>
            <X size={17} />
          </button>
        </div>
        <p className="project-delete-message">
          {t('projectDetailPage.deleteModal.message', { name: project.name })}
        </p>
        <div className="project-edit-actions">
          <button type="button" className="ghost" onClick={onClose}>{t('createProjectPage.cancel')}</button>
          <button type="button" className="danger" disabled={dangXoa} onClick={onConfirm}>
            {dangXoa
              ? <><LoaderCircle className="project-edit-spinner" size={15} /> {t('projectDetailPage.deleteModal.deleting')}</>
              : <><Trash2 size={15} /> {t('projectsPage.actions.delete')}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const TRANG_THAI_CHUONG = {
  not_started: 'chapterPage.status.notStarted',
  creating_script: 'chapterPage.status.creatingScript',
  creating_video: 'chapterPage.status.creatingVideo',
  completed: 'chapterPage.status.completed',
};

function ModalChuong({ dangLuu, loiLuu, onClose, onSave }) {
  const { t } = useNgonNgu();
  const [ten, setTen] = useState('');
  const [moTa, setMoTa] = useState('');

  const xuLyLuu = async (event) => {
    event.preventDefault();
    if (!ten.trim()) return;
    const { error } = await onSave({ name: ten, description: moTa }) || {};
    if (!error) onClose();
  };

  return (
    <div className="project-edit-overlay" role="presentation" onClick={onClose}>
      <form
        className="project-edit-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('chapterPage.addModal.title')}
        onClick={(event) => event.stopPropagation()}
        onSubmit={xuLyLuu}
      >
        <div className="project-edit-head">
          <h3>{t('chapterPage.addModal.title')}</h3>
          <button type="button" aria-label={t('chapterPage.addModal.title')} onClick={onClose}>
            <X size={17} />
          </button>
        </div>

        <div className="project-edit-body">
          <label className="project-edit-field full">
            <span>{t('chapterPage.addModal.name')} <b>*</b></span>
            <input value={ten} onChange={(event) => setTen(event.target.value)} maxLength="150" autoFocus required />
          </label>
          <label className="project-edit-field full">
            <span>{t('chapterPage.addModal.description')}</span>
            <textarea value={moTa} onChange={(event) => setMoTa(event.target.value)} maxLength="300" rows="3" />
          </label>
        </div>

        {loiLuu && (
          <p className="project-edit-error" role="alert"><CircleAlert size={14} /> {loiLuu}</p>
        )}

        <div className="project-edit-actions">
          <button type="button" className="ghost" onClick={onClose}>{t('createProjectPage.cancel')}</button>
          <button type="submit" className="primary" disabled={dangLuu}>
            {dangLuu
              ? <><LoaderCircle className="project-edit-spinner" size={15} /> {t('createProjectPage.saving')}</>
              : t('createProjectPage.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function TrangChiTietDuAn({
  project,
  onBack,
  onOpenChapter,
  onEditProject,
  onDeleteProject,
  danhSachChuong,
  dangTaiChuong,
  loiTaiChuong,
  dangLuuChuong,
  loiLuuChuong,
  taiDanhSachChuong,
  luuChuongMoi,
  xoaChuong,
  xoaLoiLuuChuong,
}) {
  const { locale, t } = useNgonNgu();
  const [hienModalSua, setHienModalSua] = useState(false);
  const [hienModalXoa, setHienModalXoa] = useState(false);
  const [dangLuu, setDangLuu] = useState(false);
  const [loiLuu, setLoiLuu] = useState('');
  const [dangXoa, setDangXoa] = useState(false);
  const [hienModalChuong, setHienModalChuong] = useState(false);

  useNhipDongHo(30000);

  const tongVideoChuong = danhSachChuong.reduce((tong, chuong) => tong + (chuong.videoCount || 0), 0);

  const tienDo = Math.min(100, Math.max(0, Number(project.progress) || 0));
  const ngayCapNhat = dinhDangNgay(project.updatedAt, locale, t('common.notUpdated'));
  const capNhatCachDay = dinhDangThoiGianTruoc(project.updatedAt, t, t('common.notUpdated'));
  const danhMuc = t(khoaDanhMuc[project.category] || khoaDanhMuc.other);
  const ngonNgu = t(khoaNgonNgu[project.defaultLanguage] || khoaNgonNgu.vi);
  const template = t(khoaTemplate[project.template] || khoaTemplate.basic);
  const chuaCapNhat = t('common.notUpdated');

  const luuChinhSua = async (duLieu) => {
    setDangLuu(true);
    setLoiLuu('');
    const { error } = await onEditProject?.(project.id, duLieu) || {};
    setDangLuu(false);
    if (error) {
      setLoiLuu(error.message || t('projectsPage.errors.saveFailed'));
      return { error };
    }
    return { error: null };
  };

  const xacNhanXoa = async () => {
    setDangXoa(true);
    const { error } = await onDeleteProject?.(project.id) || {};
    setDangXoa(false);
    if (!error) {
      setHienModalXoa(false);
      onBack?.();
    }
  };

  const moModalChuong = () => {
    xoaLoiLuuChuong();
    setHienModalChuong(true);
  };

  const xoaChuongDaChon = async (chuongId) => {
    await xoaChuong(chuongId);
  };

  return (
    <main className="project-detail-page">
      <div className="project-detail-topline">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} /> {t('projectDetailPage.back')}
        </button>
      </div>

      <section className="project-detail-hero">
        <div className="project-detail-cover">
          {project.coverUrl ? (
            <img src={project.coverUrl} alt={t('projectDetailPage.coverAlt', { name: project.name })} />
          ) : (
            <div><FolderKanban size={42} /><span>{t('projectDetailPage.noCover')}</span></div>
          )}
        </div>

        <div className="project-detail-copy">
          <h1>{project.name}</h1>
          <p className="project-detail-description">
            {project.description || t('projectsPage.noDescription')}
          </p>
          <ul className="project-detail-meta-list">
            <li><span>{t('createProjectPage.basic.category')}:</span> {danhMuc}</li>
            <li><span>{t('createProjectPage.basic.language')}:</span> {ngonNgu}</li>
            <li><span>{t('createProjectPage.basic.template')}:</span> {template}</li>
          </ul>
          <div className="project-detail-dates">
            <span title={ngayCapNhat}>{t('projectDetailPage.updated', { date: capNhatCachDay })}</span>
          </div>
        </div>
      </section>

      <div className="project-detail-layout">
        <div className="project-detail-main">
          <section className="chapter-summary-bar">
            <div className="chapter-summary-counts">
              <span><strong>{danhSachChuong.length}</strong> {t('chapterPage.chapterUnit')}</span>
              <i>|</i>
              <span><strong>{tongVideoChuong}</strong> {t('projectDetailPage.videos')}</span>
              <i>|</i>
              <span>{t('chapterPage.totalProgress')} <strong>{tienDo}%</strong></span>
            </div>
            <button type="button" className="chapter-add-button" onClick={moModalChuong}>
              <Plus size={16} /> {t('chapterPage.addChapter')}
            </button>
          </section>

          <section className="chapter-section">
            <h2 className="chapter-section-title">{t('chapterPage.sectionTitle')}</h2>

            {dangTaiChuong ? (
              <div className="chapter-empty">
                <LoaderCircle className="project-edit-spinner" size={24} />
                <p>{t('chapterPage.loading')}</p>
              </div>
            ) : loiTaiChuong ? (
              <div className="chapter-empty" role="alert">
                <CircleAlert size={22} />
                <p>{loiTaiChuong}</p>
                <button type="button" onClick={taiDanhSachChuong}>{t('projectsPage.retry')}</button>
              </div>
            ) : danhSachChuong.length > 0 ? (
              <div className="chapter-list">
                {danhSachChuong.map((chuong, chiSo) => (
                  <article className="chapter-card" key={chuong.id}>
                    <div className="chapter-card-head">
                      <div>
                        <span className="chapter-index">{t('chapterPage.chapterLabel', { number: String(chiSo + 1).padStart(2, '0') })}</span>
                        <h3>{chuong.name}</h3>
                        {chuong.description && <p>{chuong.description}</p>}
                      </div>
                      <button
                        type="button"
                        className="chapter-delete-button"
                        aria-label={t('chapterPage.menu.delete')}
                        onClick={() => xoaChuongDaChon(chuong.id)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="chapter-meta">
                      <span><FileText size={13} /> {t('chapterPage.documentCount', { count: chuong.documentCount })}</span>
                      <span><Video size={13} /> {t('chapterPage.videoCount', { count: chuong.videoCount })}</span>
                    </div>

                    <div className="chapter-progress-track">
                      <span style={{ width: `${chuong.progress}%` }} className={chuong.status} />
                    </div>

                    <div className="chapter-card-footer">
                      <span className={`chapter-status ${chuong.status}`}>{t(TRANG_THAI_CHUONG[chuong.status])}</span>
                      <button type="button" className="chapter-open-button" onClick={() => onOpenChapter?.(chuong.id)}>
                        {t('chapterPage.openChapter')}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="chapter-empty">
                <span><BookOpen size={26} /></span>
                <h3>{t('chapterPage.emptyTitle')}</h3>
                <p>{t('chapterPage.emptyDescription')}</p>
                <button type="button" onClick={moModalChuong}>
                  <Plus size={16} /> {t('chapterPage.addChapter')}
                </button>
              </div>
            )}
          </section>
        </div>

        <aside className="project-detail-sidebar">
          <section className="project-detail-card">
            <div className="project-detail-card-heading">
              <span><Layers3 size={18} /></span>
              <div><h2>{t('projectDetailPage.infoTitle')}</h2></div>
            </div>
            <dl className="project-detail-info-list">
              <div><dt>{t('createProjectPage.basic.name')}</dt><dd>{project.name}</dd></div>
              <div><dt>{t('createProjectPage.basic.projectDescription')}</dt><dd>{project.description || chuaCapNhat}</dd></div>
              <div><dt>{t('createProjectPage.basic.category')}</dt><dd>{danhMuc}</dd></div>
              <div><dt>{t('createProjectPage.basic.language')}</dt><dd><Globe2 size={12} /> {ngonNgu}</dd></div>
              <div><dt>{t('createProjectPage.basic.template')}</dt><dd>{template}</dd></div>
              <div><dt><UserRound size={11} /> {t('createProjectPage.defaults.avatar')}</dt><dd>{project.defaultAvatar || t('createProjectPage.defaults.notSelected')}</dd></div>
              <div><dt><AudioLines size={11} /> {t('createProjectPage.defaults.voice')}</dt><dd>{project.defaultVoice || t('createProjectPage.defaults.notSelected')}</dd></div>
              <div><dt><MonitorPlay size={11} /> {t('createProjectPage.defaults.ratio')}</dt><dd>{project.aspectRatio || chuaCapNhat}</dd></div>
              <div><dt><LayoutGrid size={11} /> {t('createProjectPage.defaults.resolution')}</dt><dd>{project.resolution || chuaCapNhat}</dd></div>
              <div><dt>{t('projectDetailPage.progress')}</dt><dd>{tienDo}%</dd></div>
              <div><dt>{t('projectDetailPage.status')}</dt><dd>{t(`projectsPage.status.${project.status}`)}</dd></div>
              <div><dt>{t('projectDetailPage.updatedLabel')}</dt><dd title={ngayCapNhat}>{capNhatCachDay}</dd></div>
            </dl>
          </section>

          <section className="project-detail-actions">
            <button type="button" onClick={() => setHienModalSua(true)}>
              <Settings2 size={16} /> {t('projectDetailPage.editProject')}
            </button>
            <button type="button" className="danger" onClick={() => setHienModalXoa(true)}>
              <Trash2 size={16} /> {t('projectDetailPage.deleteProject')}
            </button>
          </section>
        </aside>
      </div>

      {hienModalSua && (
        <ModalChinhSua
          project={project}
          dangLuu={dangLuu}
          loiLuu={loiLuu}
          onClose={() => { setHienModalSua(false); setLoiLuu(''); }}
          onSave={luuChinhSua}
        />
      )}

      {hienModalXoa && (
        <ModalXoa
          project={project}
          dangXoa={dangXoa}
          onClose={() => setHienModalXoa(false)}
          onConfirm={xacNhanXoa}
        />
      )}

      {hienModalChuong && (
        <ModalChuong
          dangLuu={dangLuuChuong}
          loiLuu={loiLuuChuong}
          onClose={() => setHienModalChuong(false)}
          onSave={luuChuongMoi}
        />
      )}
    </main>
  );
}

export default TrangChiTietDuAn;
