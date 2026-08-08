import { supabase } from './supabase';
import {
  layUrlAnhBiaDuAn,
  taiAnhBiaDuAn,
} from './anhBiaDuAn';

const mockUpload = jest.fn();
const mockCreateSignedUrl = jest.fn();

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
    data: { path: 'user-123/project-123/cover.png' },
    error: null,
  });
  mockCreateSignedUrl.mockResolvedValue({
    data: { signedUrl: 'https://example.supabase.co/signed-cover' },
    error: null,
  });
  supabase.storage.from.mockReturnValue({
    upload: mockUpload,
    createSignedUrl: mockCreateSignedUrl,
  });
});

test('uploads a project cover to the users own project folder', async () => {
  const file = new File(['cover'], 'cover.png', { type: 'image/png' });
  const { data, error } = await taiAnhBiaDuAn('user-123', 'project-123', file);

  expect(supabase.storage.from).toHaveBeenCalledWith('project-covers');
  expect(mockUpload).toHaveBeenCalledWith(
    'user-123/project-123/cover.png',
    file,
    {
      cacheControl: '3600',
      contentType: 'image/png',
      upsert: true,
    }
  );
  expect(error).toBeNull();
  expect(data.path).toBe('user-123/project-123/cover.png');
});

test('creates a temporary signed URL for a private project cover', async () => {
  const { data, error } = await layUrlAnhBiaDuAn('user-123/project-123/cover.png');

  expect(mockCreateSignedUrl).toHaveBeenCalledWith(
    'user-123/project-123/cover.png',
    3600
  );
  expect(error).toBeNull();
  expect(data.url).toBe('https://example.supabase.co/signed-cover');
});

test('rejects an unsupported project cover before uploading', async () => {
  const file = new File(['cover'], 'cover.gif', { type: 'image/gif' });
  const { data, error } = await taiAnhBiaDuAn('user-123', 'project-123', file);

  expect(data).toBeNull();
  expect(error.code).toBe('INVALID_PROJECT_COVER_TYPE');
  expect(mockUpload).not.toHaveBeenCalled();
});
