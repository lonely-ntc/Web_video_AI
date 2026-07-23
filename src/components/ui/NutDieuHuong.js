import './NutDieuHuong.css';

function NutDieuHuong({ label, icon: Icon, active, count, onClick }) {
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
    >
      <span className="nav-item-icon" aria-hidden="true">
        <Icon size={19} strokeWidth={active ? 2.15 : 1.85} />
      </span>
      <span className="nav-item-label">{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}

export default NutDieuHuong;
