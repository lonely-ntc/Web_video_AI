import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
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
  UserRound,
  Venus,
  Video as VideoIcon,
  Volume2,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useChuongWorkspace from '../flows/useChuongWorkspace';
import useKichBan from '../flows/useKichBan';
import useTtsGiongDoc from '../flows/useTtsGiongDoc';
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

const CAC_BUOC_RENDER = [
  'videoGeneratorPage.progress.prepare',
  'videoGeneratorPage.progress.analyzeDocuments',
  'videoGeneratorPage.progress.generateScript',
  'videoGeneratorPage.progress.generateVoice',
  'videoGeneratorPage.progress.animateAvatar',
  'videoGeneratorPage.progress.mergeVideo',
  'videoGeneratorPage.progress.saveResult',
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
}) {
  const { t } = useNgonNgu();
  const { danhSachTaiLieu, dangTaiTaiLieu } = useChuongWorkspace(user, project.id, chuong.id);
  const {
    kichBanMoiNhat, dangTaiKichBan, dangTaoBangAI, loiKichBan, taoTuAI,
  } = useKichBan(user, project.id, chuong.id);
  const {
    danhSachGiong, dangTaiGiong, loiTaiGiong,
    dangTaoAudio, loiTaoAudio, audioUrl, taoAmThanhThuNghiem,
    amThanhDaXacNhan, dangTaiAmThanhDaXacNhan, dangXacNhanGiong, loiXacNhanGiong, xacNhanGiong,
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

  const [buocRenderHienTai, setBuocRenderHienTai] = useState(0);
  const [phanTramRender, setPhanTramRender] = useState(0);
  const boDemRef = useRef(null);

  const avatarDaChon = avatars.find((avatar) => avatar.id === chuong.selectedAvatarId) || null;
  const coTaiLieu = danhSachTaiLieu.length > 0;
  const noiDungKichBan = kichBanMoiNhat?.content || chuong.script || '';
  const coKichBan = Boolean(noiDungKichBan.trim());
  const coAvatar = Boolean(avatarDaChon);
  const duDieuKienCoBan = coTaiLieu && coAvatar;
  const thoiLuongDuKien = useMemo(() => uocLuongThoiLuong(noiDungKichBan), [noiDungKichBan]);

  const giongDaLoc = useMemo(() => danhSachGiong.filter((giong) => (
    giong.gender === gioiTinhGiong && (vungMien === 'all' || giong.region === vungMien)
  )), [danhSachGiong, gioiTinhGiong, vungMien]);
  const giongDaChon = giongDaLoc.find((giong) => giong.id === giongId) || null;
  const giongDaXacNhanKhopHienTai = Boolean(amThanhDaXacNhan) && amThanhDaXacNhan.voiceId === giongId;

  useEffect(() => () => clearInterval(boDemRef.current), []);

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
      const cauHinhGiong = `VieNeu-TTS:${amThanhDaXacNhan?.voiceName || giongId}`;
      await onSaveVoiceConfig(chuong.id, cauHinhGiong);
      setDangLuuGiong(false);
    }
    setBuoc(bufoKeTiep);
  };

  const ngheThu = () => {
    const doanMau = noiDungKichBan.trim().split(/\s+/).slice(0, 60).join(' ');
    taoAmThanhThuNghiem(doanMau, giongId);
  };

  const xacNhan = () => {
    if (!giongDaChon) return;
    xacNhanGiong(noiDungKichBan, {
      voiceId: giongDaChon.id,
      voiceName: giongDaChon.name,
      gender: giongDaChon.gender,
      region: giongDaChon.region,
    });
  };

  const batDauRender = () => {
    setBuoc('progress');
    setBuocRenderHienTai(0);
    setPhanTramRender(0);

    let buocHienTai = 0;
    boDemRef.current = setInterval(() => {
      setPhanTramRender((hienTai) => {
        const tiLeMoiBuoc = 100 / CAC_BUOC_RENDER.length;
        const muc = Math.min(100, hienTai + 4);
        if (muc >= tiLeMoiBuoc * (buocHienTai + 1)) {
          buocHienTai = Math.min(CAC_BUOC_RENDER.length - 1, buocHienTai + 1);
          setBuocRenderHienTai(buocHienTai);
        }
        if (muc >= 100) {
          clearInterval(boDemRef.current);
          setTimeout(() => setBuoc('result'), 500);
        }
        return muc;
      });
    }, 220);
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
          ) : !duDieuKienCoBan ? (
            <div className="video-gen-warning">
              <p><CircleAlert size={15} /> {t('videoGeneratorPage.content.notEnough')}</p>
              <ul>
                <li className={coTaiLieu ? 'ok' : ''}>{coTaiLieu ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingDocuments')}</li>
                <li className={coAvatar ? 'ok' : ''}>{coAvatar ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingAvatar')}</li>
              </ul>
              <button type="button" onClick={onBack}>{t('videoGeneratorPage.content.backToChapter')}</button>
            </div>
          ) : (
            <>
              <div className="video-gen-check-row">
                <span className="video-gen-check-icon"><FileText size={16} /></span>
                <div>
                  <strong>{t('chapterDetailPage.steps.documents')}</strong>
                  <p>{danhSachTaiLieu.slice(0, 1).map((tl) => (
                    <span key={tl.id}><Check size={12} /> {tl.name}</span>
                  ))}{danhSachTaiLieu.length > 1 && ` +${danhSachTaiLieu.length - 1}`}</p>
                </div>
              </div>

              <div className="video-gen-check-row">
                <span className="video-gen-check-icon">
                  {avatarDaChon?.fileUrl ? <img src={avatarDaChon.fileUrl} alt={avatarDaChon.name} /> : <UserRound size={16} />}
                </span>
                <div>
                  <strong>{t('chapterDetailPage.steps.avatar')}</strong>
                  <p><Check size={12} /> {avatarDaChon?.name}</p>
                </div>
              </div>

              <div className="video-gen-check-row">
                <span className="video-gen-check-icon"><Bot size={16} /></span>
                <div className="video-gen-script-block">
                  <strong>{t('chapterDetailPage.steps.script')}</strong>
                  {loiKichBan && <p className="video-gen-script-error"><CircleAlert size={12} /> {loiKichBan}</p>}
                  {dangTaiKichBan ? (
                    <p className="video-gen-script-loading"><Loader2 size={12} className="video-gen-spin" /></p>
                  ) : coKichBan ? (
                    <>
                      <p><Check size={12} /> {t('videoGeneratorPage.content.hasScript')}</p>
                      <small>{t('videoGeneratorPage.content.estimatedDuration', { duration: dinhDangThoiLuong(thoiLuongDuKien) })}</small>
                      <button type="button" className="video-gen-script-generate" disabled={dangTaoBangAI} onClick={taoTuAI}>
                        {dangTaoBangAI ? <Loader2 size={12} className="video-gen-spin" /> : <Bot size={12} />}
                        {t('chapterDetailPage.steps.generateWithAI')}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="video-gen-script-empty">{t('videoGeneratorPage.content.missingScript')}</p>
                      <button type="button" className="video-gen-script-generate" disabled={dangTaoBangAI} onClick={taoTuAI}>
                        {dangTaoBangAI ? <Loader2 size={12} className="video-gen-spin" /> : <Bot size={12} />}
                        {t('chapterDetailPage.steps.generateWithAI')}
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="video-gen-actions">
                <button type="button" className="primary" disabled={!coKichBan} title={!coKichBan ? t('videoGeneratorPage.content.missingScript') : undefined} onClick={() => luuVaTiepTuc('voice')}>
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
              disabled={!giongId || !coKichBan || dangTaoAudio}
              onClick={ngheThu}
            >
              {dangTaoAudio ? <Loader2 size={14} className="video-gen-spin" /> : <Volume2 size={14} />}
              {t('videoGeneratorPage.voice.generate')}
            </button>
          </div>

          {audioUrl && <TrinhPhatAudio url={audioUrl} />}

          {loiXacNhanGiong && <p className="video-gen-script-error"><CircleAlert size={13} /> {loiXacNhanGiong}</p>}

          <div className="video-gen-generate-row">
            {dangTaiAmThanhDaXacNhan ? (
              <Loader2 size={14} className="video-gen-spin" />
            ) : giongDaXacNhanKhopHienTai ? (
              <p className="video-gen-voice-confirmed"><Check size={13} /> {t('videoGeneratorPage.voice.confirmed', { name: amThanhDaXacNhan.voiceName })}</p>
            ) : (
              <button
                type="button"
                className="video-gen-confirm-button"
                disabled={!giongId || !coKichBan || dangXacNhanGiong}
                onClick={xacNhan}
              >
                {dangXacNhanGiong ? <Loader2 size={14} className="video-gen-spin" /> : <Check size={14} />}
                {t('videoGeneratorPage.voice.confirm')}
              </button>
            )}
          </div>

          <label className="video-gen-checkbox">
            <input type="checkbox" checked={dongBoKhauHinh} onChange={(event) => setDongBoKhauHinh(event.target.checked)} />
            {t('videoGeneratorPage.voice.lipSync')}
          </label>

          <div className="video-gen-actions">
            <button type="button" className="ghost" onClick={() => setBuoc('content')}>{t('videoGeneratorPage.back2')}</button>
            <button
              type="button"
              className="primary"
              disabled={!giongDaXacNhanKhopHienTai}
              title={!giongDaXacNhanKhopHienTai ? t('videoGeneratorPage.voice.confirmRequired') : undefined}
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
            <div><dt>{t('chapterDetailPage.steps.documents')}</dt><dd>{t('videoGeneratorPage.confirm.fileCount', { count: danhSachTaiLieu.length })}</dd></div>
            <div><dt>{t('chapterDetailPage.steps.avatar')}</dt><dd>{avatarDaChon?.name}</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.voice')}</dt><dd>{giongDaChon?.name || giongId}</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.video')}</dt><dd>{doPhanGiai} • {tyLe} • {fps} FPS</dd></div>
            <div><dt>{t('videoGeneratorPage.confirm.estimatedDuration')}</dt><dd>{dinhDangThoiLuong(thoiLuongDuKien)}</dd></div>
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
          <p className="video-gen-progress-percent">{Math.round(phanTramRender)}%</p>
          <p className="video-gen-progress-current"><Loader2 size={13} className="video-gen-spin" /> {t(CAC_BUOC_RENDER[buocRenderHienTai])}</p>

          <ul className="video-gen-progress-steps">
            {CAC_BUOC_RENDER.map((buocKey, chiSo) => (
              <li key={buocKey} className={chiSo < buocRenderHienTai ? 'done' : chiSo === buocRenderHienTai ? 'active' : ''}>
                {chiSo < buocRenderHienTai ? <Check size={13} /> : chiSo === buocRenderHienTai ? <Loader2 size={13} className="video-gen-spin" /> : <span className="video-gen-dot" />}
                {t(buocKey)}
              </li>
            ))}
          </ul>
          <p className="video-gen-simulated-note">{t('videoGeneratorPage.progress.simulatedNote')}</p>
        </section>
      )}

      {buoc === 'result' && (
        <section className="video-gen-card video-gen-result-card">
          <h2 className="video-gen-result-title"><CheckCircle2 size={18} /> {t('videoGeneratorPage.result.title')}</h2>

          <div className="video-gen-result-preview">
            <span><Play size={28} fill="currentColor" /></span>
          </div>

          <p className="video-gen-result-chapter">{chuong.name}</p>
          <p className="video-gen-result-meta">{dinhDangThoiLuong(thoiLuongDuKien)} • {doPhanGiai} • {tyLe}</p>
          <p className="video-gen-simulated-note">{t('videoGeneratorPage.result.simulatedNote')}</p>

          <div className="video-gen-result-actions">
            <button type="button" disabled title={t('videoGeneratorPage.result.notAvailable')}>
              <VideoIcon size={15} /> {t('videoPage.menu.play')}
            </button>
            <button type="button" disabled title={t('videoGeneratorPage.result.notAvailable')}>
              <Download size={15} /> {t('videoPage.menu.download')}
            </button>
            <button type="button" className="primary" onClick={onBack}>{t('videoGeneratorPage.content.backToChapter')}</button>
          </div>
        </section>
      )}
    </main>
  );
}

export default TrangTaoVideoAI;
