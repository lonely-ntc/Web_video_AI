import { useMemo, useRef, useState } from 'react';
import {
  CircleAlert,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FolderKanban,
  HardDrive,
  ImageIcon,
  MoreHorizontal,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/avatar.css';

const SO_AVATAR_MOI_TRANG = 8;

const boLocTrangThai = [
  { id: 'all', labelKey: 'avatarPage.filters.all' },
  { id: 'inUse', labelKey: 'avatarPage.filters.inUse' },
  { id: 'unused', labelKey: 'avatarPage.filters.unused' },
];

const tuyChonSapXep = [
  { id: 'newest', labelKey: 'avatarPage.sort.newest' },
  { id: 'oldest', labelKey: 'avatarPage.sort.oldest' },
  { id: 'nameAsc', labelKey: 'avatarPage.sort.nameAsc' },
  { id: 'sizeDesc', labelKey: 'avatarPage.sort.sizeDesc' },
];

const thaoTacAvatar = [
  { id: 'preview', labelKey: 'avatarPage.menu.preview', icon: Eye },
  { id: 'rename', labelKey: 'avatarPage.menu.rename', icon: PencilLine },
  { id: 'setDefault', labelKey: 'avatarPage.menu.setDefault', icon: Star },
  { id: 'useProject', labelKey: 'avatarPage.menu.useProject', icon: FolderKanban },
  { id: 'download', labelKey: 'avatarPage.menu.download', icon: Download },
  { id: 'delete', labelKey: 'avatarPage.menu.delete', icon: Trash2, danger: true },
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

function ModalNen({ title, onClose, children }) {
  return (
    <div className="avatar-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="avatar-modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="avatar-modal-head">
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

function TheAvatar({
  avatar, projectName, dangTaiXuong, menuDangMo, onToggleMenu, onOpen, onAction,
}) {
  const { locale, t } = useNgonNgu();

  return (
    <article className="avatar-item">
      <button type="button" className="avatar-cover" onClick={onOpen} aria-label={avatar.name}>
        {avatar.fileUrl ? (
          <img src={avatar.fileUrl} alt={avatar.name} />
        ) : (
          <span className="avatar-cover-placeholder"><UserRound size={34} /></span>
        )}
        {avatar.isDefault && (
          <span className="avatar-default-badge"><Star size={11} /> {t('avatarPage.defaultBadge')}</span>
        )}
      </button>

      <div className="avatar-content">
        <div className="avatar-title-row">
          <h3>{avatar.name}</h3>
          <div className="avatar-menu-anchor">
            <button
              type="button"
              className="avatar-menu-button"
              aria-label={t('avatarPage.menuLabel', { name: avatar.name })}
              aria-expanded={menuDangMo}
              onClick={onToggleMenu}
            >
              <MoreHorizontal size={18} />
            </button>
            {menuDangMo && (
              <div className="avatar-action-menu">
                {thaoTacAvatar.map(({ id, labelKey, icon: Icon, danger }) => (
                  <button
                    type="button"
                    key={id}
                    className={danger ? 'danger' : ''}
                    disabled={(id === 'setDefault' && avatar.isDefault)
                      || (id === 'download' && dangTaiXuong)}
                    onClick={() => onAction(id)}
                  >
                    <Icon size={15} /> {t(labelKey)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="avatar-meta">
          <span>{avatar.format}</span>
          <span>{dinhDangDungLuong(avatar.sizeBytes)}</span>
          <span>{dinhDangNgay(avatar.createdAt, locale, t('common.notUpdated'))}</span>
        </div>

        <div className="avatar-status-row">
          <span className={`avatar-status ${projectName ? 'inUse' : 'unused'}`}>
            {projectName
              ? t('avatarPage.status.inUse', { project: projectName })
              : t('avatarPage.status.unused')}
          </span>
        </div>
      </div>
    </article>
  );
}

function TrangAvatar({
  user,
  projects = [],
  avatars = [],
  loading = false,
  error = '',
  uploadingMap = {},
  uploadError = '',
  onLogin,
  onRetry,
  onUpload,
  onRename,
  onSetDefault,
  onMove,
  onDownload,
  onDelete,
  onClearUploadError,
}) {
  const { locale, t } = useNgonNgu();
  const inputFileRef = useRef(null);

  const [tuKhoa, setTuKhoa] = useState('');
  const [boLoc, setBoLoc] = useState('all');
  const [sapXep, setSapXep] = useState('newest');
  const [dangLamMoi, setDangLamMoi] = useState(false);
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [menuDangMo, setMenuDangMo] = useState(null);
  const [avatarXem, setAvatarXem] = useState(null);
  const [hienModalUpload, setHienModalUpload] = useState(false);
  const [dangKeoTha, setDangKeoTha] = useState(false);
  const [avatarDoiTen, setAvatarDoiTen] = useState(null);
  const [tenMoi, setTenMoi] = useState('');
  const [avatarDiChuyen, setAvatarDiChuyen] = useState(null);
  const [projectMoi, setProjectMoi] = useState('');
  const [dangTaiXuongId, setDangTaiXuongId] = useState(null);
  const [loiTaiXuong, setLoiTaiXuong] = useState('');

  const danhSachProject = useMemo(
    () => (Array.isArray(projects) ? projects : []),
    [projects],
  );

  const tenProjectTheoId = useMemo(() => {
    const banDo = new Map(danhSachProject.map((duAn) => [duAn.id, duAn.name]));
    return (projectId) => banDo.get(projectId) || '';
  }, [danhSachProject]);

  const danhSachAvatar = useMemo(
    () => (Array.isArray(avatars) ? avatars : []),
    [avatars],
  );

  const thongKe = useMemo(() => ({
    total: danhSachAvatar.length,
    inUse: danhSachAvatar.filter((avatar) => avatar.projectId).length,
    storageBytes: danhSachAvatar.reduce((tong, avatar) => tong + (avatar.sizeBytes || 0), 0),
  }), [danhSachAvatar]);

  const avatarDaLoc = useMemo(() => {
    const timKiem = tuKhoa.trim().toLocaleLowerCase(locale);
    const ketQua = danhSachAvatar.filter((avatar) => {
      const dungBoLoc = boLoc === 'all'
        || (boLoc === 'inUse' && avatar.projectId)
        || (boLoc === 'unused' && !avatar.projectId);
      const noiDung = avatar.name.toLocaleLowerCase(locale);
      return dungBoLoc && (!timKiem || noiDung.includes(timKiem));
    });

    const sapXepBang = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      nameAsc: (a, b) => a.name.localeCompare(b.name, locale),
      sizeDesc: (a, b) => (b.sizeBytes || 0) - (a.sizeBytes || 0),
    };
    return [...ketQua].sort(sapXepBang[sapXep] || sapXepBang.newest);
  }, [boLoc, danhSachAvatar, locale, sapXep, tuKhoa]);

  const coBoLoc = Boolean(tuKhoa) || boLoc !== 'all';
  const tongSoTrang = Math.max(1, Math.ceil(avatarDaLoc.length / SO_AVATAR_MOI_TRANG));
  const trangHopLe = Math.min(trangHienTai, tongSoTrang);
  const avatarTrongTrang = avatarDaLoc.slice(
    (trangHopLe - 1) * SO_AVATAR_MOI_TRANG,
    trangHopLe * SO_AVATAR_MOI_TRANG,
  );
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

  const taiXuongAvatar = async (avatar) => {
    if (!onDownload) return;
    setLoiTaiXuong('');
    setDangTaiXuongId(avatar.id);
    const { data, error: loi } = await onDownload(avatar.id) || {};
    setDangTaiXuongId(null);

    if (loi || !data?.url) {
      setLoiTaiXuong(t('avatarPage.errors.downloadFailed'));
      return;
    }

    const lienKet = document.createElement('a');
    lienKet.href = data.url;
    lienKet.download = `${avatar.name}.${(avatar.format || 'png').toLowerCase()}`;
    lienKet.rel = 'noopener noreferrer';
    document.body.appendChild(lienKet);
    lienKet.click();
    document.body.removeChild(lienKet);
  };

  const xuLyThaoTac = (thaoTac, avatar) => {
    setMenuDangMo(null);
    if (thaoTac === 'preview') {
      setAvatarXem(avatar);
    } else if (thaoTac === 'rename') {
      setAvatarDoiTen(avatar);
      setTenMoi(avatar.name);
    } else if (thaoTac === 'setDefault') {
      onSetDefault?.(avatar.id);
    } else if (thaoTac === 'useProject') {
      setAvatarDiChuyen(avatar);
      setProjectMoi(avatar.projectId || '');
    } else if (thaoTac === 'download') {
      taiXuongAvatar(avatar);
    } else if (thaoTac === 'delete') {
      onDelete?.(avatar.id);
      if (avatarXem?.id === avatar.id) setAvatarXem(null);
    }
  };

  const luuDoiTen = async () => {
    const ten = tenMoi.trim();
    if (!ten || !avatarDoiTen) return;
    const { error: loi } = await onRename?.(avatarDoiTen.id, ten) || {};
    if (!loi) setAvatarDoiTen(null);
  };

  const luuDiChuyen = async () => {
    if (!avatarDiChuyen) return;
    const { error: loi } = await onMove?.(avatarDiChuyen.id, projectMoi || null) || {};
    if (!loi) setAvatarDiChuyen(null);
  };

  return (
    <main className="avatar-page">
      <section className="avatar-hero">
        <div>
          <span className="avatar-eyebrow"><UserRound size={15} /> {t('avatarPage.eyebrow')}</span>
          <h1>{t('avatarPage.title')}</h1>
          <p>{t('avatarPage.description')}</p>
        </div>
        <div className="avatar-hero-actions">
          <button type="button" className="avatar-upload-secondary" onClick={moUpload}>
            <Plus size={16} /> {t('avatarPage.uploadMany')}
          </button>
          <button type="button" className="avatar-upload-primary" onClick={moUpload}>
            <UploadCloud size={16} /> {t('avatarPage.uploadOne')}
          </button>
        </div>
      </section>

      <section className="avatar-stats" aria-label={t('avatarPage.stats.label')}>
        <article className="avatar-stat-card">
          <span className="tone-purple"><ImageIcon size={20} /></span>
          <div><strong>{thongKe.total}</strong><small>{t('avatarPage.stats.total')}</small></div>
        </article>
        <article className="avatar-stat-card">
          <span className="tone-green"><FolderKanban size={20} /></span>
          <div><strong>{thongKe.inUse}</strong><small>{t('avatarPage.stats.inUse')}</small></div>
        </article>
        <article className="avatar-stat-card">
          <span className="tone-blue"><HardDrive size={20} /></span>
          <div><strong>{dinhDangDungLuong(thongKe.storageBytes)}</strong><small>{t('avatarPage.stats.storage')}</small></div>
        </article>
      </section>

      <section className="avatar-toolbar" aria-label={t('avatarPage.toolbarLabel')}>
        <label className="avatar-search">
          <Search size={17} />
          <input
            value={tuKhoa}
            onChange={(event) => { setTuKhoa(event.target.value); setTrangHienTai(1); }}
            placeholder={t('avatarPage.searchPlaceholder')}
            aria-label={t('avatarPage.searchLabel')}
          />
        </label>

        <div className="avatar-filters" role="group" aria-label={t('avatarPage.filters.label')}>
          {boLocTrangThai.map(({ id, labelKey }) => (
            <button
              type="button"
              className={boLoc === id ? 'active' : ''}
              aria-pressed={boLoc === id}
              key={id}
              onClick={() => { setBoLoc(id); setTrangHienTai(1); setMenuDangMo(null); }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>

        <select
          className="avatar-select"
          value={sapXep}
          aria-label={t('avatarPage.sort.label')}
          onChange={(event) => setSapXep(event.target.value)}
        >
          {tuyChonSapXep.map(({ id, labelKey }) => (
            <option value={id} key={id}>{t(labelKey)}</option>
          ))}
        </select>

        <button type="button" className="avatar-refresh" onClick={lamMoi}>
          <RefreshCw size={16} className={dangLamMoi ? 'spin' : ''} /> {t('avatarPage.refresh')}
        </button>
      </section>

      <section className="avatar-list-panel">
        <div className="avatar-list-heading">
          <h2>{t('avatarPage.listTitle')}</h2>
          <p>{t('avatarPage.resultCount', { count: avatarDaLoc.length })}</p>
        </div>

        {loading ? (
          <div className="avatar-grid" aria-live="polite" aria-label={t('avatarPage.loading')}>
            {Array.from({ length: 8 }).map((_, chiSo) => (
              // eslint-disable-next-line react/no-array-index-key
              <div className="avatar-skeleton-card" key={chiSo} aria-hidden="true">
                <div className="skeleton skeleton-thumb" />
                <div className="avatar-skeleton-card-body">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="avatar-empty" role="alert">
            <span className="tone-red"><CircleAlert size={25} /></span>
            <h3>{t('avatarPage.loadErrorTitle')}</h3>
            <p>{error}</p>
            <button type="button" onClick={onRetry}>{t('avatarPage.retry')}</button>
          </div>
        ) : avatarTrongTrang.length > 0 ? (
          <div className="avatar-grid">
            {avatarTrongTrang.map((avatar) => (
              <TheAvatar
                avatar={avatar}
                projectName={tenProjectTheoId(avatar.projectId)}
                dangTaiXuong={dangTaiXuongId === avatar.id}
                menuDangMo={menuDangMo === avatar.id}
                key={avatar.id}
                onToggleMenu={() => setMenuDangMo((hienTai) => (hienTai === avatar.id ? null : avatar.id))}
                onOpen={() => setAvatarXem(avatar)}
                onAction={(thaoTac) => xuLyThaoTac(thaoTac, avatar)}
              />
            ))}
          </div>
        ) : (
          <div className="avatar-empty">
            <span><UserRound size={32} /></span>
            <h3>{t(coBoLoc ? 'avatarPage.emptyFilteredTitle' : 'avatarPage.emptyTitle')}</h3>
            <p>{t(coBoLoc ? 'avatarPage.emptyFilteredDescription' : 'avatarPage.emptyDescription')}</p>
            {!coBoLoc && (
              <button type="button" onClick={moUpload}>
                <Plus size={17} /> {t('avatarPage.uploadOne')}
              </button>
            )}
          </div>
        )}

        {!loading && !error && avatarDaLoc.length > 0 && (
          <nav className="avatar-pagination" aria-label={t('avatarPage.pagination.label')}>
            <button
              type="button"
              disabled={trangHopLe <= 1}
              aria-label={t('avatarPage.pagination.previous')}
              onClick={() => setTrangHienTai((trang) => Math.max(1, trang - 1))}
            >
              <ChevronLeft size={17} />
            </button>
            <span>{t('avatarPage.pagination.page', { current: trangHopLe, total: tongSoTrang })}</span>
            <button
              type="button"
              disabled={trangHopLe >= tongSoTrang}
              aria-label={t('avatarPage.pagination.next')}
              onClick={() => setTrangHienTai((trang) => Math.min(tongSoTrang, trang + 1))}
            >
              <ChevronRight size={17} />
            </button>
          </nav>
        )}
      </section>

      {hienModalUpload && (
        <ModalNen title={t('avatarPage.dropzone.title')} onClose={() => setHienModalUpload(false)}>
          <div
            className={`avatar-dropzone ${dangKeoTha ? 'active' : ''}`}
            onDragOver={(event) => { event.preventDefault(); setDangKeoTha(true); }}
            onDragLeave={() => setDangKeoTha(false)}
            onDrop={xuLyThaFile}
            onClick={() => inputFileRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <UploadCloud size={30} />
            <p>{t('avatarPage.dropzone.title')}</p>
            <span>{t('avatarPage.dropzone.or')}</span>
            <button type="button" onClick={(event) => { event.stopPropagation(); inputFileRef.current?.click(); }}>
              <Plus size={15} /> {t('avatarPage.dropzone.upload')}
            </button>
            <div className="avatar-dropzone-formats">
              <span>PNG</span><span>JPG</span><span>JPEG</span><span>WEBP</span>
            </div>
            <input
              ref={inputFileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={xuLyChonFile}
            />
          </div>

          {uploadError && (
            <p className="avatar-upload-error" role="alert">{uploadError}</p>
          )}

          {dangTaiLenDanhSach.map((muc, chiSo) => (
            <div className="avatar-upload-progress" key={`${muc.ten}-${chiSo}`}>
              <div className="avatar-upload-progress-head">
                <span>{muc.ten}</span>
                <strong>{muc.phanTram}%</strong>
              </div>
              <div className="avatar-upload-progress-track">
                <span style={{ width: `${muc.phanTram}%` }} />
              </div>
            </div>
          ))}
        </ModalNen>
      )}

      {avatarDoiTen && (
        <ModalNen title={t('avatarPage.renameModal.title')} onClose={() => setAvatarDoiTen(null)}>
          <div className="avatar-modal-body">
            <label>
              {t('avatarPage.renameModal.label')}
              <input value={tenMoi} onChange={(event) => setTenMoi(event.target.value)} autoFocus />
            </label>
            <div className="avatar-modal-actions">
              <button type="button" className="ghost" onClick={() => setAvatarDoiTen(null)}>
                {t('avatarPage.renameModal.cancel')}
              </button>
              <button type="button" className="primary" onClick={luuDoiTen}>
                {t('avatarPage.renameModal.save')}
              </button>
            </div>
          </div>
        </ModalNen>
      )}

      {avatarDiChuyen && (
        <ModalNen title={t('avatarPage.moveModal.title')} onClose={() => setAvatarDiChuyen(null)}>
          <div className="avatar-modal-body">
            <label>
              {t('avatarPage.moveModal.label')}
              <select value={projectMoi} onChange={(event) => setProjectMoi(event.target.value)}>
                <option value="">{t('avatarPage.status.unused')}</option>
                {danhSachProject.map((duAn) => (
                  <option value={duAn.id} key={duAn.id}>{duAn.name}</option>
                ))}
              </select>
            </label>
            <div className="avatar-modal-actions">
              <button type="button" className="ghost" onClick={() => setAvatarDiChuyen(null)}>
                {t('avatarPage.moveModal.cancel')}
              </button>
              <button type="button" className="primary" onClick={luuDiChuyen}>
                {t('avatarPage.moveModal.save')}
              </button>
            </div>
          </div>
        </ModalNen>
      )}

      {avatarXem && (
        <div className="avatar-drawer-overlay" role="presentation" onClick={() => setAvatarXem(null)}>
          <aside
            className="avatar-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={avatarXem.name}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="avatar-drawer-head">
              <h3>{avatarXem.name}</h3>
              <button type="button" aria-label={t('avatarPage.menu.preview')} onClick={() => setAvatarXem(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="avatar-drawer-preview">
              {avatarXem.fileUrl ? (
                <img src={avatarXem.fileUrl} alt={avatarXem.name} />
              ) : (
                <UserRound size={48} />
              )}
              {avatarXem.isDefault && (
                <span className="avatar-default-badge"><Star size={11} /> {t('avatarPage.defaultBadge')}</span>
              )}
            </div>

            <dl className="avatar-drawer-meta">
              <div><dt>{t('avatarPage.columns.format')}</dt><dd>{avatarXem.format}</dd></div>
              <div><dt>{t('avatarPage.columns.size')}</dt><dd>{dinhDangDungLuong(avatarXem.sizeBytes)}</dd></div>
              <div>
                <dt>{t('avatarPage.drawer.dimensions')}</dt>
                <dd>{avatarXem.width && avatarXem.height ? `${avatarXem.width}×${avatarXem.height}px` : '—'}</dd>
              </div>
              <div>
                <dt>{t('avatarPage.drawer.uploadedDate')}</dt>
                <dd>{dinhDangNgay(avatarXem.createdAt, locale, t('common.notUpdated'))}</dd>
              </div>
              <div>
                <dt>{t('avatarPage.drawer.updatedDate')}</dt>
                <dd>{dinhDangNgay(avatarXem.updatedAt, locale, t('common.notUpdated'))}</dd>
              </div>
              <div>
                <dt>{t('avatarPage.drawer.project')}</dt>
                <dd>{tenProjectTheoId(avatarXem.projectId) || t('avatarPage.status.unused')}</dd>
              </div>
            </dl>

            <div className="avatar-drawer-actions">
              <button type="button" onClick={() => xuLyThaoTac('rename', avatarXem)}>
                <PencilLine size={15} /> {t('avatarPage.menu.rename')}
              </button>
              <button
                type="button"
                disabled={avatarXem.isDefault}
                onClick={() => xuLyThaoTac('setDefault', avatarXem)}
              >
                <Star size={15} /> {t('avatarPage.menu.setDefault')}
              </button>
              <button
                type="button"
                disabled={dangTaiXuongId === avatarXem.id}
                onClick={() => xuLyThaoTac('download', avatarXem)}
              >
                <Download size={15} /> {t('avatarPage.menu.download')}
              </button>
              <button type="button" className="danger" onClick={() => xuLyThaoTac('delete', avatarXem)}>
                <Trash2 size={15} /> {t('avatarPage.menu.delete')}
              </button>
            </div>
            {loiTaiXuong && (
              <p className="avatar-drawer-error" role="alert">{loiTaiXuong}</p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}

export default TrangAvatar;
