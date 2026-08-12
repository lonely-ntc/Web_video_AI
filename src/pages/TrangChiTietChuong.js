import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Download,
  FileText,
  History,
  LoaderCircle,
  PencilLine,
  Play,
  Trash2,
  UploadCloud,
  UserRound,
  Video,
  X,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useChuongWorkspace from '../flows/useChuongWorkspace';
import useKichBan from '../flows/useKichBan';
import '../styles/chi-tiet-chuong.css';

const TRANG_THAI_CHUONG = {
  not_started: 'chapterPage.status.notStarted',
  creating_script: 'chapterPage.status.creatingScript',
  creating_video: 'chapterPage.status.creatingVideo',
  completed: 'chapterPage.status.completed',
};

function dinhDangDungLuong(bytes) {
  if (!bytes) return '0 KB';
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function CardMuc({ icon: Icon, title, action, children }) {
  return (
    <section className="chapter-card-section">
      <div className="chapter-card-section-head">
        <span><Icon size={15} /></span>
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ModalDoiTenTaiLieu({ taiLieu, dangLuu, loiLuu, onClose, onSave }) {
  const { t } = useNgonNgu();
  const [ten, setTen] = useState(taiLieu.name);

  const xuLyLuu = async (event) => {
    event.preventDefault();
    if (!ten.trim()) return;
    const { error } = await onSave(ten.trim()) || {};
    if (!error) onClose();
  };

  return (
    <div className="chapter-modal-overlay" role="presentation" onClick={onClose}>
      <form
        className="chapter-modal"
        role="dialog"
        aria-modal="true"
        aria-label={t('documentsPage.renameModal.title')}
        onClick={(event) => event.stopPropagation()}
        onSubmit={xuLyLuu}
      >
        <div className="chapter-modal-head">
          <h3>{t('documentsPage.renameModal.title')}</h3>
          <button type="button" aria-label={t('documentsPage.renameModal.title')} onClick={onClose}>
            <X size={16} />
          </button>
        </div>
        <label className="chapter-modal-field">
          <span>{t('documentsPage.renameModal.label')}</span>
          <input value={ten} onChange={(event) => setTen(event.target.value)} autoFocus maxLength="200" required />
        </label>
        {loiLuu && <p className="chapter-step-error"><CircleAlert size={13} /> {loiLuu}</p>}
        <div className="chapter-modal-actions">
          <button type="button" className="ghost" onClick={onClose}>{t('documentsPage.renameModal.cancel')}</button>
          <button type="submit" className="primary" disabled={dangLuu}>
            {dangLuu ? <LoaderCircle size={14} className="chapter-spin" /> : null}
            {t('documentsPage.renameModal.save')}
          </button>
        </div>
      </form>
    </div>
  );
}

function TrangChiTietChuong({
  user,
  project,
  chuong,
  avatars = [],
  onBack,
  onSelectAvatar,
  onUploadAvatar,
  onCreateVideo,
}) {
  const { t } = useNgonNgu();
  const inputTaiLieuRef = useRef(null);
  const inputAvatarRef = useRef(null);

  const {
    danhSachTaiLieu, dangTaiTaiLieu, loiTaiLieu, dangUploadTaiLieu, uploadTaiLieu, xoaMotTaiLieu, suaTenTaiLieu,
    danhSachVideo, dangTaiVideo, loiVideo, xoaMotVideo, taiXuongVideo,
  } = useChuongWorkspace(user, project.id, chuong.id);

  const {
    danhSachKichBan, kichBanMoiNhat, dangTaiKichBan, loiKichBan, dangTaoBangAI, taoTuAI, xoaPhienBan,
  } = useKichBan(user, project.id, chuong.id);

  const [dangChonAvatar, setDangChonAvatar] = useState(false);
  const [dangUploadAvatar, setDangUploadAvatar] = useState(false);
  const [dangTaiXuongVideoId, setDangTaiXuongVideoId] = useState(null);
  const [taiLieuDoiTen, setTaiLieuDoiTen] = useState(null);
  const [dangDoiTenTaiLieu, setDangDoiTenTaiLieu] = useState(false);
  const [loiDoiTenTaiLieu, setLoiDoiTenTaiLieu] = useState('');
  const [hienLichSuKichBan, setHienLichSuKichBan] = useState(false);

  const avatarDaChon = avatars.find((avatar) => avatar.id === chuong.selectedAvatarId) || null;

  const doiAvatar = async (event) => {
    setDangChonAvatar(true);
    await onSelectAvatar?.(chuong.id, event.target.value);
    setDangChonAvatar(false);
  };

  const luuDoiTenTaiLieu = async (tenMoi) => {
    setDangDoiTenTaiLieu(true);
    setLoiDoiTenTaiLieu('');
    const { error } = await suaTenTaiLieu(taiLieuDoiTen.id, tenMoi);
    setDangDoiTenTaiLieu(false);
    if (error) {
      setLoiDoiTenTaiLieu(error.message || t('chapterDetailPage.errors.actionFailed'));
      return { error };
    }
    return { error: null };
  };

  const xuLyUploadTaiLieu = (event) => {
    Array.from(event.target.files || []).forEach((file) => uploadTaiLieu(file));
    event.target.value = '';
  };

  const xuLyUploadAvatar = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !onUploadAvatar) return;
    setDangUploadAvatar(true);
    await Promise.all(files.map((file) => onUploadAvatar(file)));
    setDangUploadAvatar(false);
  };

  const taiXuongMotVideo = async (video) => {
    setDangTaiXuongVideoId(video.id);
    const { data, error } = await taiXuongVideo(video.id) || {};
    setDangTaiXuongVideoId(null);
    if (error || !data?.url) return;
    const lienKet = document.createElement('a');
    lienKet.href = data.url;
    lienKet.download = `${video.name}.${(video.format || 'mp4').toLowerCase()}`;
    document.body.appendChild(lienKet);
    lienKet.click();
    document.body.removeChild(lienKet);
  };

  return (
    <main className="chapter-detail-page">
      <div className="chapter-detail-topline">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} /> {t('chapterDetailPage.back', { name: project.name })}
        </button>
      </div>

      <section className="chapter-detail-hero">
        <div>
          <span className="chapter-detail-eyebrow">{t('chapterDetailPage.eyebrow')}</span>
          <h1>{chuong.name}</h1>
          {chuong.description && <p>{chuong.description}</p>}
        </div>
        <div className="chapter-detail-hero-side">
          <span className={`chapter-status ${chuong.status}`}>{t(TRANG_THAI_CHUONG[chuong.status])}</span>
          <button type="button" className="chapter-create-video-button" onClick={onCreateVideo}>
            <Play size={15} fill="currentColor" /> {t('projectDetailPage.createVideo')}
          </button>
        </div>
      </section>

      <div className="chapter-detail-overview">
        <CardMuc
          icon={FileText}
          title={t('chapterDetailPage.steps.documents')}
          action={(
            <button type="button" className="chapter-inline-upload" disabled={dangUploadTaiLieu} onClick={() => inputTaiLieuRef.current?.click()}>
              {dangUploadTaiLieu ? <LoaderCircle size={13} className="chapter-spin" /> : <UploadCloud size={13} />}
              {t('chapterDetailPage.steps.uploadDocument')}
            </button>
          )}
        >
          {loiTaiLieu && <p className="chapter-step-error"><CircleAlert size={13} /> {loiTaiLieu}</p>}
          {dangTaiTaiLieu ? (
            <div className="chapter-step-loading"><LoaderCircle size={16} className="chapter-spin" /></div>
          ) : danhSachTaiLieu.length > 0 ? (
            <ul className="chapter-file-list">
              {danhSachTaiLieu.map((taiLieu) => (
                <li key={taiLieu.id}>
                  <span className="chapter-file-icon"><FileText size={14} /></span>
                  <div className="chapter-file-info">
                    <strong>{taiLieu.name}</strong>
                    <small>{dinhDangDungLuong(taiLieu.sizeBytes)}</small>
                  </div>
                  <div className="chapter-file-actions">
                    <button
                      type="button"
                      onClick={() => { setTaiLieuDoiTen(taiLieu); setLoiDoiTenTaiLieu(''); }}
                      aria-label={t('documentsPage.menu.rename')}
                    >
                      <PencilLine size={13} />
                    </button>
                    <button type="button" onClick={() => xoaMotTaiLieu(taiLieu.id)} aria-label={t('documentsPage.menu.delete')}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chapter-step-empty">{t('chapterDetailPage.steps.documentsEmpty')}</p>
          )}
          <input
            ref={inputTaiLieuRef}
            type="file"
            multiple
            hidden
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,application/pdf,application/msword,text/plain,text/markdown"
            onChange={xuLyUploadTaiLieu}
          />
        </CardMuc>

        <CardMuc
          icon={FileText}
          title={t('chapterDetailPage.steps.script')}
          action={(
            <div className="chapter-script-actions">
              <button
                type="button"
                className="chapter-inline-upload"
                disabled={dangTaoBangAI}
                onClick={taoTuAI}
              >
                {dangTaoBangAI ? <LoaderCircle size={13} className="chapter-spin" /> : <Bot size={13} />}
                {t('chapterDetailPage.steps.generateWithAI')}
              </button>
              {danhSachKichBan.length > 1 && (
                <button
                  type="button"
                  className="chapter-inline-upload"
                  onClick={() => setHienLichSuKichBan((hienTai) => !hienTai)}
                >
                  <History size={13} />
                  {t('chapterDetailPage.steps.scriptHistory', { count: danhSachKichBan.length })}
                  {hienLichSuKichBan ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              )}
            </div>
          )}
        >
          {loiKichBan && <p className="chapter-step-error"><CircleAlert size={13} /> {loiKichBan}</p>}
          {dangTaiKichBan ? (
            <div className="chapter-step-loading"><LoaderCircle size={16} className="chapter-spin" /></div>
          ) : kichBanMoiNhat ? (
            <>
              <p className="chapter-script-view">{kichBanMoiNhat.content}</p>
              <p className="chapter-script-meta">
                {t('chapterDetailPage.steps.scriptVersion', { version: kichBanMoiNhat.version })}
                {' • '}
                {t('chapterDetailPage.steps.scriptWordCount', { count: kichBanMoiNhat.wordCount })}
              </p>
            </>
          ) : chuong.script ? (
            <p className="chapter-script-view">{chuong.script}</p>
          ) : (
            <p className="chapter-step-empty">{t('chapterDetailPage.steps.scriptEmpty')}</p>
          )}

          {hienLichSuKichBan && danhSachKichBan.length > 1 && (
            <ul className="chapter-script-history">
              {danhSachKichBan.slice(1).map((kichBan) => (
                <li key={kichBan.id}>
                  <div>
                    <strong>{t('chapterDetailPage.steps.scriptVersion', { version: kichBan.version })}</strong>
                    <p>{kichBan.content}</p>
                  </div>
                  <button type="button" onClick={() => xoaPhienBan(kichBan.id)} aria-label={t('chapterPage.menu.delete')}>
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardMuc>

        <CardMuc
          icon={UserRound}
          title={t('chapterDetailPage.steps.avatar')}
          action={(
            <button type="button" className="chapter-inline-upload" disabled={dangUploadAvatar} onClick={() => inputAvatarRef.current?.click()}>
              {dangUploadAvatar ? <LoaderCircle size={13} className="chapter-spin" /> : <UploadCloud size={13} />}
              {t('chapterDetailPage.steps.addAvatar')}
            </button>
          )}
        >
          <div className="chapter-selected-row">
            {avatarDaChon ? (
              <div className="chapter-selected-preview">
                {avatarDaChon.fileUrl ? <img src={avatarDaChon.fileUrl} alt={avatarDaChon.name} /> : <span className="chapter-avatar-placeholder"><UserRound size={16} /></span>}
                <strong>{avatarDaChon.name}</strong>
              </div>
            ) : (
              <span className="chapter-selected-empty">{t('chapterDetailPage.steps.avatarNone')}</span>
            )}
            <select value={chuong.selectedAvatarId || ''} disabled={dangChonAvatar} onChange={doiAvatar}>
              <option value="">{t('chapterDetailPage.steps.avatarNone')}</option>
              {avatars.map((avatar) => (
                <option value={avatar.id} key={avatar.id}>{avatar.name}</option>
              ))}
            </select>
          </div>
          {avatars.length === 0 && <p className="chapter-step-note">{t('chapterDetailPage.steps.avatarEmpty')}</p>}
          <input
            ref={inputAvatarRef}
            type="file"
            multiple
            hidden
            accept="image/png,image/jpeg,image/webp"
            onChange={xuLyUploadAvatar}
          />
        </CardMuc>

        <CardMuc icon={Video} title={t('chapterDetailPage.steps.video')}>
          {loiVideo && <p className="chapter-step-error"><CircleAlert size={13} /> {loiVideo}</p>}
          {dangTaiVideo ? (
            <div className="chapter-step-loading"><LoaderCircle size={16} className="chapter-spin" /></div>
          ) : danhSachVideo.length > 0 ? (
            <ul className="chapter-file-list">
              {danhSachVideo.map((video) => (
                <li key={video.id}>
                  <span className="chapter-file-icon"><Video size={14} /></span>
                  <div className="chapter-file-info">
                    <strong>{video.name}</strong>
                    <small>{video.resolution || '—'} · {dinhDangDungLuong(video.sizeBytes)}</small>
                  </div>
                  <div className="chapter-file-actions">
                    <button type="button" disabled={dangTaiXuongVideoId === video.id} onClick={() => taiXuongMotVideo(video)} aria-label={t('videoPage.menu.download')}>
                      <Download size={13} />
                    </button>
                    <button type="button" onClick={() => xoaMotVideo(video.id)} aria-label={t('videoPage.menu.delete')}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="chapter-step-empty">{t('chapterDetailPage.steps.videoEmpty')}</p>
          )}
        </CardMuc>
      </div>

      {taiLieuDoiTen && (
        <ModalDoiTenTaiLieu
          taiLieu={taiLieuDoiTen}
          dangLuu={dangDoiTenTaiLieu}
          loiLuu={loiDoiTenTaiLieu}
          onClose={() => setTaiLieuDoiTen(null)}
          onSave={luuDoiTenTaiLieu}
        />
      )}
    </main>
  );
}

export default TrangChiTietChuong;
