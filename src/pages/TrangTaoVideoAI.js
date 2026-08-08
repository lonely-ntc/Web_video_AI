import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  Check,
  CheckCircle2,
  CircleAlert,
  Download,
  FileText,
  Loader2,
  Play,
  Sparkles,
  UserRound,
  Video as VideoIcon,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useChuongWorkspace from '../flows/useChuongWorkspace';
import '../styles/tao-video-ai.css';

const NHA_CUNG_CAP = [
  { id: 'openai', label: 'OpenAI', models: ['tts-1', 'tts-1-hd'], voices: ['Alloy', 'Echo', 'Nova', 'Shimmer'] },
  { id: 'elevenlabs', label: 'ElevenLabs', models: ['Multilingual v2', 'Turbo v2'], voices: ['Rachel', 'Adam', 'Bella'] },
  { id: 'google', label: 'Google Cloud TTS', models: ['Neural2', 'Wavenet'], voices: ['Vi-A', 'Vi-B', 'Vi-C'] },
];

const NGON_NGU_GIONG = [
  { id: 'vi', labelKey: 'createProjectPage.languages.vietnamese' },
  { id: 'en', labelKey: 'createProjectPage.languages.english' },
];

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

  const [buoc, setBuoc] = useState('content');
  const [nhaCungCap, setNhaCungCap] = useState(NHA_CUNG_CAP[0].id);
  const [model, setModel] = useState(NHA_CUNG_CAP[0].models[0]);
  const [giong, setGiong] = useState(NHA_CUNG_CAP[0].voices[2]);
  const [ngonNguGiong, setNgonNguGiong] = useState('vi');
  const [tocDo, setTocDo] = useState(1);
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

  const nhaCungCapDangChon = NHA_CUNG_CAP.find((item) => item.id === nhaCungCap) || NHA_CUNG_CAP[0];
  const avatarDaChon = avatars.find((avatar) => avatar.id === chuong.selectedAvatarId) || null;
  const coTaiLieu = danhSachTaiLieu.length > 0;
  const coKichBan = Boolean(chuong.script?.trim());
  const coAvatar = Boolean(avatarDaChon);
  const duDuLieu = coTaiLieu && coKichBan && coAvatar;
  const thoiLuongDuKien = useMemo(() => uocLuongThoiLuong(chuong.script), [chuong.script]);

  useEffect(() => () => clearInterval(boDemRef.current), []);

  const doiNhaCungCap = (id) => {
    const nha = NHA_CUNG_CAP.find((item) => item.id === id);
    setNhaCungCap(id);
    setModel(nha.models[0]);
    setGiong(nha.voices[0]);
  };

  const luuVaTiepTuc = async (bufoKeTiep) => {
    if (bufoKeTiep === 'confirm' && onSaveVoiceConfig) {
      setDangLuuGiong(true);
      const cauHinhGiong = `${nhaCungCapDangChon.label}:${model}:${giong}:${ngonNguGiong}:${tocDo}x`;
      await onSaveVoiceConfig(chuong.id, cauHinhGiong);
      setDangLuuGiong(false);
    }
    setBuoc(bufoKeTiep);
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

          {!duDuLieu && !dangTaiTaiLieu ? (
            <div className="video-gen-warning">
              <p><CircleAlert size={15} /> {t('videoGeneratorPage.content.notEnough')}</p>
              <ul>
                <li className={coTaiLieu ? 'ok' : ''}>{coTaiLieu ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingDocuments')}</li>
                <li className={coKichBan ? 'ok' : ''}>{coKichBan ? <Check size={12} /> : <span className="video-gen-dot" />} {t('videoGeneratorPage.content.missingScript')}</li>
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
                <span className="video-gen-check-icon"><Bot size={16} /></span>
                <div>
                  <strong>{t('chapterDetailPage.steps.script')}</strong>
                  <p><Check size={12} /> {t('videoGeneratorPage.content.hasScript')}</p>
                  <small>{t('videoGeneratorPage.content.estimatedDuration', { duration: dinhDangThoiLuong(thoiLuongDuKien) })}</small>
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

              <div className="video-gen-actions">
                <button type="button" className="primary" onClick={() => luuVaTiepTuc('voice')}>
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

          <div className="video-gen-form-grid">
            <label>
              <span>{t('videoGeneratorPage.voice.provider')}</span>
              <select value={nhaCungCap} onChange={(event) => doiNhaCungCap(event.target.value)}>
                {NHA_CUNG_CAP.map((nha) => <option value={nha.id} key={nha.id}>{nha.label}</option>)}
              </select>
            </label>
            <label>
              <span>{t('videoGeneratorPage.voice.model')}</span>
              <select value={model} onChange={(event) => setModel(event.target.value)}>
                {nhaCungCapDangChon.models.map((m) => <option value={m} key={m}>{m}</option>)}
              </select>
            </label>
            <label>
              <span>{t('videoGeneratorPage.voice.voice')}</span>
              <select value={giong} onChange={(event) => setGiong(event.target.value)}>
                {nhaCungCapDangChon.voices.map((v) => <option value={v} key={v}>{v}</option>)}
              </select>
            </label>
            <label>
              <span>{t('videoGeneratorPage.voice.language')}</span>
              <select value={ngonNguGiong} onChange={(event) => setNgonNguGiong(event.target.value)}>
                {NGON_NGU_GIONG.map(({ id, labelKey }) => <option value={id} key={id}>{t(labelKey)}</option>)}
              </select>
            </label>
          </div>

          <label className="video-gen-slider">
            <span>{t('videoGeneratorPage.voice.speed')}</span>
            <input type="range" min="0.5" max="2" step="0.1" value={tocDo} onChange={(event) => setTocDo(Number(event.target.value))} />
            <strong>{tocDo.toFixed(1)}x</strong>
          </label>

          <button type="button" className="video-gen-preview-button" title={t('videoGeneratorPage.voice.previewUnavailable')}>
            <Play size={14} fill="currentColor" /> {t('videoGeneratorPage.voice.preview')}
          </button>

          <label className="video-gen-checkbox">
            <input type="checkbox" checked={dongBoKhauHinh} onChange={(event) => setDongBoKhauHinh(event.target.checked)} />
            {t('videoGeneratorPage.voice.lipSync')}
          </label>

          <div className="video-gen-actions">
            <button type="button" className="ghost" onClick={() => setBuoc('content')}>{t('videoGeneratorPage.back2')}</button>
            <button type="button" className="primary" onClick={() => luuVaTiepTuc('config')}>{t('videoGeneratorPage.continue')}</button>
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
            <div><dt>{t('videoGeneratorPage.confirm.voice')}</dt><dd>{giong} • {tocDo.toFixed(1)}x</dd></div>
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
