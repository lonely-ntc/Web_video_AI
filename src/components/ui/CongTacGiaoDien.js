import { useId } from 'react';
import { useNgonNgu } from '../../contexts/NgonNguContext';
import './CongTacGiaoDien.css';

function CongTacGiaoDien({ checked, onChange }) {
  const { t } = useNgonNgu();
  const inputId = useId();
  const label = checked ? t('settings.switchToLight') : t('settings.switchToDark');

  return (
    <label className="theme-toggle" htmlFor={inputId} title={label}>
      <input
        id={inputId}
        className="theme-toggle-input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        aria-label={label}
      />
      <svg
        className="theme-toggle-art"
        viewBox="0 0 69.667 44"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <g transform="translate(3.5 3.5)">
          <rect
            className="theme-toggle-sky"
            rx="17.5"
            height="35"
            width="60.667"
          />

          <g className="theme-toggle-button" transform="translate(2.333 2.333)">
            <g className="theme-toggle-sun">
              <circle className="theme-toggle-sun-outer" r="15.167" cy="15.167" cx="15.167" />
              <circle className="theme-toggle-sun-glow" r="11.667" cy="15.167" cx="15.167" />
              <circle className="theme-toggle-sun-inner" r="7" cy="15.167" cx="15.167" />
            </g>

            <g className="theme-toggle-moon">
              <circle className="theme-toggle-moon-body" r="15.167" cy="15.167" cx="15.167" />
              <g className="theme-toggle-moon-patches">
                <circle r="2" cy="7" cx="18.5" />
                <circle r="2" cy="20.5" cx="14.8" />
                <circle r="1" cy="10.5" cx="8.5" />
                <circle r="1" cy="21.4" cx="26.5" />
                <circle r="1" cy="25" cx="8.5" />
                <circle r="1.5" cy="13" cx="25.5" />
              </g>
            </g>
          </g>

          <g className="theme-toggle-cloud">
            <circle cx="42" cy="17" r="4.2" />
            <circle cx="48" cy="15" r="5.3" />
            <circle cx="54" cy="18" r="4.5" />
            <rect x="38" y="17" width="20" height="6" rx="3" />
          </g>

          <g className="theme-toggle-stars">
            <circle cx="9" cy="8" r="1.1" />
            <circle cx="19" cy="6" r=".8" />
            <circle cx="15" cy="16" r="1.2" />
            <circle cx="7" cy="24" r=".8" />
            <circle cx="21" cy="29" r="1" />
            <path d="M9 14l.7 1.6 1.7.2-1.3 1.1.4 1.7-1.5-.9-1.5.9.4-1.7-1.3-1.1 1.7-.2z" />
            <path d="M17 22l.55 1.2 1.3.15-1 .9.3 1.3-1.15-.7-1.15.7.3-1.3-1-.9 1.3-.15z" />
          </g>
        </g>
      </svg>
    </label>
  );
}

export default CongTacGiaoDien;
