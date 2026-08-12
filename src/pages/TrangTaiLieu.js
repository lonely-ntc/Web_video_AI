import { useMemo, useRef, useState } from 'react';
import {
  CircleAlert,
  Download,
  File,
  FileCode,
  FileText,
  FolderInput,
  HardDrive,
  LoaderCircle,
  MoreHorizontal,
  Eye,
  Files,
  PencilLine,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/tai-lieu.css';

const LOAI_FILE = [
  { id: 'pdf', icon: FileText, tone: 'red', accept: '.pdf,application/pdf' },
  { id: 'word', icon: File, tone: 'blue', accept: '.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { id: 'ppt', icon: Presentation, tone: 'orange', accept: '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation' },
  { id: 'txt', icon: FileText, tone: 'grey', accept: '.txt,text/plain' },
  { id: 'md', icon: FileCode, tone: 'purple', accept: '.md,text/markdown' },
];

const boLocLoai = [
  { id: 'all', labelKey: 'documentsPage.fileType.all' },
  { id: 'pdf', labelKey: 'documentsPage.fileType.pdf' },
  { id: 'word', labelKey: 'documentsPage.fileType.word' },
  { id: 'ppt', labelKey: 'documentsPage.fileType.ppt' },
  { id: 'txt', labelKey: 'documentsPage.fileType.txt' },
  { id: 'md', labelKey: 'documentsPage.fileType.md' },
];

const tuyChonSapXep = [
  { id: 'newest', labelKey: 'documentsPage.sort.newest' },
  { id: 'oldest', labelKey: 'documentsPage.sort.oldest' },
  { id: 'nameAsc', labelKey: 'documentsPage.sort.nameAsc' },
  { id: 'sizeDesc', labelKey: 'documentsPage.sort.sizeDesc' },
];

const thaoTacTaiLieu = [
  { id: 'preview', labelKey: 'documentsPage.menu.preview', icon: Eye },
  { id: 'rename', labelKey: 'documentsPage.menu.rename', icon: PencilLine },
  { id: 'move', labelKey: 'documentsPage.menu.move', icon: FolderInput },
  { id: 'download', labelKey: 'documentsPage.menu.download', icon: Download },
  { id: 'delete', labelKey: 'documentsPage.menu.delete', icon: Trash2, danger: true },
];

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

function thongTinLoaiFile(type) {
  return LOAI_FILE.find((loai) => loai.id === type) || LOAI_FILE[0];
}

function ModalNen({ title, onClose, children }) {
  return (
    <div className="documents-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="documents-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="documents-modal-head">
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

function TrangTaiLieu({
  user,
  projects = [],
  documents = [],
  loading = false,
  error = '',
  uploadingMap = {},
  uploadError = '',
  onLogin,
  onRetry,
  onUpload,
  onRename,
  onMove,
  onDownload,
  onDelete,
  onClearUploadError,
}) {
  const { locale, t } = useNgonNgu();
  const inputFileRef = useRef(null);

  const [tuKhoa, setTuKhoa] = useState('');
  const [locLoai, setLocLoai] = useState('all');
  const [locProject, setLocProject] = useState('all');
  const [sapXep, setSapXep] = useState('newest');
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [menuDangMo, setMenuDangMo] = useState(null);
  const [taiLieuChon, setTaiLieuChon] = useState(new Set());
  const [taiLieuXem, setTaiLieuXem] = useState(null);
  const [hienModalUpload, setHienModalUpload] = useState(false);
  const [dangKeoTha, setDangKeoTha] = useState(false);
  const [taiLieuDoiTen, setTaiLieuDoiTen] = useState(null);
  const [tenMoi, setTenMoi] = useState('');
  const [taiLieuDiChuyen, setTaiLieuDiChuyen] = useState(null);
  const [projectMoi, setProjectMoi] = useState('');

  const danhSachProject = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects],
  );

  const tenProjectTheoId = useMemo(() => {
    const banDo = new Map(danhSachProject.map((duAn) => [duAn.id, duAn.name]));
    return (projectId) => banDo.get(projectId) || t('documentsPage.noProject');
  }, [danhSachProject, t]);

  const danhSachTaiLieu = useMemo(
    () => (Array.isArray(documents) ? documents : []),
    [documents],
  );

  const thongKe = useMemo(() => {
    const ketQua = { total: danhSachTaiLieu.length, pdf: 0, word: 0, ppt: 0, txt: 0, md: 0, storageBytes: 0 };
    danhSachTaiLieu.forEach((taiLieu) => {
      ketQua[taiLieu.fileType] = (ketQua[taiLieu.fileType] || 0) + 1;
      ketQua.storageBytes += taiLieu.sizeBytes || 0;
    });
    return ketQua;
  }, [danhSachTaiLieu]);

  const taiLieuDaLoc = useMemo(() => {
    const timKiem = tuKhoa.trim().toLocaleLowerCase(locale);
    const ketQua = danhSachTaiLieu.filter((taiLieu) => {
      const dungLoai = locLoai === 'all' || taiLieu.fileType === locLoai;
      const dungProject = locProject === 'all' || taiLieu.projectId === locProject
        || (locProject === 'none' && !taiLieu.projectId);
      const noiDung = taiLieu.name.toLocaleLowerCase(locale);
      return dungLoai && dungProject && (!timKiem || noiDung.includes(timKiem));
    });

    const sapXepBang = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      nameAsc: (a, b) => a.name.localeCompare(b.name, locale),
      sizeDesc: (a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0),
    };
    return [...ketQua].sort(sapXepBang[sapXep] || sapXepBang.newest);
  }, [danhSachTaiLieu, locLoai, locProject, locale, sapXep, tuKhoa]);

  const coBoLoc = Boolean(tuKhoa) || locLoai !== 'all' || locProject !== 'all';
  const dangTaiLenDanhSach = Object.values(uploadingMap);

  const moUpload = () => {
    if (!user) {
      onLogin?.();
      return;
    }
    onClearUploadError?.();
    setHienModalUpload(true);
  };

  const guiFileLen = (files) => {
    Array.from(files || []).forEach((file) => onUpload?.(file));
  };

  const moChonFile = (accept = '') => {
    if (inputFileRef.current) {
      inputFileRef.current.accept = accept;
      inputFileRef.current.click();
    }
  };

  const xuLyChonFile = (event) => {
    guiFileLen(event.target.files);
    event.target.value = '';
  };

  const xuLyThaFile = (event) => {
    event.preventDefault();
    setDangKeoTha(false);
    guiFileLen(event.dataTransfer.files);
  };

  const lamMoi = async () => {
    setDangLamMoi(true);
    await onRetry?.();
    setDangLamMoi(false);
  };

  const toggleChonTaiLieu = (id) => {
    setTaiLieuChon((hienTai) => {
      const banSao = new Set(hienTai);
      if (banSao.has(id)) banSao.delete(id); else banSao.add(id);
      return banSao;
    });
  };

  const [dangTaiXuongId, setDangTaiXuongId] = useState(null);
  const [loiTaiXuong, setLoiTaiXuong] = useState('');

  const taiXuongTaiLieu = async (taiLieu) => {
    if (taiLieu.status !== 'ready' || !onDownload) return;
    setLoiTaiXuong('');
    setDangTaiXuongId(taiLieu.id);
    const { data, error: loi } = await onDownload(taiLieu.id) || {};
    setDangTaiXuongId(null);

    if (loi || !data?.url) {
      setLoiTaiXuong(t('documentsPage.errors.downloadFailed'));
      return;
    }

    const lienKet = document.createElement('a');
    lienKet.href = data.url;
    lienKet.download = taiLieu.name;
    lienKet.rel = 'noopener noreferrer';
    document.body.appendChild(lienKet);
    lienKet.click();
    document.body.removeChild(lienKet);
  };

  const xuLyThaoTac = (thaoTac, taiLieu) => {
    setMenuDangMo(null);
    if (thaoTac === 'preview') {
      setTaiLieuXem(taiLieu);
    } else if (thaoTac === 'rename') {
      setTaiLieuDoiTen(taiLieu);
      setTenMoi(taiLieu.name);
    } else if (thaoTac === 'move') {
      setTaiLieuDiChuyen(taiLieu);
      setProjectMoi(taiLieu.projectId || '');
    } else if (thaoTac === 'download') {
      taiXuongTaiLieu(taiLieu);
    } else if (thaoTac === 'delete') {
      onDelete?.(taiLieu.id);
      if (taiLieuXem?.id === taiLieu.id) setTaiLieuXem(null);
    }
  };

  const luuDoiTen = async () => {
    const ten = tenMoi.trim();
    if (!ten || !taiLieuDoiTen) return;
    const { error: loiDoiTen } = await onRename?.(taiLieuDoiTen.id, ten) || {};
    if (!loiDoiTen) setTaiLieuDoiTen(null);
  };

  const luuDiChuyen = async () => {
    if (!taiLieuDiChuyen) return;
    const { error: loiDiChuyen } = await onMove?.(
      taiLieuDiChuyen.id,
      projectMoi || null,
      tenProjectTheoId(projectMoi),
    ) || {};
    if (!loiDiChuyen) setTaiLieuDiChuyen(null);
  };

  return (
    <main className="documents-page">
      <section className="documents-hero">
        <div>
          <span className="documents-eyebrow"><Files size={15} /> {t('documentsPage.eyebrow')}</span>
          <h1>{t('documentsPage.title')}</h1>
          <p>{t('documentsPage.description')}</p>
        </div>
        <div className="documents-hero-actions">
          <button type="button" className="documents-upload-secondary" onClick={moUpload}>
            <Plus size={16} /> {t('documentsPage.uploadMany')}
          </button>
          <button type="button" className="documents-upload-primary" onClick={moUpload}>
            <UploadCloud size={16} /> {t('documentsPage.uploadOne')}
          </button>
        </div>
      </section>

      <section className="documents-stats" aria-label={t('documentsPage.stats.label')}>
        <article className="document-stat-card">
          <span className="tone-purple"><Files size={18} /></span>
          <div><strong>{thongKe.total}</strong><small>{t('documentsPage.stats.total')}</small></div>
        </article>
        {LOAI_FILE.map(({ id, icon: Icon, tone }) => (
          <article className="document-stat-card" key={id}>
            <span className={`tone-${tone}`}><Icon size={18} /></span>
            <div><strong>{thongKe[id]}</strong><small>{t(`documentsPage.stats.${id}`)}</small></div>
          </article>
        ))}
        <article className="document-stat-card">
          <span className="tone-blue"><HardDrive size={18} /></span>
          <div><strong>{dinhDangDungLuong(thongKe.storageBytes)}</strong><small>{t('documentsPage.stats.storage')}</small></div>
        </article>
      </section>

      <section className="documents-toolbar" aria-label={t('documentsPage.toolbarLabel')}>
        <label className="documents-search">
          <Search size={17} />
          <input
            value={tuKhoa}
            onChange={(event) => setTuKhoa(event.target.value)}
            placeholder={t('documentsPage.searchPlaceholder')}
            aria-label={t('documentsPage.searchLabel')}
          />
        </label>

        <select
          className="documents-select"
          value={locLoai}
          aria-label={t('documentsPage.fileType.label')}
          onChange={(event) => setLocLoai(event.target.value)}
        >
          {boLocLoai.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <select
          className="documents-select"
          value={locProject}
          aria-label={t('documentsPage.projectFilter.label')}
          onChange={(event) => setLocProject(event.target.value)}
        >
          <option value="all">{t('documentsPage.projectFilter.all')}</option>
          <option value="none">{t('documentsPage.noProject')}</option>
          {danhSachProject.map((duAn) => (
            <option value={duAn.id} key={duAn.id}>{duAn.name}</option>
          ))}
        </select>

        <select
          className="documents-select"
          value={sapXep}
          aria-label={t('documentsPage.sort.label')}
          onChange={(event) => setSapXep(event.target.value)}
        >
          {tuyChonSapXep.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <button
          type="button"
          className="documents-refresh"
          aria-label={t('documentsPage.refresh')}
          onClick={lamMoi}
        >
          <RefreshCw size={16} className={dangLamMoi ? 'spin' : ''} /> {t('documentsPage.refresh')}
        </button>
      </section>

      <section className="documents-list-panel">
        <div className="documents-list-heading">
          <h2>{t('documentsPage.listTitle')}</h2>
          <p>{t('documentsPage.resultCount', { count: taiLieuDaLoc.length })}</p>
        </div>

        {loading ? (
          <div className="documents-empty">
            <LoaderCircle className="documents-empty-spinner" size={27} />
            <h3>{t('documentsPage.loading')}</h3>
          </div>
        ) : error ? (
          <div className="documents-empty" role="alert">
            <span className="tone-red"><CircleAlert size={25} /></span>
            <h3>{t('documentsPage.loadErrorTitle')}</h3>
            <p>{error}</p>
            <button type="button" onClick={onRetry}>{t('documentsPage.retry')}</button>
          </div>
        ) : taiLieuDaLoc.length > 0 ? (
          <div className="documents-table" role="table">
            <div className="documents-row documents-row-head" role="row">
              <span />
              <span />
              <span>{t('documentsPage.columns.name')}</span>
              <span>{t('documentsPage.columns.project')}</span>
              <span>{t('documentsPage.columns.chapter')}</span>
              <span>{t('documentsPage.columns.type')}</span>
              <span>{t('documentsPage.columns.size')}</span>
              <span>{t('documentsPage.columns.date')}</span>
              <span>{t('documentsPage.columns.status')}</span>
              <span />
            </div>

            {taiLieuDaLoc.map((taiLieu) => {
              const loai = thongTinLoaiFile(taiLieu.fileType);
              const Icon = loai.icon;
              return (
                <div
                  className="documents-row"
                  role="row"
                  key={taiLieu.id}
                  onClick={() => setTaiLieuXem(taiLieu)}
                >
                  <span role="cell" onClick={(event) => event.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={taiLieuChon.has(taiLieu.id)}
                      aria-label={taiLieu.name}
                      onChange={() => toggleChonTaiLieu(taiLieu.id)}
                    />
                  </span>
                  <span role="cell">
                    <span className={`document-file-icon tone-${loai.tone}`}><Icon size={17} /></span>
                  </span>
                  <span role="cell" className="documents-cell-name">{taiLieu.name}</span>
                  <span role="cell" className="documents-cell-muted">{tenProjectTheoId(taiLieu.projectId)}</span>
                  <span role="cell" className="documents-cell-muted">{taiLieu.chapterName || t('documentsPage.noChapter')}</span>
                  <span role="cell">
                    <span className={`document-type-badge tone-${loai.tone}`}>
                      {t(`documentsPage.fileType.${taiLieu.fileType}`)}
                    </span>
                  </span>
                  <span role="cell" className="documents-cell-muted">{dinhDangDungLuong(taiLieu.sizeBytes)}</span>
                  <span role="cell" className="documents-cell-muted">
                    {dinhDangNgay(taiLieu.createdAt, locale, t('common.notUpdated'))}
                  </span>
                  <span role="cell">
                    <span className={`document-status ${taiLieu.status}`}>
                      {t(`documentsPage.status.${taiLieu.status}`)}
                    </span>
                  </span>
                  <span role="cell" className="documents-menu-anchor" onClick={(event) => event.stopPropagation()}>
                    <button
                      type="button"
                      className="documents-menu-button"
                      aria-label={t('documentsPage.menuLabel', { name: taiLieu.name })}
                      aria-expanded={menuDangMo === taiLieu.id}
                      onClick={() => setMenuDangMo((hienTai) => (hienTai === taiLieu.id ? null : taiLieu.id))}
                    >
                      <MoreHorizontal size={18} />
                    </button>
                    {menuDangMo === taiLieu.id && (
                      <div className="documents-action-menu">
                        {thaoTacTaiLieu.map(({ id, labelKey, icon: Icon2, danger }) => (
                          <button
                            type="button"
                            key={id}
                            className={danger ? 'danger' : ''}
                            disabled={id === 'download' && (taiLieu.status !== 'ready' || dangTaiXuongId === taiLieu.id)}
                            onClick={() => xuLyThaoTac(id, taiLieu)}
                          >
                            <Icon2 size={15} /> {t(labelKey)}
                          </button>
                        ))}
                      </div>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="documents-empty">
            <span><Files size={32} /></span>
            <h3>{t(coBoLoc ? 'documentsPage.emptyFilteredTitle' : 'documentsPage.emptyTitle')}</h3>
            <p>{t(coBoLoc ? 'documentsPage.emptyFilteredDescription' : 'documentsPage.emptyDescription')}</p>
            {!coBoLoc && (
              <button type="button" onClick={moUpload}>
                <Plus size={17} /> {t('documentsPage.uploadOne')}
              </button>
            )}
          </div>
        )}
      </section>

      {hienModalUpload && (
        <ModalNen
          title={t('documentsPage.dropzone.title')}
          onClose={() => setHienModalUpload(false)}
        >
          <div
            className={`documents-dropzone ${dangKeoTha ? 'active' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDangKeoTha(true); }}
            onDragLeave={() => setDangKeoTha(false)}
            onDrop={xuLyThaFile}
            onClick={() => moChonFile('')}
            role="button"
            tabIndex={0}
          >
            <UploadCloud size={30} />
            <p>{t('documentsPage.dropzone.title')}</p>
            <span>{t('documentsPage.dropzone.or')}</span>
            <div className="documents-dropzone-buttons">
              {LOAI_FILE.map(({ id, icon: Icon, tone, accept }) => (
                <button
                  type="button"
                  className={`tone-${tone}`}
                  key={id}
                  onClick={(event) => { event.stopPropagation(); moChonFile(accept); }}
                >
                  <Icon size={15} /> {t(`documentsPage.dropzone.upload${id.charAt(0).toUpperCase()}${id.slice(1)}`)}
                </button>
              ))}
            </div>
            <input
              ref={inputFileRef}
              type="file"
              multiple
              hidden
              onChange={xuLyChonFile}
            />
          </div>

          {uploadError && (
            <p className="documents-upload-error" role="alert">{uploadError}</p>
          )}

          {dangTaiLenDanhSach.map((muc, chiSo) => (
            <div className="documents-upload-progress" key={`${muc.ten}-${chiSo}`}>
              <div className="documents-upload-progress-head">
                <span>{muc.ten}</span>
                <strong>{muc.phanTram}%</strong>
              </div>
              <div className="documents-upload-progress-track">
                <span style={{ width: `${muc.phanTram}%` }} />
              </div>
            </div>
          ))}
        </ModalNen>
      )}

      {taiLieuDoiTen && (
        <ModalNen title={t('documentsPage.renameModal.title')} onClose={() => setTaiLieuDoiTen(null)}>
          <div className="documents-modal-body">
            <label>
              {t('documentsPage.renameModal.label')}
              <input
                value={tenMoi}
                onChange={(event) => setTenMoi(event.target.value)}
                autoFocus
              />
            </label>
            <div className="documents-modal-actions">
              <button type="button" className="ghost" onClick={() => setTaiLieuDoiTen(null)}>
                {t('documentsPage.renameModal.cancel')}
              </button>
              <button type="button" className="primary" onClick={luuDoiTen}>
                {t('documentsPage.renameModal.save')}
              </button>
            </div>
          </div>
        </ModalNen>
      )}

      {taiLieuDiChuyen && (
        <ModalNen title={t('documentsPage.moveModal.title')} onClose={() => setTaiLieuDiChuyen(null)}>
          <div className="documents-modal-body">
            <label>
              {t('documentsPage.moveModal.label')}
              <select value={projectMoi} onChange={(event) => setProjectMoi(event.target.value)}>
                <option value="">{t('documentsPage.noProject')}</option>
                {danhSachProject.map((duAn) => (
                  <option value={duAn.id} key={duAn.id}>{duAn.name}</option>
                ))}
              </select>
            </label>
            <div className="documents-modal-actions">
              <button type="button" className="ghost" onClick={() => setTaiLieuDiChuyen(null)}>
                {t('documentsPage.moveModal.cancel')}
              </button>
              <button type="button" className="primary" onClick={luuDiChuyen}>
                {t('documentsPage.moveModal.save')}
              </button>
            </div>
          </div>
        </ModalNen>
      )}

      {taiLieuXem && (
        <div className="documents-drawer-overlay" role="presentation" onClick={() => setTaiLieuXem(null)}>
          <aside
            className="documents-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={taiLieuXem.name}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="documents-drawer-head">
              <h3>{taiLieuXem.name}</h3>
              <button type="button" aria-label={t('documentsPage.menu.preview')} onClick={() => setTaiLieuXem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="documents-drawer-preview">
              {(() => {
                const loai = thongTinLoaiFile(taiLieuXem.fileType);
                const Icon = loai.icon;
                return <span className={`tone-${loai.tone}`}><Icon size={38} /></span>;
              })()}
              <p>{t('documentsPage.drawer.noPreview')}</p>
            </div>

            <dl className="documents-drawer-meta">
              <div><dt>{t('documentsPage.columns.project')}</dt><dd>{tenProjectTheoId(taiLieuXem.projectId)}</dd></div>
              <div><dt>{t('documentsPage.columns.chapter')}</dt><dd>{taiLieuXem.chapterName || t('documentsPage.noChapter')}</dd></div>
              <div><dt>{t('documentsPage.columns.type')}</dt><dd>{t(`documentsPage.fileType.${taiLieuXem.fileType}`)}</dd></div>
              <div><dt>{t('documentsPage.columns.size')}</dt><dd>{dinhDangDungLuong(taiLieuXem.sizeBytes)}</dd></div>
              <div>
                <dt>{t('documentsPage.drawer.uploadedDate')}</dt>
                <dd>{dinhDangNgay(taiLieuXem.createdAt, locale, t('common.notUpdated'))}</dd>
              </div>
              <div>
                <dt>{t('documentsPage.drawer.updatedDate')}</dt>
                <dd>{dinhDangNgay(taiLieuXem.updatedAt, locale, t('common.notUpdated'))}</dd>
              </div>
            </dl>

            <div className="documents-drawer-actions">
              <button type="button" onClick={() => xuLyThaoTac('rename', taiLieuXem)}>
                <PencilLine size={15} /> {t('documentsPage.menu.rename')}
              </button>
              <button type="button" onClick={() => xuLyThaoTac('move', taiLieuXem)}>
                <FolderInput size={15} /> {t('documentsPage.menu.move')}
              </button>
              <button
                type="button"
                disabled={taiLieuXem.status !== 'ready' || dangTaiXuongId === taiLieuXem.id}
                onClick={() => xuLyThaoTac('download', taiLieuXem)}
              >
                <Download size={15} /> {t('documentsPage.menu.download')}
              </button>
              <button type="button" className="danger" onClick={() => xuLyThaoTac('delete', taiLieuXem)}>
                <Trash2 size={15} /> {t('documentsPage.menu.delete')}
              </button>
            </div>
            {loiTaiXuong && (
              <p className="documents-drawer-error" role="alert">{loiTaiXuong}</p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default TrangTaiLieu;
