// Am thanh giong doc (TTS) -> luu tren CLOUDINARY (resource_type "video" cho audio).
// Cot `voice_audio.file_path` bay gio chua secure_url cua Cloudinary.

import { taiLenCloudinary, publicIdTuUrl, xoaCloudinary } from '../services/cloudinary';

const KICH_THUOC_AM_THANH_TOI_DA = 20 * 1024 * 1024;
const THU_MUC_AM_THANH = 'ai-video-web/voice-audio';

async function taiFileAmThanhGiongDoc(userId, chapterId, blob, tenFile) {
  const { data, error } = await taiLenCloudinary(blob, {
    resourceType: 'video',
    folder: `${THU_MUC_AM_THANH}/${userId}/${chapterId}`,
    fileName: tenFile,
    tags: ['voice-audio', userId],
  });
  if (error) return { data: null, error };

  return {
    data: { path: data.url, sizeBytes: data.bytes || blob.size, duration: Math.round(data.duration) || 0 },
    error: null,
  };
}

async function layUrlAmThanhGiongDoc(filePath) {
  return { data: { url: filePath || '' }, error: null };
}

async function xoaFileAmThanhGiongDoc(filePath) {
  if (!filePath) return { data: null, error: null };
  const { publicId, resourceType } = publicIdTuUrl(filePath);
  return xoaCloudinary(publicId, resourceType);
}

export {
  KICH_THUOC_AM_THANH_TOI_DA,
  layUrlAmThanhGiongDoc,
  taiFileAmThanhGiongDoc,
  xoaFileAmThanhGiongDoc,
};
