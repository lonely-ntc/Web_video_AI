import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { taiAnhDaiDien } from './database/anhDaiDien';
import { supabase } from './database/supabase';
import {
  layDanhSachDuAn,
  taoDuAnNguoiDung,
} from './database/duAn';
import {
  capNhatAnhDaiDien,
  layHoSoNguoiDung,
  luuHoSoNguoiDung,
} from './database/hoSoNguoiDung';

const mockUnsubscribe = jest.fn();

jest.mock('./database/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
    removeChannel: jest.fn(),
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

jest.mock('./database/duAn', () => ({
  layDanhSachDuAn: jest.fn(),
  taoDuAnNguoiDung: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  supabase.from.mockImplementation(() => {
    const ketQua = Promise.resolve({ data: [], error: null });
    const truyVan = {
      select: jest.fn(() => truyVan),
      insert: jest.fn(() => truyVan),
      update: jest.fn(() => truyVan),
      delete: jest.fn(() => truyVan),
      eq: jest.fn(() => truyVan),
      is: jest.fn(() => truyVan),
      in: jest.fn(() => truyVan),
      order: jest.fn(() => truyVan),
      limit: jest.fn(() => truyVan),
      single: jest.fn(() => truyVan),
      maybeSingle: jest.fn(() => truyVan),
      then: ketQua.then.bind(ketQua),
    };
    return truyVan;
  });
  supabase.channel.mockImplementation(() => {
    const kenh = {
      on: jest.fn(() => kenh),
      subscribe: jest.fn(() => kenh),
    };
    return kenh;
  });
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
  layDanhSachDuAn.mockResolvedValue({
    data: [],
    error: null,
  });
  taoDuAnNguoiDung.mockResolvedValue({
    data: null,
    error: null,
  });
});

test('opens settings and updates appearance and notification preferences', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /^cài đặt$/i }));

  expect(await screen.findByRole('heading', { name: /^cài đặt$/i })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /chế độ tối/i }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

  const videoNotification = screen.getByRole('switch', { name: /video hoàn thành/i });
  fireEvent.click(videoNotification);
  expect(videoNotification).toHaveAttribute('aria-checked', 'false');
});

test('opens the empty projects page with filters, views, statistics, and pagination', async () => {
  render(<App />);

  fireEvent.click(screen.getByRole('button', { name: /^dự án$/i }));

  expect(await screen.findByRole('heading', { name: /^dự án$/i })).toBeInTheDocument();
  expect(screen.getByLabelText('Tìm kiếm Project')).toBeInTheDocument();
  expect(screen.getByText('Tổng số Project')).toBeInTheDocument();
  expect(screen.getByText('Chưa có Project nào')).toBeInTheDocument();
  expect(screen.getByText('Trang 1 / 1')).toBeInTheDocument();

  const listViewButton = screen.getByRole('button', { name: 'Hiển thị dạng danh sách' });
  fireEvent.click(listViewButton);
  expect(listViewButton).toHaveAttribute('aria-pressed', 'true');

  fireEvent.click(screen.getByRole('button', { name: 'Hoàn thành' }));
  expect(screen.getByText('Không tìm thấy Project')).toBeInTheDocument();
});

test('opens the create project form and updates its live preview', async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: {
      session: {
        user: {
          id: 'project-owner',
          email: 'owner@example.com',
          user_metadata: { full_name: 'Project Owner' },
        },
      },
    },
    error: null,
  });

  render(<App />);

  await screen.findByRole('button', { name: /project owner creator/i });
  fireEvent.click(screen.getByRole('button', { name: /^dự án$/i }));
  fireEvent.click(screen.getAllByRole('button', { name: /^project mới$/i })[0]);

  expect(await screen.findByRole('heading', { name: 'Tạo Project' })).toBeInTheDocument();
  const nameInput = screen.getByLabelText(/tên project/i);
  fireEvent.change(nameInput, { target: { value: 'Khóa học AI' } });

  expect(screen.getByRole('heading', { name: 'Khóa học AI' })).toBeInTheDocument();
  expect(screen.getAllByText('Giáo dục').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Video cơ bản').length).toBeGreaterThan(0);

  const defaultSettings = screen.getByRole('switch', { name: /không sử dụng/i });
  fireEvent.click(defaultSettings);
  expect(screen.getByLabelText('Tỷ lệ video')).toBeInTheDocument();
  expect(defaultSettings).toHaveAttribute('aria-checked', 'true');

  expect(screen.getByRole('button', { name: 'Lưu Project' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Tạo Video' })).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Tạo Project' })).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: /^hủy$/i }));
  expect(await screen.findByRole('heading', { name: /^dự án$/i })).toBeInTheDocument();
});

test('saves a project to Supabase and displays it on the projects page', async () => {
  const user = {
    id: 'saved-project-owner',
    email: 'saved-owner@example.com',
    user_metadata: { full_name: 'Saved Project Owner' },
  };
  supabase.auth.getSession.mockResolvedValueOnce({
    data: { session: { user } },
    error: null,
  });
  taoDuAnNguoiDung.mockResolvedValueOnce({
    data: {
      id: 'project-001',
      userId: user.id,
      name: 'Project Supabase',
      description: 'Dự án được lưu thật',
      category: 'technology',
      defaultLanguage: 'vi',
      template: 'basic',
      coverPath: '',
      coverUrl: '',
      status: 'inProgress',
      progress: 0,
      documentCount: 0,
      videoCount: 0,
      createdAt: '2026-07-31T08:00:00.000Z',
      updatedAt: '2026-07-31T08:00:00.000Z',
    },
    error: null,
  });

  render(<App />);

  await screen.findByRole('button', { name: /saved project owner creator/i });
  fireEvent.click(screen.getByRole('button', { name: /^project mới$/i }));
  fireEvent.change(await screen.findByLabelText(/tên project/i), {
    target: { value: 'Project Supabase' },
  });
  fireEvent.change(screen.getByLabelText(/mô tả project/i), {
    target: { value: 'Dự án được lưu thật' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Lưu Project' }));

  await waitFor(() => expect(taoDuAnNguoiDung).toHaveBeenCalledTimes(1));
  expect(taoDuAnNguoiDung).toHaveBeenCalledWith(
    user,
    expect.objectContaining({
      name: 'Project Supabase',
      description: 'Dự án được lưu thật',
    })
  );
  expect(await screen.findByRole('heading', { name: /^dự án$/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Project Supabase' })).toBeInTheDocument();
  expect(screen.getByText('Project đã được lưu vào Supabase.')).toBeInTheDocument();
});

test('opens the selected Supabase project detail page', async () => {
  const user = {
    id: 'detail-project-owner',
    email: 'detail-owner@example.com',
    user_metadata: { full_name: 'Detail Project Owner' },
  };
  const project = {
    id: 'project-detail-001',
    userId: user.id,
    name: 'Project Chi tiết',
    description: 'Nội dung chi tiết từ Supabase',
    category: 'education',
    defaultLanguage: 'vi',
    template: 'presentation',
    coverPath: '',
    coverUrl: '',
    defaultSettingsEnabled: true,
    defaultAvatar: '',
    defaultVoice: '',
    aspectRatio: '16:9',
    resolution: '1080p',
    status: 'inProgress',
    progress: 25,
    documentCount: 2,
    videoCount: 1,
    createdAt: '2026-07-30T08:00:00.000Z',
    updatedAt: '2026-07-31T08:00:00.000Z',
  };
  supabase.auth.getSession.mockResolvedValueOnce({
    data: { session: { user } },
    error: null,
  });
  layDanhSachDuAn.mockResolvedValueOnce({
    data: [project],
    error: null,
  });

  render(<App />);

  await screen.findByRole('button', { name: /detail project owner creator/i });
  fireEvent.click(screen.getByRole('button', { name: /^dự án$/i }));
  await screen.findByRole('heading', { name: 'Project Chi tiết' });
  fireEvent.click(screen.getByRole('button', { name: 'Mở Project' }));

  expect(await screen.findByRole('heading', { name: 'Thông tin Project' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Project Chi tiết' })).toBeInTheDocument();
  expect(screen.getAllByText('Nội dung chi tiết từ Supabase').length).toBeGreaterThan(0);
  expect(screen.getAllByText('25%').length).toBeGreaterThan(0);
  expect(screen.getAllByRole('button', { name: 'Thêm chương' }).length).toBeGreaterThan(0);

  fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách Project' }));
  expect(await screen.findByRole('heading', { name: /^dự án$/i })).toBeInTheDocument();
});

test('opens the create project page from the dashboard new project button', async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: {
      session: {
        user: {
          id: 'dashboard-project-owner',
          email: 'dashboard-owner@example.com',
          user_metadata: { full_name: 'Dashboard Owner' },
        },
      },
    },
    error: null,
  });

  render(<App />);

  await screen.findByRole('button', { name: /dashboard owner creator/i });
  fireEvent.click(screen.getByRole('button', { name: /^project mới$/i }));

  expect(await screen.findByRole('heading', { name: 'Tạo Project' })).toBeInTheDocument();
  expect(screen.getByLabelText(/tên project/i)).toBeInTheDocument();
});

test('switches the entire website to English and remembers the selection', async () => {
  render(<App />);

  expect(screen.getByRole('button', { name: /^dự án$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^avatar$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^hồ sơ$/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /^cài đặt$/i }));
  const languageSelect = await screen.findByLabelText('Ngôn ngữ');
  fireEvent.change(languageSelect, { target: { value: 'en' } });

  expect(await screen.findByRole('heading', { name: /^settings$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^projects$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^avatar$/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^profile$/i })).toBeInTheDocument();
  expect(screen.getByText('Appearance settings')).toBeInTheDocument();
  expect(screen.getByText('Notification settings')).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute('lang', 'en');

  fireEvent.click(screen.getByRole('button', { name: /^dashboard$/i }));
  expect(await screen.findByRole('heading', { name: /^hello/i })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Quick actions' })).toBeInTheDocument();

  await waitFor(() => {
    expect(JSON.parse(window.localStorage.getItem('ai-video-studio-settings'))).toMatchObject({
      language: 'en',
    });
  });
});

test('collapses the desktop sidebar to icons and expands it again', async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: {
      session: {
        user: {
          id: 'user-sidebar',
          email: 'sidebar@example.com',
          user_metadata: { full_name: 'Sidebar Tester' },
        },
      },
    },
    error: null,
  });
  render(<App />);
  await screen.findByRole('button', { name: /sidebar tester creator/i });

  const sidebar = screen.getByRole('complementary', { name: 'Thanh bên' });
  const toggleSwitch = screen.getByRole('checkbox', { name: 'Mở rộng thanh bên' });

  expect(sidebar).toHaveClass('collapsed');
  expect(toggleSwitch).not.toBeChecked();
  expect(screen.getByRole('button', { name: 'Dự án' })).toBeInTheDocument();

  fireEvent.click(toggleSwitch);
  expect(sidebar).not.toHaveClass('collapsed');
  expect(toggleSwitch).toBeChecked();
  expect(toggleSwitch).toHaveAccessibleName('Thu gọn thanh bên');

  fireEvent.click(toggleSwitch);
  expect(sidebar).toHaveClass('collapsed');
  expect(toggleSwitch).not.toBeChecked();
});

test('toggles dark mode from the header switch and saves the theme', async () => {
  supabase.auth.getSession.mockResolvedValueOnce({
    data: {
      session: {
        user: {
          id: 'user-theme',
          email: 'theme@example.com',
          user_metadata: { full_name: 'Theme Tester' },
        },
      },
    },
    error: null,
  });
  render(<App />);
  await screen.findByRole('button', { name: /theme tester creator/i });

  const themeSwitch = screen.getByRole('checkbox', { name: 'Bật chế độ tối' });
  fireEvent.click(themeSwitch);

  expect(themeSwitch).toBeChecked();
  expect(themeSwitch).toHaveAccessibleName('Bật chế độ sáng');
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

  await waitFor(() => {
    expect(JSON.parse(window.localStorage.getItem('ai-video-studio-settings'))).toMatchObject({
      theme: 'dark',
    });
  });

  fireEvent.click(themeSwitch);
  expect(themeSwitch).not.toBeChecked();
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
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

  fireEvent.click(await screen.findByRole('button', { name: /^hồ sơ$/i }));

  expect(
    await screen.findByRole('heading', { name: 'Nguyễn Văn Chương' })
  ).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Tổng quan hoạt động' })).toBeInTheDocument();
  expect(screen.getByText('Dự án đã làm')).toBeInTheDocument();
  expect(screen.getByText('Tệp đã tải lên')).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Dung lượng lưu trữ' })).toBeInTheDocument();
  expect(screen.getByRole('img', { name: 'Chưa sử dụng dung lượng lưu trữ' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Trạng thái tài khoản' })).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Bảo mật' })).not.toBeInTheDocument();

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
  fireEvent.click(await screen.findByRole('button', { name: /^hồ sơ$/i }));

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
