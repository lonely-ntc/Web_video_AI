import './ONhapXacNhanMatKhau.css';

// O nhap dung chung co nhan noi theo ten file nguoi dung da chon.
function ONhapXacNhanMatKhau({
  id,
  label,
  type = 'text',
  value,
  onChange,
  autoComplete,
  minLength,
  required = true,
  endAdornment,
}) {
  return (
    <div className={`auth-floating-field${endAdornment ? ' has-action' : ''}`}>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        autoComplete={autoComplete}
        minLength={minLength}
        required={required}
      />
      <label htmlFor={id}>{label}</label>
      {endAdornment && <span className="auth-floating-action">{endAdornment}</span>}
    </div>
  );
}

export default ONhapXacNhanMatKhau;
