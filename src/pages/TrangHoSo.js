import { useRef } from 'react';
import {
  Activity,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileUp,
  FolderKanban,
  HardDrive,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  Sparkles,
  UserRound,
  Video,
} from 'lucide-react';
import { useNgonNgu } from '../contexts/NgonNguContext';
import useAnhDaiDien from '../flows/useAnhDaiDien';
import useHoSo from '../flows/useHoSo';
import '../styles/ho-so.css';

const thongKeHoSo = [
  { labelKey: 'profile.projects', value: '0', icon: FolderKanban, tone: 'purple' },
  { labelKey: 'profile.videos', value: '0', icon: Video, tone: 'blue' },
  { labelKey: 'profile.used', value: '0 GB', icon: HardDrive, tone: 'green' },
];

const tomTatHoatDong = [
  {
    labelKey: 'profile.projectsCompleted',
    detailKey: 'profile.projectsCompletedDetail',
    value: '0',
    icon: FolderKanban,
    tone: 'purple',
  },
  {
    labelKey: 'profile.filesUploaded',
    detailKey: 'profile.filesUploadedDetail',
    value: '0',
    icon: FileUp,
    tone: 'blue',
  },
  {
    labelKey: 'profile.videosCreated',
    detailKey: 'profile.videosCreatedDetail',
    value: '0',
    icon: Video,
    tone: 'green',
  },
];

const chiTietDungLuong = [
  { labelKey: 'dashboard.storage.documents', value: '0 GB', percent: 0, tone: 'purple' },
  { labelKey: 'dashboard.storage.images', value: '0 GB', percent: 0, tone: 'pink' },
  { labelKey: 'dashboard.storage.audio', value: '0 GB', percent: 0, tone: 'orange' },
  { labelKey: 'dashboard.storage.video', value: '0 GB', percent: 0, tone: 'blue' },
];

function TrangHoSo({ user, onOpenStorage }) {
  const { locale, t } = useNgonNgu();
  const avatarInputRef = useRef(null);
  const {
    hoSo,
    dangTai,
    dangLuu,
    thongBao,
    loi,
    capNhatTruong,
    luuHoSo,
  } = useHoSo(user);
  const {
    avatarUrl,
    capNhatAnh,
    dangTaiAnh,
    loiAnh,
    thongBaoAnh,
  } = useAnhDaiDien(user);
  const tenHienThi = hoSo.displayName.trim()
    || hoSo.fullName.trim()
    || user?.email?.split('@')[0]
    || t('profile.userFallback');
  const chuCaiDau = tenHienThi
    .split(/\s+/)
    .slice(-2)
    .map((phan) => phan.charAt(0).toUpperCase())
    .join('');
  const ngayThamGia = user?.created_at
    ? new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(user.created_at))
    : t('profile.notUpdated');

  return (
    <main className="profile-page">
      <section className="profile-hero">
        <div className="profile-hero-glow profile-glow-one" />
        <div className="profile-hero-glow profile-glow-two" />
        <div className="profile-identity">
          <div className={`profile-avatar-large ${avatarUrl ? 'has-image' : ''}`}>
            {avatarUrl ? (
              <img src={avatarUrl} alt={t('profile.avatarAlt', { name: tenHienThi })} />
            ) : (
              <span>{chuCaiDau}</span>
            )}
            <i aria-label={t('profile.verifiedAccount')}><BadgeCheck size={19} fill="currentColor" /></i>
          </div>
          <div className="profile-identity-copy">
            <span className="profile-eyebrow"><Sparkles size={14} /> {t('profile.creativeProfile')}</span>
            <h1>{tenHienThi}</h1>
            <p><Mail size={14} /> {user?.email}</p>
            <div className="profile-tags">
              <span>{t('common.creator')}</span>
              <span><CalendarDays size={13} /> {t('profile.joined', { date: ngayThamGia })}</span>
            </div>
            <input
              ref={avatarInputRef}
              className="profile-avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label={t('profile.chooseAvatar')}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) capNhatAnh(file);
                event.target.value = '';
              }}
            />
            <button
              className="profile-avatar-button"
              type="button"
              disabled={dangTaiAnh}
              onClick={() => avatarInputRef.current?.click()}
            >
              {dangTaiAnh ? (
                <><LoaderCircle className="profile-spinner" size={15} /> {t('profile.uploadingAvatar')}</>
              ) : (
                <><Camera size={15} /> {t('profile.changeAvatar')}</>
              )}
            </button>
            {thongBaoAnh && <div className="profile-avatar-feedback success" role="status">{thongBaoAnh}</div>}
            {loiAnh && <div className="profile-avatar-feedback error" role="alert">{loiAnh}</div>}
          </div>
        </div>

        <div className="profile-stats" aria-label={t('profile.accountStats')}>
          {thongKeHoSo.map(({ labelKey, value, icon: Icon, tone }) => (
            <div className="profile-stat" key={labelKey}>
              <span className={tone}><Icon size={17} /></span>
              <div><strong>{value}</strong><small>{t(labelKey)}</small></div>
            </div>
          ))}
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-card profile-form-card">
          <div className="profile-card-heading">
            <span><UserRound size={20} /></span>
            <div><h2>{t('profile.personalInfo')}</h2><p>{t('profile.personalInfoDescription')}</p></div>
          </div>

          <form
            className="profile-form"
            onSubmit={luuHoSo}
            aria-busy={dangTai || dangLuu}
          >
            {dangTai ? (
              <div className="profile-skeleton-grid" aria-live="polite" aria-label={t('profile.loadingProfile')}>
                {Array.from({ length: 6 }).map((_, chiSo) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <div className="profile-skeleton-field" key={chiSo} aria-hidden="true">
                    <div className="skeleton skeleton-text" />
                    <div className="skeleton skeleton-input" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="profile-form-grid">
                  <label className="profile-field" htmlFor="profileFullName">
                    <span>{t('profile.fullName')}</span>
                    <div><UserRound size={17} /><input id="profileFullName" value={hoSo.fullName} onChange={capNhatTruong('fullName')} autoComplete="name" required /></div>
                  </label>

                  <label className="profile-field" htmlFor="profileDisplayName">
                    <span>{t('profile.displayName')}</span>
                    <div><Sparkles size={17} /><input id="profileDisplayName" value={hoSo.displayName} onChange={capNhatTruong('displayName')} autoComplete="nickname" /></div>
                  </label>

                  <label className="profile-field" htmlFor="profileEmail">
                    <span>{t('common.email')}</span>
                    <div className="readonly"><Mail size={17} /><input id="profileEmail" value={user?.email || ''} readOnly /></div>
                    <small>{t('profile.loginEmailNote')}</small>
                  </label>

                  <label className="profile-field" htmlFor="profilePhone">
                    <span>{t('profile.phone')}</span>
                    <div><Phone size={17} /><input id="profilePhone" value={hoSo.phone} onChange={capNhatTruong('phone')} autoComplete="tel" placeholder={t('profile.phonePlaceholder')} /></div>
                  </label>

                  <label className="profile-field" htmlFor="profileCompany">
                    <span>{t('profile.company')}</span>
                    <div><Building2 size={17} /><input id="profileCompany" value={hoSo.company} onChange={capNhatTruong('company')} autoComplete="organization" placeholder={t('profile.companyPlaceholder')} /></div>
                  </label>

                  <label className="profile-field" htmlFor="profileJobTitle">
                    <span>{t('profile.jobTitle')}</span>
                    <div><BriefcaseBusiness size={17} /><input id="profileJobTitle" value={hoSo.jobTitle} onChange={capNhatTruong('jobTitle')} autoComplete="organization-title" placeholder={t('profile.jobTitlePlaceholder')} /></div>
                  </label>
                </div>

                <label className="profile-field profile-bio" htmlFor="profileBio">
                  <span>{t('profile.bio')}</span>
                  <textarea id="profileBio" value={hoSo.bio} onChange={capNhatTruong('bio')} rows="4" maxLength="240" placeholder={t('profile.bioPlaceholder')} />
                  <small>{t('profile.characterCount', { count: hoSo.bio.length })}</small>
                </label>

                {thongBao && <div className="profile-message success" role="status"><CheckCircle2 size={17} /> {thongBao}</div>}
                {loi && <div className="profile-message error" role="alert"><CircleAlert size={17} /> {loi}</div>}

                <div className="profile-form-actions">
                  <span>{t('profile.dataLocation')}</span>
                  <button type="submit" disabled={dangLuu || dangTai}>
                    {dangLuu
                      ? <><LoaderCircle className="profile-spinner" size={17} /> {t('profile.saving')}</>
                      : <><Save size={17} /> {t('profile.saveChanges')}</>}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>

        <aside className="profile-sidebar">
          <section className="profile-card activity-summary-card">
            <div className="profile-card-heading compact">
              <span><Activity size={19} /></span>
              <div><h2>{t('profile.activitySummaryTitle')}</h2><p>{t('profile.activitySummaryDescription')}</p></div>
            </div>
            <div className="activity-summary-list">
              {tomTatHoatDong.map(({ labelKey, detailKey, value, icon: Icon, tone }) => (
                <div className="activity-summary-item" key={labelKey}>
                  <span className={tone}><Icon size={18} /></span>
                  <div>
                    <strong>{t(labelKey)}</strong>
                    <small>{t(detailKey)}</small>
                  </div>
                  <b>{value}</b>
                </div>
              ))}
            </div>
            <p className="activity-summary-note">{t('profile.activitySummaryNote')}</p>
          </section>

          <section className="profile-card profile-storage-card">
            <div className="profile-storage-heading">
              <h2>{t('dashboard.storage.title')}</h2>
              <button type="button" onClick={onOpenStorage}>
                {t('common.manage')} <ChevronRight size={14} />
              </button>
            </div>

            <div className="profile-storage-overview">
              <div
                className="profile-storage-donut empty"
                role="img"
                aria-label={t('profile.storageUsageLabel')}
              >
                <div>
                  <strong>0</strong>
                  <span>{t('dashboard.storage.used')}</span>
                </div>
              </div>
              <div className="profile-storage-totals">
                <span>
                  <small>{t('dashboard.storage.total')}</small>
                  <strong>0 GB</strong>
                </span>
                <span>
                  <small>{t('dashboard.storage.remaining')}</small>
                  <strong>0 GB</strong>
                </span>
              </div>
            </div>

            <div className="profile-storage-list">
              {chiTietDungLuong.map(({ labelKey, value, percent, tone }) => (
                <div className={`profile-storage-row ${tone}`} key={labelKey}>
                  <div className="profile-storage-label">
                    <i />
                    <span>{t(labelKey)}</span>
                  </div>
                  <div
                    className="profile-storage-track"
                    role="progressbar"
                    aria-label={t(labelKey)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={percent}
                  >
                    <span style={{ width: `${percent}%` }} />
                  </div>
                  <b>{value}</b>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

export default TrangHoSo;
