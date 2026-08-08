import { useNgonNgu } from '../../contexts/NgonNguContext';
import './NutThongBao.css';

// Nut thong bao co hieu ung rung chuong.
function NutThongBao({ count = 0, isOpen, onClick }) {
  const { t } = useNgonNgu();
  const nhanThongBao = count
    ? `${t('header.notifications')}, ${t('header.newNotificationCount', { count })}`
    : t('header.notifications');

  return (
    <button
      className="notification-trigger"
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={nhanThongBao}
    >
      <span className="bell-container" aria-hidden="true">
        <span className="css-bell" />
      </span>
      {count > 0 && <span className="notification-badge">{count}</span>}
    </button>
  );
}

export default NutThongBao;
