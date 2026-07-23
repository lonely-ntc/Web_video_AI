import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { taiAnhDaiDien } from './database/anhDaiDien';
import { supabase } from './database/supabase';
import {
  capNhatAnhDaiDien,
  layHoSoNguoiDung,
  luuHoSoNguoiDung,
} from './database/hoSoNguoiDung';

const mockUnsubscribe = jest.fn();

jest.mock('./database/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock('./database/hoSoNguoiDung', () => ({
  capNhatAnhDaiDien: jest.fn(),
  layHoSoNguoiDung: jest.fn(),
  luuHoSoNguoiDung: jest.fn(),
}));

jest.mock('./database/anhDaiDien', () => ({
  taiAnhDaiDien: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: mockUnsubscribe } },
  });
  supabase.auth.updateUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
  layHoSoNguoiDung.mockResolvedValue({
    data: null,
    error: null,
  });
  luuHoSoNguoiDung.mockResolvedValue({
    data: null,
    error: null,
  });
  capNhatAnhDaiDien.mockResolvedValue({
    data: null,
    error: null,
  });
  taiAnhDaiDien.mockResolvedValue({
    data: {
      path: 'user-123/avatar',
      url: 'https://example.supabase.co/avatars/user-123/avatar?v=1',
    },
    error: null,
  });
});

test('opens settings and updates appearance and notification preferences', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /^settings$/i }));

  expect(await screen.findByRole('heading', { name: /^cài đặt$/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /chế độ tối/i }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

  const videoNotification = screen.getByRole('switch', { name: /video hoàn thành/i });
  fireEvent.click(videoNotification);
  expect(videoNotification).toHaveAttribute('aria-checked', 'false');
});

test('shows the dashboard first and opens login on request', async () => {
  render(<App />);

  expect(
    screen.getByRole('heading', { name: /^xin chào/i })
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /đăng nhập/i }));

  expect(
    await screen.findByRole('heading', { name: /đăng nhập tài khoản/i })
  ).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /quay lại dashboard/i })).toBeInTheDocument();
});

test('opens the profile page and saves updated account information', async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: {
      session: {
        user: {
          id: 'user-123',
          email: 'chuong@example.com',
          email_confirmed_at: '2026-07-01T08:00:00.000Z',
          created_at: '2026-01-12T08:00:00.000Z',
          user_metadata: { full_name: 'Nguyễn Văn Chương' },
        },
      },
    },
    error: null,
  });

  render(<App />);

  fireEvent.click(await screen.findByRole('button', { name: /^profile$/i }));

  expect(
    await screen.findByRole('heading', { name: 'Nguyễn Văn Chương' })
  ).toBeInTheDocument();

  const saveButton = screen.getByRole('button', { name: /lưu thay đổi/i });
  await waitFor(() => expect(saveButton).not.toBeDisabled());
  expect(screen.getByLabelText('Họ và tên')).toHaveValue('Nguyễn Văn Chương');

  fireEvent.change(screen.getByLabelText('Vai trò công việc'), {
    target: { value: 'Creative Lead' },
  });
  fireEvent.click(saveButton);

  await waitFor(() => expect(luuHoSoNguoiDung).toHaveBeenCalledTimes(1));
  expect(luuHoSoNguoiDung).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'user-123',
      email: 'chuong@example.com',
    }),
    expect.objectContaining({
      fullName: 'Nguyễn Văn Chương',
      displayName: 'Nguyễn Văn Chương',
      jobTitle: 'Creative Lead',
    })
  );

  await waitFor(() => {
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: expect.objectContaining({
        full_name: 'Nguyễn Văn Chương',
        display_name: 'Nguyễn Văn Chương',
        job_title: 'Creative Lead',
      }),
    });
  });

  expect(
    await screen.findByText(/thông tin hồ sơ đã được lưu vào bảng public\.profiles/i)
  ).toBeInTheDocument();
});

test('uploads and displays a new account avatar', async () => {
  const user = {
    id: 'user-123',
    email: 'chuong@example.com',
    created_at: '2026-01-12T08:00:00.000Z',
    user_metadata: { full_name: 'Nguyễn Văn Chương' },
  };
  supabase.auth.getSession.mockResolvedValueOnce({
    data: { session: { user } },
    error: null,
  });

  render(<App />);
  await screen.findByRole('button', { name: /nguyễn văn chương creator/i });
  fireEvent.click(await screen.findByRole('button', { name: /^profile$/i }));

  const file = new File(['avatar'], 'anh-dai-dien.png', { type: 'image/png' });
  fireEvent.change(await screen.findByLabelText('Chọn ảnh đại diện'), {
    target: { files: [file] },
  });

  await waitFor(() => {
    expect(taiAnhDaiDien).toHaveBeenCalledWith('user-123', file);
  });
  expect(capNhatAnhDaiDien).toHaveBeenCalledWith(
    user,
    expect.objectContaining({
      path: 'user-123/avatar',
    })
  );
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    data: expect.objectContaining({
      avatar_path: 'user-123/avatar',
      avatar_url: 'https://example.supabase.co/avatars/user-123/avatar?v=1',
    }),
  });
  expect(
    await screen.findByAltText('Ảnh đại diện của Nguyễn Văn Chương')
  ).toBeInTheDocument();
  expect(
    screen.getByText('Ảnh đại diện đã được cập nhật thành công.')
  ).toBeInTheDocument();
});
