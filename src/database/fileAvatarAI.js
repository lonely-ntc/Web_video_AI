// Avatar AI (anh nhan vat dung de tao video) -> luu tren CLOUDINARY.
// Cot `ai_avatars.file_path` bay gio chua secure_url cua Cloudinary.

import {
  taiLenCloudinary,
  urlTaiXuongTuUrl,
  publicIdTuUrl,
  xoaCloudinary,
} from '../services/cloudinary';

const KICH_THUOC_AVATAR_TOI_DA = 10 * 1024 * 1024;
const THU_MUC_AVATAR = 'ai-video-web/avatars';

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
    return { code: 'INVALID_AVATAR_TYPE', message: 'Avatar must be a PNG, JPG, or WebP image.' };
  }
  if (file.size > KICH_THUOC_AVATAR_TOI_DA) {
    return { code: 'AVATAR_TOO_LARGE', message: 'Avatar cannot be larger than 10 MB.' };
  }
  return null;
}

async function taiFileAvatarAI(userId, avatarId, file) {
  const loiKiemTra = kiemTraAvatar(file);
  if (loiKiemTra) return { data: null, error: loiKiemTra };

  const { data, error } = await taiLenCloudinary(file, {
    resourceType: 'image',
    folder: `${THU_MUC_AVATAR}/${userId}/${avatarId}`,
    tags: ['avatar', userId],
  });
  if (error) return { data: null, error };

  return {
    data: {
      path: data.url,
      format: suyLuanDinhDang(file),
      width: data.width || null,
      height: data.height || null,
    },
    error: null,
  };
}

async function layUrlAvatarAI(filePath) {
  return { data: { url: filePath || '' }, error: null };
}

async function layUrlTaiXuongAvatarAI(filePath, tenFile) {
  if (!filePath) return { data: { url: '' }, error: null };
  return { data: { url: urlTaiXuongTuUrl(filePath, tenFile) }, error: null };
}

async function xoaFileAvatarAI(filePath) {
  if (!filePath) return { data: null, error: null };
  const { publicId, resourceType } = publicIdTuUrl(filePath);
  return xoaCloudinary(publicId, resourceType);
}

export {
  KICH_THUOC_AVATAR_TOI_DA,
  kiemTraAvatar,
  layUrlAvatarAI,
  layUrlTaiXuongAvatarAI,
  suyLuanDinhDang,
  taiFileAvatarAI,
  xoaFileAvatarAI,
};
