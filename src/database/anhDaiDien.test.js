import { supabase } from './supabase';
import { taiAnhDaiDien } from './anhDaiDien';

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('./supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockUpload.mockResolvedValue({
    data: { path: 'user-123/avatar' },
    error: null,
  });
  mockGetPublicUrl.mockReturnValue({
    data: {
      publicUrl: 'https://example.supabase.co/storage/v1/object/public/avatars/user-123/avatar',
    },
  });
  supabase.storage.from.mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  });
});

test('uploads an avatar to the signed-in users own storage folder', async () => {
  const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
  const { data, error } = await taiAnhDaiDien('user-123', file);

  expect(supabase.storage.from).toHaveBeenCalledWith('avatars');
  expect(mockUpload).toHaveBeenCalledWith(
    'user-123/avatar',
    file,
    {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: true,
    }
  );
  expect(error).toBeNull();
  expect(data.path).toBe('user-123/avatar');
  expect(data.url).toContain('/avatars/user-123/avatar?v=');
});
