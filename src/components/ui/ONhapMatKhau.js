import { Eye, EyeOff } from 'lucide-react';
import ONhapXacNhanMatKhau from './ONhapXacNhanMatKhau';
import './ONhapMatKhau.css';

// Thanh phan UI mo rong o nhap voi nut hien va an mat khau.
function ONhapMatKhau({
  id,
  label,
  value,
  onChange,
  autoComplete,
  showPassword,
  onToggle,
}) {
  return (
    <ONhapXacNhanMatKhau
      id={id}
      label={label}
      type={showPassword ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      minLength="8"
      endAdornment={
        <button type="button" onClick={onToggle} aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
    />
  );
}

export default ONhapMatKhau;
