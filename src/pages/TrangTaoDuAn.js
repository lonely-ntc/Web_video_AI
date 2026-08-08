import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  AudioLines,
  Check,
  FolderKanban,
  ImagePlus,
  Languages,
  Layers3,
  CircleAlert,
  LoaderCircle,
  MonitorPlay,
  Play,
  Save,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/tao-du-an.css';

const danhMucDuAn = [
  { id: 'education', labelKey: 'createProjectPage.categories.education' },
  { id: 'technology', labelKey: 'createProjectPage.categories.technology' },
  { id: 'marketing', labelKey: 'createProjectPage.categories.marketing' },
  { id: 'business', labelKey: 'createProjectPage.categories.business' },
  { id: 'other', labelKey: 'createProjectPage.categories.other' },
];

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

const duLieuBanDau = {
  name: '',
  description: '',
  category: 'education',
  language: 'vi',
  template: 'basic',
  defaultAvatar: '',
  defaultVoice: '',
  aspectRatio: '16:9',
  resolution: '1080p',
};

function layNhan(danhSach, giaTri, t) {
  const muc = danhSach.find((tuyChon) => tuyChon.id === giaTri);
  return muc ? t(muc.labelKey) : t('common.notUpdated');
}

function TrangTaoDuAn({
  dangLuu = false,
  loiLuu = '',
  onCancel,
  onClearError,
  onSubmitProject,
}) {
  const { t } = useNgonNgu();
  const [duLieu, setDuLieu] = useState(duLieuBanDau);
  const [batThietLapMacDinh, setBatThietLapMacDinh] = useState(false);
  const [anhBia, setAnhBia] = useState(null);
  const [anhBiaXemTruoc, setAnhBiaXemTruoc] = useState('');
  const hanhDongRef = useRef('save');

  useEffect(() => () => {
    if (anhBiaXemTruoc) URL.revokeObjectURL(anhBiaXemTruoc);
  }, [anhBiaXemTruoc]);

  const danhMucDangChon = useMemo(
    () => layNhan(danhMucDuAn, duLieu.category, t),
    [duLieu.category, t],
  );
  const templateDangChon = useMemo(
    () => layNhan(templateVideo, duLieu.template, t),
    [duLieu.template, t],
  );

  const capNhatTruong = (tenTruong) => (event) => {
    setDuLieu((hienTai) => ({ ...hienTai, [tenTruong]: event.target.value }));
    onClearError?.();
  };

  const capNhatAnhBia = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (anhBiaXemTruoc) URL.revokeObjectURL(anhBiaXemTruoc);
    setAnhBia(file);
    setAnhBiaXemTruoc(URL.createObjectURL(file));
    onClearError?.();
    event.target.value = '';
  };

  const xoaAnhBia = () => {
    if (anhBiaXemTruoc) URL.revokeObjectURL(anhBiaXemTruoc);
    setAnhBia(null);
    setAnhBiaXemTruoc('');
    onClearError?.();
  };

  const xuLyTaoProject = async (event) => {
    event.preventDefault();
    const tenProject = duLieu.name.trim();
    if (!tenProject) return;
    const hanhDong = hanhDongRef.current;
    hanhDongRef.current = 'save';

    await onSubmitProject?.({
      ...duLieu,
      name: tenProject,
      description: duLieu.description.trim(),
      coverFile: anhBia,
      defaultSettingsEnabled: batThietLapMacDinh,
      defaultAvatar: batThietLapMacDinh ? duLieu.defaultAvatar : '',
      defaultVoice: batThietLapMacDinh ? duLieu.defaultVoice : '',
      aspectRatio: batThietLapMacDinh ? duLieu.aspectRatio : '',
      resolution: batThietLapMacDinh ? duLieu.resolution : '',
    }, hanhDong);
  };

  return (
    <main className="create-project-page">
      <div className="create-project-topline">
        <button type="button" onClick={onCancel}>
          <ArrowLeft size={17} /> {t('createProjectPage.backToProjects')}
        </button>
      </div>

      <section className="create-project-hero">
        <div>
          <span><Sparkles size={15} /> {t('createProjectPage.eyebrow')}</span>
          <h1>{t('createProjectPage.title')}</h1>
          <p>{t('createProjectPage.description')}</p>
        </div>
        <div className="create-project-step">
          <strong>01</strong>
          <span>{t('createProjectPage.stepLabel')}</span>
        </div>
      </section>

      <form className="create-project-form" onSubmit={xuLyTaoProject}>
        <div className="create-project-main">
          <section className="create-project-card">
            <div className="create-project-card-heading">
              <span><FolderKanban size={20} /></span>
              <div>
                <h2>{t('createProjectPage.basic.title')}</h2>
                <p>{t('createProjectPage.basic.description')}</p>
              </div>
            </div>

            <div className="create-project-fields">
              <label className="create-project-field full" htmlFor="newProjectName">
                <span>{t('createProjectPage.basic.name')} <b>*</b></span>
                <input
                  id="newProjectName"
                  value={duLieu.name}
                  onChange={capNhatTruong('name')}
                  placeholder={t('createProjectPage.basic.namePlaceholder')}
                  maxLength="100"
                  autoFocus
                  required
                />
              </label>

              <label className="create-project-field full" htmlFor="newProjectDescription">
                <span>{t('createProjectPage.basic.projectDescription')}</span>
                <textarea
                  id="newProjectDescription"
                  value={duLieu.description}
                  onChange={capNhatTruong('description')}
                  placeholder={t('createProjectPage.basic.descriptionPlaceholder')}
                  maxLength="300"
                  rows="4"
                />
                <small>{t('createProjectPage.characterCount', { count: duLieu.description.length })}</small>
              </label>

              <label className="create-project-field" htmlFor="newProjectCategory">
                <span>{t('createProjectPage.basic.category')}</span>
                <select id="newProjectCategory" value={duLieu.category} onChange={capNhatTruong('category')}>
                  {danhMucDuAn.map(({ id, labelKey }) => (
                    <option value={id} key={id}>{t(labelKey)}</option>
                  ))}
                </select>
              </label>

              <label className="create-project-field" htmlFor="newProjectLanguage">
                <span>{t('createProjectPage.basic.language')}</span>
                <select id="newProjectLanguage" value={duLieu.language} onChange={capNhatTruong('language')}>
                  {ngonNguDuAn.map(({ id, labelKey }) => (
                    <option value={id} key={id}>{t(labelKey)}</option>
                  ))}
                </select>
              </label>

              <label className="create-project-field full" htmlFor="newProjectTemplate">
                <span>{t('createProjectPage.basic.template')}</span>
                <select id="newProjectTemplate" value={duLieu.template} onChange={capNhatTruong('template')}>
                  {templateVideo.map(({ id, labelKey }) => (
                    <option value={id} key={id}>{t(labelKey)}</option>
                  ))}
                </select>
              </label>

              <div className="create-project-cover-field">
                <div>
                  <span>{t('createProjectPage.basic.cover')}</span>
                  <small>{t('createProjectPage.basic.coverHint')}</small>
                </div>
                <div className="create-project-cover-actions">
                  <label htmlFor="newProjectCover">
                    <ImagePlus size={17} />
                    {anhBia ? t('createProjectPage.basic.changeCover') : t('createProjectPage.basic.chooseCover')}
                  </label>
                  <input
                    id="newProjectCover"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={capNhatAnhBia}
                  />
                  {anhBia && (
                    <button type="button" onClick={xoaAnhBia}>
                      <Trash2 size={16} /> {t('createProjectPage.basic.removeCover')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={`create-project-card default-settings ${batThietLapMacDinh ? 'enabled' : ''}`}>
            <div className="create-project-card-heading">
              <span><Settings2 size={20} /></span>
              <div>
                <h2>{t('createProjectPage.defaults.title')}</h2>
                <p>{t('createProjectPage.defaults.description')}</p>
              </div>
              <button
                className="default-settings-toggle"
                type="button"
                role="switch"
                aria-checked={batThietLapMacDinh}
                onClick={() => setBatThietLapMacDinh((hienTai) => !hienTai)}
              >
                <i><b /></i>
                {t(batThietLapMacDinh
                  ? 'createProjectPage.defaults.enabled'
                  : 'createProjectPage.defaults.disabled')}
              </button>
            </div>

            {batThietLapMacDinh && (
              <div className="default-settings-fields">
                <label className="create-project-field" htmlFor="defaultAvatar">
                  <span><UserRound size={14} /> {t('createProjectPage.defaults.avatar')}</span>
                  <select id="defaultAvatar" value={duLieu.defaultAvatar} onChange={capNhatTruong('defaultAvatar')}>
                    <option value="">{t('createProjectPage.defaults.notSelected')}</option>
                  </select>
                </label>

                <label className="create-project-field" htmlFor="defaultVoice">
                  <span><AudioLines size={14} /> {t('createProjectPage.defaults.voice')}</span>
                  <select id="defaultVoice" value={duLieu.defaultVoice} onChange={capNhatTruong('defaultVoice')}>
                    <option value="">{t('createProjectPage.defaults.notSelected')}</option>
                  </select>
                </label>

                <label className="create-project-field" htmlFor="defaultRatio">
                  <span><MonitorPlay size={14} /> {t('createProjectPage.defaults.ratio')}</span>
                  <select id="defaultRatio" value={duLieu.aspectRatio} onChange={capNhatTruong('aspectRatio')}>
                    <option value="16:9">16:9</option>
                    <option value="9:16">9:16</option>
                    <option value="1:1">1:1</option>
                  </select>
                </label>

                <label className="create-project-field" htmlFor="defaultResolution">
                  <span><Layers3 size={14} /> {t('createProjectPage.defaults.resolution')}</span>
                  <select id="defaultResolution" value={duLieu.resolution} onChange={capNhatTruong('resolution')}>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="2160p">2160p (4K)</option>
                  </select>
                </label>
              </div>
            )}
          </section>
        </div>

        <aside className="create-project-preview-column">
          <section className="create-project-card preview-panel">
            <div className="preview-panel-heading">
              <span><MonitorPlay size={18} /></span>
              <div><h2>{t('createProjectPage.preview.title')}</h2><p>{t('createProjectPage.preview.description')}</p></div>
            </div>

            <article className="new-project-preview">
              <div className="new-project-preview-cover">
                {anhBiaXemTruoc ? (
                  <img src={anhBiaXemTruoc} alt={t('createProjectPage.preview.coverAlt')} />
                ) : (
                  <div>
                    <ImagePlus size={31} />
                    <span>{t('createProjectPage.preview.noCover')}</span>
                  </div>
                )}
                <i><Sparkles size={13} /> AI VIDEO</i>
              </div>
              <div className="new-project-preview-content">
                <span>{danhMucDangChon}</span>
                <h3>{duLieu.name.trim() || t('createProjectPage.preview.namePlaceholder')}</h3>
                <p>{duLieu.description.trim() || t('createProjectPage.preview.descriptionPlaceholder')}</p>
                <div>
                  <span><Layers3 size={13} /> {templateDangChon}</span>
                  <span><Languages size={13} /> {layNhan(ngonNguDuAn, duLieu.language, t)}</span>
                </div>
              </div>
            </article>

            <div className="preview-note">
              <Check size={15} />
              <span>{t('createProjectPage.preview.note')}</span>
            </div>
          </section>
        </aside>

        {loiLuu && (
          <div className="create-project-error" role="alert">
            <CircleAlert size={17} /> {loiLuu}
          </div>
        )}

        <div className="create-project-actions">
          <button className="cancel-project-button" type="button" disabled={dangLuu} onClick={onCancel}>
            {t('createProjectPage.cancel')}
          </button>
          <div>
            <button
              className="save-project-button"
              type="submit"
              name="projectAction"
              value="save"
              disabled={dangLuu}
              onClick={() => { hanhDongRef.current = 'save'; }}
            >
              {dangLuu
                ? <><LoaderCircle className="create-project-spinner" size={17} /> {t('createProjectPage.saving')}</>
                : <><Save size={17} /> {t('createProjectPage.save')}</>}
            </button>
            <button
              className="create-video-button"
              type="submit"
              name="projectAction"
              value="createVideo"
              disabled={dangLuu}
              onClick={() => { hanhDongRef.current = 'createVideo'; }}
            >
              <Play size={17} fill="currentColor" /> {t('createProjectPage.createVideo')}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

export default TrangTaoDuAn;
