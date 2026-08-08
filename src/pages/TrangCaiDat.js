import {
  BellRing,
  Check,
  CircleAlert,
  FileCheck2,
  Languages,
  Megaphone,
  Moon,
  Palette,
  Sun,
  Type,
  Video,
} from 'lucide-react';
import CongTacBatTat from '../components/ui/CongTacBatTat';
import { useNgonNgu } from '../contexts/NgonNguContext';
import '../styles/cai-dat.css';

const tuyChonThongBao = [
  {
    key: 'videoCompleted',
    titleKey: 'settings.notifications.videoCompleted',
    descriptionKey: 'settings.notifications.videoCompletedDescription',
    icon: Video,
    tone: 'purple',
  },
  {
    key: 'documentUploaded',
    titleKey: 'settings.notifications.documentUploaded',
    descriptionKey: 'settings.notifications.documentUploadedDescription',
    icon: FileCheck2,
    tone: 'blue',
  },
  {
    key: 'videoFailed',
    titleKey: 'settings.notifications.videoFailed',
    descriptionKey: 'settings.notifications.videoFailedDescription',
    icon: CircleAlert,
    tone: 'red',
  },
  {
    key: 'systemUpdates',
    titleKey: 'settings.notifications.systemUpdates',
    descriptionKey: 'settings.notifications.systemUpdatesDescription',
    icon: Megaphone,
    tone: 'orange',
  },
];

function TrangCaiDat({ caiDat, onAppearanceChange, onNotificationToggle }) {
  const { t } = useNgonNgu();

  return (
    <main className="settings-page">
      <header className="settings-heading">
        <div>
          <span className="settings-eyebrow"><Palette size={15} /> {t('settings.eyebrow')}</span>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
        <span className="settings-saved"><Check size={15} /> {t('settings.autoSaved')}</span>
      </header>

      <div className="settings-layout">
        <section className="settings-card appearance-settings">
          <div className="settings-section-title">
            <span><Palette size={20} /></span>
            <div>
              <h2>{t('settings.appearanceTitle')}</h2>
              <p>{t('settings.appearanceDescription')}</p>
            </div>
          </div>

          <div className="settings-group">
            <div className="settings-label">
              <strong>{t('settings.displayMode')}</strong>
              <span>{t('settings.displayModeDescription')}</span>
            </div>
            <div className="theme-options" role="group" aria-label={t('settings.displayMode')}>
              <button
                type="button"
                className={caiDat.theme === 'light' ? 'selected' : ''}
                aria-pressed={caiDat.theme === 'light'}
                onClick={() => onAppearanceChange('theme', 'light')}
              >
                <span className="theme-preview light"><Sun size={21} /></span>
                <span><strong>{t('settings.lightMode')}</strong><small>Light Mode</small></span>
                {caiDat.theme === 'light' && <Check className="option-check" size={16} />}
              </button>
              <button
                type="button"
                className={caiDat.theme === 'dark' ? 'selected' : ''}
                aria-pressed={caiDat.theme === 'dark'}
                onClick={() => onAppearanceChange('theme', 'dark')}
              >
                <span className="theme-preview dark"><Moon size={21} /></span>
                <span><strong>{t('settings.darkMode')}</strong><small>Dark Mode</small></span>
                {caiDat.theme === 'dark' && <Check className="option-check" size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row-copy">
              <span className="settings-row-icon"><Languages size={19} /></span>
              <div><strong>{t('settings.language')}</strong><span>{t('settings.languageDescription')}</span></div>
            </div>
            <select
              value={caiDat.language}
              onChange={(event) => onAppearanceChange('language', event.target.value)}
              aria-label={t('settings.language')}
            >
              <option value="vi">{t('settings.vietnamese')}</option>
              <option value="en">{t('settings.english')}</option>
            </select>
          </div>

          <div className="settings-row font-size-row">
            <div className="settings-row-copy">
              <span className="settings-row-icon"><Type size={19} /></span>
              <div><strong>{t('settings.fontSize')}</strong><span>{t('settings.fontSizeDescription')}</span></div>
            </div>
            <div className="font-size-options" role="group" aria-label={t('settings.fontSize')}>
              {[
                ['small', t('settings.small')],
                ['medium', t('settings.medium')],
                ['large', t('settings.large')],
              ].map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={caiDat.fontSize === value ? 'selected' : ''}
                  aria-pressed={caiDat.fontSize === value}
                  onClick={() => onAppearanceChange('fontSize', value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="settings-card notification-settings">
          <div className="settings-section-title">
            <span><BellRing size={20} /></span>
            <div>
              <h2>{t('settings.notificationTitle')}</h2>
              <p>{t('settings.notificationDescription')}</p>
            </div>
          </div>

          <div className="notification-settings-list">
            {tuyChonThongBao.map(({ key, titleKey, descriptionKey, icon: Icon, tone }) => {
              const title = t(titleKey);
              return (
                <div className="notification-setting-row" key={key}>
                  <span className={`notification-setting-icon ${tone}`}><Icon size={19} /></span>
                  <div><strong>{title}</strong><p>{t(descriptionKey)}</p></div>
                  <CongTacBatTat
                    checked={caiDat.notifications[key]}
                    label={`${title}: ${caiDat.notifications[key] ? t('settings.enabled') : t('settings.disabled')}`}
                    onChange={() => onNotificationToggle(key)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

export default TrangCaiDat;
