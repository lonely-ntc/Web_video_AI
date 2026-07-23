import { supabase } from './supabase';
import {
  capNhatAnhDaiDien,
  layHoSoNguoiDung,
  luuHoSoNguoiDung,
} from './hoSoNguoiDung';

const mockMaybeSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockUpsert = jest.fn();
const mockUpsertSelect = jest.fn();
const mockSingle = jest.fn();

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockMaybeSingle.mockResolvedValue({ data: null, error: null });
  mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
  mockSelect.mockReturnValue({ eq: mockEq });
  mockSingle.mockResolvedValue({
    data: { id: 'user-b' },
    error: null,
  });
  mockUpsertSelect.mockReturnValue({ single: mockSingle });
  mockUpsert.mockReturnValue({ select: mockUpsertSelect });
  supabase.from.mockReturnValue({
    select: mockSelect,
    upsert: mockUpsert,
  });
});

test('loads only the profile matching the signed-in account id', async () => {
  await layHoSoNguoiDung('user-a');

  expect(supabase.from).toHaveBeenCalledWith('profiles');
  expect(mockEq).toHaveBeenCalledWith('id', 'user-a');
  expect(mockMaybeSingle).toHaveBeenCalledTimes(1);
});

test('saves the profile using the account id as its unique key', async () => {
  await luuHoSoNguoiDung({
    id: 'user-b',
    email: 'binh@example.com',
  }, {
    fullName: 'Nguyễn Văn Bình',
    displayName: 'Bình',
    phone: '0900000000',
    company: 'AI Studio',
    jobTitle: 'Editor',
    bio: 'Sáng tạo video.',
  });

  expect(mockUpsert).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'user-b',
      email: 'binh@example.com',
      full_name: 'Nguyễn Văn Bình',
      display_name: 'Bình',
      phone: '0900000000',
      company: 'AI Studio',
      job_title: 'Editor',
      bio: 'Sáng tạo video.',
    }),
    { onConflict: 'id' }
  );
  expect(mockUpsertSelect).toHaveBeenCalledWith(expect.stringContaining('email'));
  expect(mockSingle).toHaveBeenCalledTimes(1);
});

test('stores avatar fields in the users profile row', async () => {
  await capNhatAnhDaiDien({
    id: 'user-b',
    email: 'binh@example.com',
  }, {
    path: 'user-b/avatar',
    url: 'https://example.supabase.co/avatars/user-b/avatar?v=1',
  });

  expect(mockUpsert).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 'user-b',
      email: 'binh@example.com',
      avatar_path: 'user-b/avatar',
      avatar_url: 'https://example.supabase.co/avatars/user-b/avatar?v=1',
    }),
    { onConflict: 'id' }
  );
});
