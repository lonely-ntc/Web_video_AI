// Xu ly toan bo luong dang nhap, dang ky va khoi phuc tai khoan.
import { useEffect, useState } from 'react';
import { supabase } from '../database/supabase';

const bieuMauBanDau = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

function laLoiEmailBiTrung(error) {
  const code = error?.code?.toLowerCase() || '';
  const message = error?.message?.toLowerCase() || '';

  return (
    code === 'user_already_exists'
    || code === 'email_exists'
    || message.includes('user already registered')
    || message.includes('email already registered')
    || message.includes('email already exists')
  );
}

function laPhanHoiEmailDaTonTai(data) {
  const identities = data?.user?.identities;
  return Array.isArray(identities) && identities.length === 0;
}

function dichLoiXacThuc(error) {
  const message = error?.message?.toLowerCase() || '';

  if (message.includes('invalid login credentials')) {
    return 'Email hoặc mật khẩu chưa chính xác.';
  }
  if (message.includes('email not confirmed')) {
    return 'Bạn cần xác nhận email trước khi đăng nhập.';
  }
  if (message.includes('user already registered')) {
    return 'Email này đã được đăng ký. Hãy chuyển sang đăng nhập.';
  }
  if (message.includes('password should be')) {
    return 'Mật khẩu chưa đáp ứng yêu cầu bảo mật.';
  }
  if (message.includes('rate limit')) {
    return 'Bạn đã thao tác quá nhanh. Vui lòng thử lại sau ít phút.';
  }
  if (message.includes('failed to fetch')) {
    return 'Không thể kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.';
  }

  return error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

function useDangNhapDangKy(initialMode = 'login') {
  const [mode, setMode] = useState(initialMode);
  const [form, setForm] = useState(bieuMauBanDau);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [confirmation, setConfirmation] = useState('');

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const updateField = (field) => (event) => {
    const value = field === 'acceptedTerms' ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'email') setDuplicateEmail(false);
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setDuplicateEmail(false);
    setConfirmation('');
    setShowPassword(false);
    setForm((current) => ({ ...bieuMauBanDau, email: current.email }));
  };

  const validatePasswords = () => {
    if (form.password.length < 8) {
      throw new Error('Mật khẩu cần có ít nhất 8 ký tự.');
    }
    if (form.password !== form.confirmPassword) {
      throw new Error('Mật khẩu nhập lại chưa trùng khớp.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setDuplicateEmail(false);

    try {
      if (mode === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (signInError) throw signInError;
      }

      if (mode === 'register') {
        validatePasswords();
        const fullName = form.fullName.trim();
        if (fullName.length < 2) {
          throw new Error('Vui lòng nhập họ và tên của bạn.');
        }
        if (!form.acceptedTerms) {
          throw new Error('Bạn cần đồng ý với điều khoản sử dụng.');
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            data: {
              full_name: fullName,
              display_name: fullName.split(/\s+/).slice(-1)[0],
              phone: '',
              company: '',
              job_title: '',
              bio: '',
            },
            emailRedirectTo: window.location.origin,
          },
        });
        if (signUpError) {
          if (laLoiEmailBiTrung(signUpError)) {
            setDuplicateEmail(true);
            return;
          }
          throw signUpError;
        }
        if (laPhanHoiEmailDaTonTai(data)) {
          setDuplicateEmail(true);
          return;
        }
        if (!data.session) setConfirmation('signup');
      }

      if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          form.email.trim(),
          { redirectTo: window.location.origin }
        );
        if (resetError) throw resetError;
        setConfirmation('reset');
      }

      if (mode === 'update-password') {
        validatePasswords();
        const { error: updateError } = await supabase.auth.updateUser({
          password: form.password,
        });
        if (updateError) throw updateError;
        setConfirmation('password-updated');
      }
    } catch (submitError) {
      if (mode === 'register' && laLoiEmailBiTrung(submitError)) {
        setDuplicateEmail(true);
      } else {
        setError(dichLoiXacThuc(submitError));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    confirmation,
    duplicateEmail,
    error,
    form,
    handleSubmit,
    loading,
    mode,
    setShowPassword,
    showPassword,
    switchMode,
    updateField,
  };
}

export default useDangNhapDangKy;
