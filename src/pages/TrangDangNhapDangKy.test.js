import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import TrangDangNhapDangKy from './TrangDangNhapDangKy';
import { supabase } from '../database/supabase';

jest.mock('../database/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  supabase.auth.signInWithPassword.mockResolvedValue({ error: null });
  supabase.auth.signUp.mockResolvedValue({
    data: { session: null },
    error: null,
  });
});

function completeRegistrationForm() {
  fireEvent.click(screen.getByRole('tab', { name: /đăng ký/i }));
  fireEvent.change(screen.getByLabelText('Họ và tên'), {
    target: { value: 'Nguyễn Văn Chương' },
  });
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'chuong@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), {
    target: { value: 'StrongPass123!' },
  });
  fireEvent.change(screen.getByLabelText('Nhập lại mật khẩu'), {
    target: { value: 'StrongPass123!' },
  });
  fireEvent.click(screen.getByRole('checkbox'));
}

test('submits email and password to Supabase when logging in', async () => {
  render(<TrangDangNhapDangKy />);

  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'chuong@example.com' },
  });
  fireEvent.change(screen.getByLabelText('Mật khẩu'), {
    target: { value: 'StrongPass123!' },
  });
  fireEvent.click(screen.getByRole('button', { name: /^đăng nhập$/i }));

  await waitFor(() => {
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'chuong@example.com',
      password: 'StrongPass123!',
    });
  });
});

test('registers a user with their display name', async () => {
  render(<TrangDangNhapDangKy />);

  completeRegistrationForm();
  fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }));

  await waitFor(() => {
    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'chuong@example.com',
      password: 'StrongPass123!',
      options: {
        data: {
          full_name: 'Nguyễn Văn Chương',
          display_name: 'Chương',
          phone: '',
          company: '',
          job_title: '',
          bio: '',
        },
        emailRedirectTo: window.location.origin,
      },
    });
  });
});

test('offers login and password recovery when the registration email already exists', async () => {
  supabase.auth.signUp.mockResolvedValueOnce({
    data: { user: null, session: null },
    error: { code: 'user_already_exists', message: 'User already registered' },
  });
  render(<TrangDangNhapDangKy />);

  completeRegistrationForm();
  fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }));

  expect(await screen.findByText('Email đã được sử dụng')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /chuyển sang đăng nhập/i }));

  expect(screen.getByRole('heading', { name: /đăng nhập tài khoản/i })).toBeInTheDocument();
  expect(screen.getByLabelText('Email')).toHaveValue('chuong@example.com');
});

test('detects Supabase existing-email responses without an explicit error', async () => {
  supabase.auth.signUp.mockResolvedValueOnce({
    data: { user: { identities: [] }, session: null },
    error: null,
  });
  render(<TrangDangNhapDangKy />);

  completeRegistrationForm();
  fireEvent.click(screen.getByRole('button', { name: /tạo tài khoản/i }));

  expect(await screen.findByText('Email đã được sử dụng')).toBeInTheDocument();
});
