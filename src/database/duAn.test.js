import { supabase } from './supabase';
import { layUrlAnhBiaDuAn } from './anhBiaDuAn';
import {
  layDanhSachDuAn,
  taoDuAnNguoiDung,
} from './duAn';

jest.mock('./supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock('./anhBiaDuAn', () => ({
  layUrlAnhBiaDuAn: jest.fn(),
  taiAnhBiaDuAn: jest.fn(),
  xoaAnhBiaDuAn: jest.fn(),
}));

const banGhiDuAn = {
  id: 'project-123',
  user_id: 'user-123',
  name: 'Project Supabase',
  description: 'Mo ta',
  category: 'technology',
  default_language: 'vi',
  video_template: 'basic',
  cover_path: '',
  default_settings_enabled: false,
  default_avatar_id: '',
  default_voice_id: '',
  aspect_ratio: null,
  resolution: null,
  status: 'in_progress',
  progress: 0,
  document_count: 0,
  video_count: 0,
  archived_at: null,
  created_at: '2026-07-31T08:00:00.000Z',
  updated_at: '2026-07-31T08:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  layUrlAnhBiaDuAn.mockResolvedValue({
    data: { url: '' },
    error: null,
  });
});

test('loads projects belonging to the signed-in user', async () => {
  const query = {};
  query.select = jest.fn(() => query);
  query.eq = jest.fn(() => query);
  query.order = jest.fn().mockResolvedValue({
    data: [banGhiDuAn],
    error: null,
  });
  supabase.from.mockReturnValue(query);

  const { data, error } = await layDanhSachDuAn('user-123');

  expect(supabase.from).toHaveBeenCalledWith('projects');
  expect(query.eq).toHaveBeenCalledWith('user_id', 'user-123');
  expect(query.order).toHaveBeenCalledWith('updated_at', { ascending: false });
  expect(error).toBeNull();
  expect(data[0]).toMatchObject({
    id: 'project-123',
    name: 'Project Supabase',
    status: 'inProgress',
  });
});

test('inserts a project with the current user id', async () => {
  const single = jest.fn().mockResolvedValue({
    data: banGhiDuAn,
    error: null,
  });
  const select = jest.fn(() => ({ single }));
  const insert = jest.fn(() => ({ select }));
  supabase.from.mockReturnValue({ insert });

  const user = { id: 'user-123' };
  const { data, error } = await taoDuAnNguoiDung(user, {
    name: 'Project Supabase',
    description: 'Mo ta',
    category: 'technology',
    language: 'vi',
    template: 'basic',
    defaultSettingsEnabled: false,
    defaultAvatar: '',
    defaultVoice: '',
    aspectRatio: '',
    resolution: '',
    coverFile: null,
  });

  expect(insert).toHaveBeenCalledWith(expect.objectContaining({
    user_id: 'user-123',
    name: 'Project Supabase',
    status: 'in_progress',
  }));
  expect(error).toBeNull();
  expect(data.name).toBe('Project Supabase');
});
