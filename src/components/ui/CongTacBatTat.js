import './CongTacBatTat.css';

function CongTacBatTat({ checked, label, onChange }) {
  return (
    <button
      className={`settings-switch ${checked ? 'enabled' : ''}`}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
    >
      <span aria-hidden="true" />
    </button>
  );
}

export default CongTacBatTat;
