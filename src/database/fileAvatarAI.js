import { supabase } from './supabase';

const TEN_BUCKET_AVATAR_AI = 'ai-avatars';
const KICH_THUOC_AVATAR_TOI_DA = 10 * 1024 * 1024;

const DINH_DANG_HOP_LE = {
  'image/png': 'PNG',
  'image/jpeg': 'JPG',
  'image/webp': 'WEBP',
};

function suyLuanDinhDang(file) {
  return DINH_DANG_HOP_LE[file.type] || null;
}

function kiemTraAvatar(file) {
  if (!suyLuanDinhDang(file)) {
    return {
      code: 'INVALID_AVATAR_TYPE',
      message: 'Avatar must be a PNG, JPG, or WebP image.',
    };
  }
  if (file.size > KICH_THUOC_AVATAR_TOI_DA) {
    return {
      code: 'AVATAR_TOO_LARGE',
      message: 'Avatar cannot be larger than 10 MB.',
    };
  }
  return null;
}

function layKichThuocAnh(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: null, height: null });
    };
    img.src = url;
  });
}

async function taiFileAvatarAI(userId, avatarId, file) {
  const loiKiemTra = kiemTraAvatar(file);
  if (loiKiemTra) return { data: null, error: loiKiemTra };

  const duongDan = `${userId}/${avatarId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_AVATAR_AI)
    .upload(duongDan, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

  if (error) return { data: null, error };
  const kichThuoc = await layKichThuocAnh(file);
  return {
    data: { path: data.path, format: suyLuanDinhDang(file), ...kichThuoc },
    error: null,
  };
}

async function layUrlAvatarAI(duongDan) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_AVATAR_AI)
    .createSignedUrl(duongDan, 3600);

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function layUrlTaiXuongAvatarAI(duongDan, tenFile) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_AVATAR_AI)
    .createSignedUrl(duongDan, 300, { download: tenFile || true });

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function xoaFileAvatarAI(duongDan) {
  if (!duongDan) return { data: null, error: null };
  return supabase.storage
    .from(TEN_BUCKET_AVATAR_AI)
    .remove([duongDan]);
}

export {
  KICH_THUOC_AVATAR_TOI_DA,
  TEN_BUCKET_AVATAR_AI,
  kiemTraAvatar,
  layUrlAvatarAI,
  layUrlTaiXuongAvatarAI,
  suyLuanDinhDang,
  taiFileAvatarAI,
  xoaFileAvatarAI,
};
