import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Download,
  FileText,
  Loader2,
  Mars,
  Pause,
  Play,
  Sparkles,
  UploadCloud,
  UserRound,
  Venus,
  Video as VideoIcon,
  Volume2,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useChuongWorkspace from '../flows/useChuongWorkspace';
import useKichBan from '../flows/useKichBan';
import useTtsGiongDoc from '../flows/useTtsGiongDoc';
import useRealtimeLamMoi from '../flows/useRealtimeLamMoi';
import {
  capNhatVideoJob, layUrlPptx, layVideoJob, taoVideoJob,
} from '../database/videoJob';
import { goiWebhookTaoVideo } from '../services/makeWebhook';
import '../styles/tao-video-ai.css';

const VUNG_MIEN = [
  { id: 'all', labelKey: 'videoGeneratorPage.voice.regionAll' },
  { id: 'north', labelKey: 'videoGeneratorPage.voice.regionNorth' },
  { id: 'central', labelKey: 'videoGeneratorPage.voice.regionCentral' },
  { id: 'south', labelKey: 'videoGeneratorPage.voice.regionSouth' },
];

const NHAN_VUNG_MIEN_THEO_GIONG = {
  north: 'videoGeneratorPage.voice.regionNorth',
  central: 'videoGeneratorPage.voice.regionCentral',
  south: 'videoGeneratorPage.voice.regionSouth',
};

const TEMPLATE_VIDEO = [
  { id: 'basic', labelKey: 'createProjectPage.templates.basic' },
  { id: 'presentation', labelKey: 'createProjectPage.templates.presentation' },
  { id: 'social', labelKey: 'createProjectPage.templates.social' },
  { id: 'training', labelKey: 'createProjectPage.templates.training' },
];

// stage khop cot video_jobs.stage; 'prepare' chi ton tai o web (chua co job).
const CAC_BUOC_RENDER = [
  { stage: 'prepare', labelKey: 'videoGeneratorPage.progress.prepare' },
  { stage: 'script', labelKey: 'videoGeneratorPage.progress.generateScript' },
  { stage: 'voice', labelKey: 'videoGeneratorPage.progress.generateVoice' },
  { stage: 'avatar', labelKey: 'videoGeneratorPage.progress.animateAvatar' },
  { stage: 'merge', labelKey: 'videoGeneratorPage.progress.mergeVideo' },
  { stage: 'save', labelKey: 'videoGeneratorPage.progress.saveResult' },
];

function uocLuongThoiLuong(script) {
  const soTu = (script || '').trim().split(/\s+/).filter(Boolean).length;
  if (!soTu) return 0;
  return Math.round((soTu / 150) * 60);
}

function dinhDangThoiLuong(giay) {
  const phut = Math.floor(giay / 60);
  const giayConLai = giay % 60;
  return `${String(phut).padStart(2, '0')}:${String(giayConLai).padStart(2, '0')}`;
}

function TrinhPhatAudio({ url }) {
  const audioRef = useRef(null);
  const [dangPhat, setDangPhat] = useState(false);
  const [thoiGianHienTai, setThoiGianHienTai] = useState(0);
  const [thoiLuong, setThoiLuong] = useState(0);

  useEffect(() => {
    setDangPhat(false);
    setThoiGianHienTai(0);
    setThoiLuong(0);
  }, [url]);

  const batTat = () => {
    if (!audioRef.current) return;
    if (dangPhat) audioRef.current.pause();
    else audioRef.current.play();
  };

  const tiLe = thoiLuong > 0 ? (thoiGianHienTai / thoiLuong) * 100 : 0;

  return (
    <div className="video-gen-audio-player">
      <button type="button" onClick={batTat} aria-label={dangPhat ? 'Pause' : 'Play'}>
        {dangPhat ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
      </button>
      <div className="video-gen-audio-track">
        <span style={{ width: `${tiLe}%` }} />
      </div>
      <span className="video-gen-audio-time">{dinhDangThoiLuong(Math.round(thoiGianHienTai))}</span>
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <audio
        ref={audioRef}
        src={url}
        onPlay={() => setDangPhat(true)}
        onPause={() => setDangPhat(false)}
        onEnded={() => setDangPhat(false)}
        onTimeUpdate={(event) => setThoiGianHienTai(event.target.currentTime)}
        onLoadedMetadata={(event) => setThoiLuong(event.target.duration || 0)}
        hidden
      />
    </div>
  );
}

function BuocTab({ soThuTu, label, dangChon, daXong }) {
  return (
    <div className={`video-gen-tab ${dangChon ? 'active' : ''} ${daXong ? 'done' : ''}`}>
      <span>{daXong ? <Check size={12} /> : soThuTu}</span>
      {label}
    </div>
  );
}

function TrangTaoVideoAI({
  user,
  project,
  chuong,
  avatars = [],
  onBack,
  onSaveVoiceConfig,
  onSelectAvatar,
  onUploadAvatar,
}) {
  const { t } = useNgonNgu();
  const {
    danhSachTaiLieu, dangTaiTaiLieu, uploadTaiLieu, dangUploadTaiLieu,
  } = useChuongWorkspace(user, project.id, chuong.id);
  const {
    kichBanMoiNhat,
  } = useKichBan(user, project.id, chuong.id);
  const {
    danhSachGiong, dangTaiGiong, loiTaiGiong,
    dangTaoAudio, loiTaoAudio, audioUrl, taoAmThanhThuNghiem,
  } = useTtsGiongDoc(user, project.id, chuong.id);

  const [buoc, setBuoc] = useState('content');
  const [gioiTinhGiong, setGioiTinhGiong] = useState('male');
  const [vungMien, setVungMien] = useState('all');
  const [giongId, setGiongId] = useState('');
  const [dongBoKhauHinh, setDongBoKhauHinh] = useState(true);
  const [dangLuuGiong, setDangLuuGiong] = useState(false);

  const [template, setTemplate] = useState(project.template || 'basic');
  const [tyLe, setTyLe] = useState(project.aspectRatio || '16:9');
  const [doPhanGiai, setDoPhanGiai] = useState(project.resolution || '1080p');
  const [fps, setFps] = useState('30');
  const [hienPhuDe, setHienPhuDe] = useState(true);
  const [dungNhacNen, setDungNhacNen] = useState(false);

  const [job, setJob] = useState(null);
  const [loiRender, setLoiRender] = useState('');
  const [ketQuaKichBan, setKetQuaKichBan] = useState(null);
  const [dangTaiPptx, setDangTaiPptx] = useState(false);

  const [dangChonAvatar, setDangChonAvatar] = useState(false);
  const [dangUploadAvatar, setDangUploadAvatar] = useState(false);
  const inputTaiLieuRef = useRef(null);
  const inputAvatarRef = useRef(null);

  const avatarDaChon = avatars.find((avatar) => avatar.id === chuong.selectedAvatarId) || null;
  const [taiLieuDaChon, setTaiLieuDaChon] = useState([]);
  const taiLieuHopLe = taiLieuDaChon.filter((id) => danhSachTaiLieu.some((tl) => tl.id === id));
  const coTaiLieu = taiLieuHopLe.length > 0;
  const chonTaiLieu = (id) => setTaiLieuDaChon((hienTai) => (
    hienTai.includes(id) ? hienTai.filter((x) => x !== id) : [...hienTai, id]
  ));
  const noiDungKichBan = kichBanMoiNhat?.content || chuong.script || '';
  const coKichBan = Boolean(noiDungKichBan.trim());
  const coAvatar = Boolean(avatarDaChon);

  const [anhAvatarLoi, setAnhAvatarLoi] = useState(false);
  useEffect(() => {
    setAnhAvatarLoi(false);
  }, [avatarDaChon?.fileUrl]);
  const duDieuKienCoBan = coTaiLieu && coAvatar;
  const thoiLuongDuKien = useMemo(() => uocLuongThoiLuong(noiDungKichBan), [noiDungKichBan]);

  const giongDaLoc = useMemo(() => danhSachGiong.filter((giong) => (
    giong.gender === gioiTinhGiong && (vungMien === 'all' || giong.region === vungMien)
  )), [danhSachGiong, gioiTinhGiong, vungMien]);
  const giongDaChon = giongDaLoc.find((giong) => giong.id === giongId) || null;

  const jobId = job?.id;
  const trangThaiJob = job?.status;
  const lamMoiJob = useCallback(async () => {
    if (!jobId) return;
    const { data } = await layVideoJob(jobId);
    if (data) setJob(data);
  }, [jobId]);

  useRealtimeLamMoi('video_jobs', jobId ? `id=eq.${jobId}` : null, lamMoiJob);

  useEffect(() => {
    if (buoc !== 'progress' || !jobId || trangThaiJob !== 'running') return undefined;
    const timerId = setInterval(lamMoiJob, 5000);
    return () => clearInterval(timerId);
  }, [buoc, jobId, trangThaiJob, lamMoiJob]);

  useEffect(() => {
    if (buoc !== 'progress' || trangThaiJob !== 'completed') return undefined;
    const timerId = setTimeout(() => setBuoc('result'), 600);
    return () => clearTimeout(timerId);
  }, [buoc, trangThaiJob]);

  // Make (qua generate-script) tu ghi kich ban moi vao bang scripts sau khi
  // xong buoc 'script'; kichBanMoiNhat tu cap nhat qua Realtime (useKichBan),
  // chi hien len khi job da qua buoc do de tranh hien nham kich ban cu.
  useEffect(() => {
    if (buoc !== 'progress' || !job || job.stage === 'script' || !kichBanMoiNhat) return;
    setKetQuaKichBan((hienTai) => (hienTai?.id === kichBanMoiNhat.id ? hienTai : kichBanMoiNhat));
  }, [buoc, job, kichBanMoiNhat]);

  const thongDiepLoiRender = loiRender
    || (trangThaiJob === 'failed' ? job.errorMessage || t('videoGeneratorPage.progress.failed') : '');
  const chiSoBuocRender = !job
    ? 0
    : trangThaiJob === 'completed'
      ? CAC_BUOC_RENDER.length
      : Math.max(0, CAC_BUOC_RENDER.findIndex((muc) => muc.stage === job.stage));
  const phanTramRender = Math.round((chiSoBuocRender / CAC_BUOC_RENDER.length) * 100);

  useEffect(() => {
    if (giongDaLoc.length === 0) {
      setGiongId('');
      return;
    }
    if (!giongDaLoc.some((giong) => giong.id === giongId)) {
      setGiongId(giongDaLoc[0].id);
    }
  }, [giongDaLoc, giongId]);

  const luuVaTiepTuc = async (bufoKeTiep) => {
    if (bufoKeTiep === 'confirm' && onSaveVoiceConfig) {
      setDangLuuGiong(true);
      const cauHinhGiong = `VieNeu-TTS:${giongDaChon?.name || giongId}`;
      await onSaveVoiceConfig(chuong.id, cauHinhGiong);
      setDangLuuGiong(false);
    }
    setBuoc(bufoKeTiep);
  };

  const xuLyUploadTaiLieuContent = (event) => {
    Array.from(event.target.files || []).forEach((file) => uploadTaiLieu(file));
    event.target.value = '';
  };

  const doiAvatarContent = async (event) => {
    setDangChonAvatar(true);
    await onSelectAvatar?.(chuong.id, event.target.value);
    setDangChonAvatar(false);
  };

  const xuLyUploadAvatarContent = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length || !onUploadAvatar) return;
    setDangUploadAvatar(true);
    await Promise.all(files.map((file) => onUploadAvatar(file)));
    setDangUploadAvatar(false);
  };

  const ngheThu = () => {
    const doanMau = coKichBan
      ? noiDungKichBan.trim().split(/\s+/).slice(0, 60).join(' ')
      : t('videoGeneratorPage.voice.sampleText');
    taoAmThanhThuNghiem(doanMau, giongId);
  };

  const baoLoiRender = async (id, thongDiep) => {
    setLoiRender(thongDiep);
    await capNhatVideoJob(id, { status: 'failed', error_message: thongDiep });
  };

  const batDauRender = async () => {
    setBuoc('progress');
    setJob(null);
    setLoiRender('');
    setKetQuaKichBan(null);

    const { data: jobMoi, error: loiJob } = await taoVideoJob(user, chuong.id);
    if (loiJob) {
      setLoiRender(loiJob.message || t('videoGeneratorPage.progress.failed'));
      return;
    }
    setJob(jobMoi);

    // Khong tu tao kich ban o web nua - Make se goi generate-script (doc tai
    // lieu + Ollama) ngay khi nhan webhook, roi tu chay tiep TTS/avatar/render
    // mot mach. Kich ban moi se tu hien len (xem effect Realtime o tren) khi
    // Make cap nhat xong buoc 'script'.
    const { error: loiWebhook } = await goiWebhookTaoVideo({
      jobId: jobMoi.id,
      userId: user?.id,
      documentIds: taiLieuHopLe,
      chapterId: chuong.id,
      chapterName: chuong.name,
      projectName: project.name,
      voiceId: giongDaChon?.id,
      voiceName: giongDaChon?.name,
      avatarImageUrl: avatarDaChon?.fileUrl,
      template,
      aspectRatio: tyLe,
      resolution: doPhanGiai,
      fps,
      subtitles: hienPhuDe,
      backgroundMusic: dungNhacNen,
    });

    if (loiWebhook) {
      // Make co the tra loi muon/timeout du van dang chay -> chi coi la that bai
      // neu Make chua he cap nhat tien trinh (job van o buoc dau sau khi gui).
      const { data: jobHienTai } = await layVideoJob(jobMoi.id);
      if (!jobHienTai || (jobHienTai.stage === 'script' && jobHienTai.status === 'running')) {
        await baoLoiRender(jobMoi.id, loiWebhook.message);
      }
    }
  };

  const taiPptx = async () => {
    if (!job?.pptxPath) return;
    setDangTaiPptx(true);
    const { data } = await layUrlPptx(job.pptxPath);
    setDangTaiPptx(false);
    if (data?.url) window.open(data.url, '_blank', 'noopener');
  };

  return (
    <main className="video-gen-page">
      <div className="video-gen-topline">
        <button type="button" onClick={onBack}>
          <ArrowLeft size={17} /> {t('videoGeneratorPage.back', { name: chuong.name })}
        </button>
      </div>

      <div className="video-gen-title">
        <h1><Sparkles size={17} /> {t('videoGeneratorPage.title')}</h1>
        <p>{project.name} <span>›</span> {chuong.name}</p>
      </div>

      {['content', 'voice', 'config', 'confirm'].includes(buoc) && (
        <div className="video-gen-tabs">
          <BuocTab soThuTu={1} label={t('videoGeneratorPage.tabs.content')} dangChon={buoc === 'content'} daXong={['voice', 'config', 'confirm'].includes(buoc)} />
          <BuocTab soThuTu={2} label={t('videoGeneratorPage.tabs.voice')} dangChon={buoc === 'voice'} daXong={['config', 'confirm'].includes(buoc)} />
          <BuocTab soThuTu={3} label={t('videoGeneratorPage.tabs.config')} dangChon={buoc === 'config'} daXong={buoc === 'confirm'} />
          <BuocTab soThuTu={4} label={t('videoGeneratorPage.tabs.confirm')} dangChon={buoc === 'confirm'} daXong={false} />
        </div>
      )}

      {buoc === 'content' && (
        <section className="video-gen-card">
          <h2 className="video-gen-card-title">{t('videoGeneratorPage.content.title')}</h2>

          {dangTaiTaiLieu ? (
            <div aria-live="polite" aria-label={t('common.loading')}>
              <div className="skeleton skeleton-text" style={{ width: '70%' }} aria-hidden="true" />
              <div className="skeleton skeleton-text" style={{ width: '55%' }} aria-hidden="true" />
              <div className="skeleton skeleton-text" style={{ width: '60%' }} aria-hidden="true" />
            </div>
          ) : (
            <>
              {!duDieuKienCoBan && (
                <div className="video-gen-warning">
                  <p><CircleAlert size={15} /> {t('videoGeneratorPage.content.notEnough')}</p>
                  <ul>
                    <li className={coTaiLieu ? 'ok' : ''}>{coTaiLieu ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingDocuments')}</li>
                    <li className={coAvatar ? 'ok' : ''}>{coAvatar ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingAvatar')}</li>
                  </ul>
                </div>
              )}

              <div className="video-gen-check-row">
                <span className="video-gen-check-icon"><FileText size={16} /></span>
                <div className="video-gen-select-block">
                  <div className="video-gen-select-head">
                    <strong>{t('chapterDetailPage.steps.documents')}</strong>
                    <button type="button" className="video-gen-script-generate" disabled={dangUploadTaiLieu} onClick={() => inputTaiLieuRef.current?.click()}>
                      {dangUploadTaiLieu ? <Loader2 size={12} className="video-gen-spin" /> : <UploadCloud size={12} />}
                      {t('videoGeneratorPage.content.uploadDocument')}
                    </button>
                  </div>
                  {danhSachTaiLieu.length > 0 ? (
                    <ul className="video-gen-document-list">
                      {danhSachTaiLieu.map((tl) => (
                        <li key={tl.id}>
                          <label className={taiLieuDaChon.includes(tl.id) ? 'selected' : ''}>
                            <input
                              type="checkbox"
                              checked={taiLieuDaChon.includes(tl.id)}
                              onChange={() => chonTaiLieu(tl.id)}
                            />
                            <span>{tl.name}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="video-gen-script-empty">{t('videoGeneratorPage.content.missingDocuments')}</p>
                  )}
                  <input
                    ref={inputTaiLieuRef}
                    type="file"
                    multiple
                    hidden
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.md,application/pdf,application/msword,text/plain,text/markdown"
                    onChange={xuLyUploadTaiLieuContent}
                  />
                </div>
              </div>

              <div className="video-gen-check-row">
                <span className="video-gen-check-icon">
                  {avatarDaChon?.fileUrl && !anhAvatarLoi ? (
                    <img src={avatarDaChon.fileUrl} alt={avatarDaChon.name} onError={() => setAnhAvatarLoi(true)} />
                  ) : (
                    <UserRound size={16} />
                  )}
                </span>
                <div className="video-gen-select-block">
                  <div className="video-gen-select-head">
                    <strong>{t('chapterDetailPage.steps.avatar')}</strong>
                    <button type="button" className="video-gen-script-generate" disabled={dangUploadAvatar} onClick={() => inputAvatarRef.current?.click()}>
                      {dangUploadAvatar ? <Loader2 size={12} className="video-gen-spin" /> : <UploadCloud size={12} />}
                      {t('videoGeneratorPage.content.uploadAvatar')}
                    </button>
                  </div>
                  <select value={chuong.selectedAvatarId || ''} disabled={dangChonAvatar} onChange={doiAvatarContent}>
                    <option value="">{t('videoGeneratorPage.content.avatarNone')}</option>
                    {avatars.map((avatar) => (
                      <option value={avatar.id} key={avatar.id}>{avatar.name}</option>
                    ))}
                  </select>
                  <input
                    ref={inputAvatarRef}
                    type="file"
                    multiple
                    hidden
                    accept="image/png,image/jpeg,image/webp"
                    onChange={xuLyUploadAvatarContent}
                  />
                </div>
              </div>

              <div className="video-gen-actions">
                <button
                  type="button"
                  className="primary"
                  disabled={!duDieuKienCoBan}
                  title={!duDieuKienCoBan ? t('videoGeneratorPage.content.notEnough') : undefined}
                  onClick={() => setBuoc('voice')}
                >
                  {t('videoGeneratorPage.continue')}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {buoc === 'voice' && (
        <section className="video-gen-card">
          <h2 className="video-gen-card-title">{t('videoGeneratorPage.voice.title')}</h2>

          {loiTaiGiong && <p className="video-gen-script-error"><CircleAlert size={13} /> {loiTaiGiong}</p>}

          <p className="video-gen-field-label">{t('videoGeneratorPage.voice.gender')}</p>
          <div className="video-gen-gender-toggle">
            <button type="button" className={gioiTinhGiong === 'male' ? 'active' : ''} onClick={() => setGioiTinhGiong('male')}>
              <Mars size={14} /> {t('videoGeneratorPage.voice.male')}
            </button>
            <button type="button" className={gioiTinhGiong === 'female' ? 'active' : ''} onClick={() => setGioiTinhGiong('female')}>
              <Venus size={14} /> {t('videoGeneratorPage.voice.female')}
            </button>
          </div>

          <p className="video-gen-field-label">{t('videoGeneratorPage.voice.region')}</p>
          <div className="video-gen-region-toggle">
            {VUNG_MIEN.map(({ id, labelKey }) => (
              <button type="button" key={id} className={vungMien === id ? 'active' : ''} onClick={() => setVungMien(id)}>
                {t(labelKey)}
              </button>
            ))}
          </div>

          <p className="video-gen-field-label">{t('videoGeneratorPage.voice.voice')}</p>
          <div className="video-gen-voice-picker">
            <select
              className="video-gen-voice-select"
              value={giongId}
              disabled={dangTaiGiong || giongDaLoc.length === 0}
              onChange={(event) => setGiongId(event.target.value)}
            >
              {giongDaLoc.length === 0 && <option value="">{t('videoGeneratorPage.voice.noVoice')}</option>}
              {giongDaLoc.map((giong) => <option value={giong.id} key={giong.id}>{giong.name}</option>)}
            </select>
            <ChevronDown size={14} className="video-gen-voice-caret" />
            {giongDaChon && (
              <p className="video-gen-voice-meta">
                {t(`videoGeneratorPage.voice.${giongDaChon.gender}`)}
                {NHAN_VUNG_MIEN_THEO_GIONG[giongDaChon.region] && ` • ${t(NHAN_VUNG_MIEN_THEO_GIONG[giongDaChon.region])}`}
              </p>
            )}
          </div>

          {loiTaoAudio && <p className="video-gen-script-error"><CircleAlert size={13} /> {loiTaoAudio}</p>}

          <div className="video-gen-generate-row">
            <button
              type="button"
              className="video-gen-generate-button"
              disabled={!giongId || dangTaoAudio}
              onClick={ngheThu}
            >
              {dangTaoAudio ? <Loader2 size={14} className="video-gen-spin" /> : <Volume2 size={14} />}
              {t('videoGeneratorPage.voice.generate')}
            </button>
          </div>

          {audioUrl && <TrinhPhatAudio url={audioUrl} />}

          <label className="video-gen-checkbox">
            <input type="checkbox" checked={dongBoKhauHinh} onChange={(event) => setDongBoKhauHinh(event.target.checked)} />
            {t('videoGeneratorPage.voice.lipSync')}
          </label>

          <div className="video-gen-actions">
            <button type="button" className="ghost" onClick={() => setBuoc('content')}>{t('videoGeneratorPage.back2')}</button>
            <button
              type="button"
              className="primary"
              disabled={!giongId}
              onClick={() => luuVaTiepTuc('config')}
            >
              {t('videoGeneratorPage.continue')}
            </button>
          </div>
        </section>
      )}

      {buoc === 'config' && (
        <section className="video-gen-config-layout">
          <div className="video-gen-card">
            <h2 className="video-gen-card-title">{t('videoGeneratorPage.config.title')}</h2>
            <div className="video-gen-form-grid">
              <label>
                <span>{t('createProjectPage.basic.template')}</span>
                <select value={template} onChange={(event) => setTemplate(event.target.value)}>
                  {TEMPLATE_VIDEO.map(({ id, labelKey }) => <option value={id} key={id}>{t(labelKey)}</option>)}
                </select>
              </label>
              <label>
                <span>{t('createProjectPage.defaults.ratio')}</span>
                <select value={tyLe} onChange={(event) => setTyLe(event.target.value)}>
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </label>
              <label>
                <span>{t('createProjectPage.defaults.resolution')}</span>
                <select value={doPhanGiai} onChange={(event) => setDoPhanGiai(event.target.value)}>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="2160p">2160p (4K)</option>
                </select>
              </label>
              <label>
                <span>FPS</span>
                <select value={fps} onChange={(event) => setFps(event.target.value)}>
                  <option value="24">24</option>
                  <option value="30">30</option>
                  <option value="60">60</option>
                </select>
              </label>
            </div>

            <label className="video-gen-checkbox">
              <input type="checkbox" checked={hienPhuDe} onChange={(event) => setHienPhuDe(event.target.checked)} />
              {t('videoGeneratorPage.config.subtitles')}
            </label>
            <label className="video-gen-checkbox">
              <input type="checkbox" checked={dungNhacNen} onChange={(event) => setDungNhacNen(event.target.checked)} />
              {t('videoGeneratorPage.config.backgroundMusic')}
            </label>

            <div className="video-gen-actions">
              <button type="button" className="ghost" onClick={() => setBuoc('voice')}>{t('videoGeneratorPage.back2')}</button>
              <button type="button" className="primary" onClick={() => luuVaTiepTuc('confirm')}>{t('videoGeneratorPage.continue')}</button>
            </div>
          </div>

          <div className={`video-gen-preview ratio-${tyLe.replace(':', '-')}`}>
            <div className="video-gen-preview-frame">
              <span className="video-gen-preview-text">{t('videoGeneratorPage.config.previewContent')}</span>
              <span className="video-gen-preview-avatar"><UserRound size={18} /></span>
              {hienPhuDe && <span className="video-gen-preview-subtitle">{t('videoGeneratorPage.config.previewSubtitle')}</span>}
            </div>
          </div>
        </section>
      )}

      {buoc === 'confirm' && (
        <section className="video-gen-card">
          <h2 className="video-gen-card-title">{t('videoGeneratorPage.confirm.title')}</h2>

          <dl className="video-gen-summary">
            <div><dt>{t('videoGeneratorPage.confirm.project')}</dt><dd>{project.name}</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.chapter')}</dt><dd>{chuong.name}</dd></div>
            <div><dt>{t('chapterDetailPage.steps.documents')}</dt><dd>{t('videoGeneratorPage.confirm.fileCount', { count: taiLieuHopLe.length })}</dd></div>
            <div><dt>{t('chapterDetailPage.steps.avatar')}</dt><dd>{avatarDaChon?.name}</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.voice')}</dt><dd>{giongDaChon?.name || giongId}</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.video')}</dt><dd>{doPhanGiai} • {tyLe} • {fps} FPS</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.estimatedDuration')}</dt><dd>{thoiLuongDuKien ? dinhDangThoiLuong(thoiLuongDuKien) : '—'}</dd></div>
          </dl>

          <div className="video-gen-actions">
            <button type="button" className="ghost" onClick={() => setBuoc('config')}>{t('videoGeneratorPage.back2')}</button>
            <button type="button" className="primary start" disabled={dangLuuGiong} onClick={batDauRender}>
              <Sparkles size={15} /> {t('videoGeneratorPage.confirm.start')}
            </button>
          </div>
        </section>
      )}

      {buoc === 'progress' && (
        <section className="video-gen-card video-gen-progress-card">
          <h2 className="video-gen-card-title">{t('videoGeneratorPage.progress.title')}</h2>
          <p className="video-gen-progress-chapter">{chuong.name}</p>

          <div className="video-gen-progress-track">
            <span style={{ width: `${phanTramRender}%` }} />
          </div>
          <p className="video-gen-progress-percent">{phanTramRender}%</p>
          {thongDiepLoiRender ? (
            <p className="video-gen-script-error"><CircleAlert size={15} /> {thongDiepLoiRender}</p>
          ) : (
            <p className="video-gen-progress-current">
              <Loader2 size={13} className="video-gen-spin" /> {t(CAC_BUOC_RENDER[Math.min(chiSoBuocRender, CAC_BUOC_RENDER.length - 1)].labelKey)}
            </p>
          )}

          <ul className="video-gen-progress-steps">
            {CAC_BUOC_RENDER.map(({ stage, labelKey }, chiSo) => {
              const daXong = chiSo < chiSoBuocRender;
              const dangChay = chiSo === chiSoBuocRender;
              return (
                <li key={stage} className={daXong ? 'done' : dangChay ? 'active' : ''}>
                  {daXong
                    ? <Check size={13} />
                    : dangChay
                      ? (thongDiepLoiRender ? <CircleAlert size={13} /> : <Loader2 size={13} className="video-gen-spin" />)
                      : <span className="video-gen-dot" />}
                  {t(labelKey)}
                </li>
              );
            })}
          </ul>

          {ketQuaKichBan && (
            <div className="video-gen-script-ready">
              <p><CheckCircle2 size={15} /> {t('videoGeneratorPage.progress.scriptReady', { words: ketQuaKichBan.wordCount, slides: ketQuaKichBan.slides.length })}</p>
              <details>
                <summary>{t('videoGeneratorPage.progress.viewContent')}</summary>
                {ketQuaKichBan.slides.length > 0 && (
                  <ol>
                    {ketQuaKichBan.slides.map((slide, chiSo) => <li key={chiSo}>{slide.title}</li>)}
                  </ol>
                )}
                <pre>{ketQuaKichBan.content}</pre>
              </details>
            </div>
          )}

          {thongDiepLoiRender && (
            <div className="video-gen-actions">
              <button type="button" className="ghost" onClick={() => setBuoc('confirm')}>{t('videoGeneratorPage.back2')}</button>
              <button type="button" className="primary" onClick={batDauRender}>{t('videoGeneratorPage.generatingScript.retry')}</button>
            </div>
          )}
        </section>
      )}

      {buoc === 'result' && (
        <section className="video-gen-card video-gen-result-card">
          <h2 className="video-gen-result-title"><CheckCircle2 size={18} /> {t('videoGeneratorPage.result.title')}</h2>

          <div className="video-gen-result-preview">
            {job?.videoUrl ? (
              <video src={job.videoUrl} controls />
            ) : (
              <span><Play size={28} fill="currentColor" /></span>
            )}
          </div>

          <p className="video-gen-result-chapter">{chuong.name}</p>
          <p className="video-gen-result-meta">{thoiLuongDuKien ? `${dinhDangThoiLuong(thoiLuongDuKien)} • ` : ''}{doPhanGiai} • {tyLe}</p>

          <div className="video-gen-result-actions">
            <button type="button" disabled={!job?.videoUrl} onClick={() => window.open(job.videoUrl, '_blank', 'noopener')}>
              <VideoIcon size={15} /> {t('videoPage.menu.play')}
            </button>
            <button type="button" disabled={!job?.videoUrl} onClick={() => window.open(job.videoUrl, '_blank', 'noopener')}>
              <Download size={15} /> {t('videoPage.menu.download')}
            </button>
            <button type="button" disabled={!job?.pptxPath || dangTaiPptx} onClick={taiPptx}>
              {dangTaiPptx ? <Loader2 size={15} className="video-gen-spin" /> : <FileText size={15} />} {t('videoGeneratorPage.result.downloadPptx')}
            </button>
            <button type="button" className="primary" onClick={onBack}>{t('videoGeneratorPage.content.backToChapter')}</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default TrangTaoVideoAI;
