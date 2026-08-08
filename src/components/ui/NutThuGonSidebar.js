import { useId } from 'react';
import { useNgonNgu } from '../../contexts/NgonNguContext';
import './NutThuGonSidebar.css';

function NutThuGonSidebar({ expanded, onToggle }) {
  const { t } = useNgonNgu();
  const inputId = useId();
  const label = expanded
    ? t('navigation.collapseSidebar')
    : t('navigation.expandSidebar');

  return (
    <div className="sidebar-toggle-shell" title={label}>
      <input
        id={inputId}
        className="sidebar-toggle-input"
        type="checkbox"
        checked={expanded}
        onChange={onToggle}
        aria-label={label}
      />
      <label className="sidebar-toggle-control" htmlFor={inputId}>
        <span className="sidebar-toggle-bar bar-one" />
        <span className="sidebar-toggle-bar bar-two" />
        <span className="sidebar-toggle-bar bar-three" />
      </label>
    </div>
  );
}

export default NutThuGonSidebar;
