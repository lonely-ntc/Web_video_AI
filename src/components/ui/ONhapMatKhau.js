import { Eye, EyeOff } from 'lucide-react';
import { useNgonNgu } from '../../contexts/NgonNguContext';
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
  const { t } = useNgonNgu();

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
        <button
          type="button"
          onClick={onToggle}
          aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      }
    />
  );
}

export default ONhapMatKhau;
