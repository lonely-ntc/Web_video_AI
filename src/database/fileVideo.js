// Video AI hoan chinh -> luu tren CLOUDINARY (khong con dung Supabase Storage).
// Cot `videos.file_path` bay gio chua secure_url cua Cloudinary.

import {
  taiLenCloudinary,
  urlTaiXuongTuUrl,
  publicIdTuUrl,
  xoaCloudinary,
} from '../services/cloudinary';

const KICH_THUOC_VIDEO_TOI_DA = 500 * 1024 * 1024;
const THU_MUC_VIDEO = 'ai-video-web/videos';

const DINH_DANG_HOP_LE = {
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/webm': 'WEBM',
};

function suyLuanDinhDang(file) {
  return DINH_DANG_HOP_LE[file.type] || file.name?.split('.').pop()?.toUpperCase() || null;
}

function kiemTraVideo(file) {
  if (!DINH_DANG_HOP_LE[file.type]) {
    return { code: 'INVALID_VIDEO_TYPE', message: 'Video must be an MP4, MOV, or WebM file.' };
  }
  if (file.size > KICH_THUOC_VIDEO_TOI_DA) {
    return { code: 'VIDEO_TOO_LARGE', message: 'Video cannot be larger than 500 MB.' };
  }
  return null;
}

function uocLuongDoPhanGiai(height) {
  if (!height) return '';
  if (height >= 2160) return '2160p';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  return `${height}p`;
}

function rutGonTiLe(width, height) {
  if (!width || !height) return '';
  const ucln = (a, b) => (b === 0 ? a : ucln(b, a % b));
  const boChia = ucln(width, height) || 1;
  return `${width / boChia}:${height / boChia}`;
}

function layThongTinVideo(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({
        durationSeconds: Math.round(video.duration) || 0,
        resolution: uocLuongDoPhanGiai(video.videoHeight),
        aspectRatio: rutGonTiLe(video.videoWidth, video.videoHeight),
      });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSeconds: 0, resolution: '', aspectRatio: '' });
    };
    video.src = url;
  });
}

async function taiFileVideo(userId, videoId, file) {
  const loiKiemTra = kiemTraVideo(file);
  if (loiKiemTra) return { data: null, error: loiKiemTra };

  const thongTin = await layThongTinVideo(file);

  const { data, error } = await taiLenCloudinary(file, {
    resourceType: 'video',
    folder: `${THU_MUC_VIDEO}/${userId}/${videoId}`,
    tags: ['video', userId],
  });
  if (error) return { data: null, error };

  return {
    data: {
      path: data.url,
      format: suyLuanDinhDang(file),
      durationSeconds: thongTin.durationSeconds || Math.round(data.duration) || 0,
      resolution: thongTin.resolution || uocLuongDoPhanGiai(data.height),
      aspectRatio: thongTin.aspectRatio || rutGonTiLe(data.width, data.height),
    },
    error: null,
  };
}

// file_path da la URL day du -> tra thang ra.
async function layUrlVideo(filePath) {
  return { data: { url: filePath || '' }, error: null };
}

async function layUrlTaiXuongVideo(filePath, tenFile) {
  if (!filePath) return { data: { url: '' }, error: null };
  return { data: { url: urlTaiXuongTuUrl(filePath, tenFile) }, error: null };
}

async function xoaFileVideo(filePath) {
  if (!filePath) return { data: null, error: null };
  const { publicId, resourceType } = publicIdTuUrl(filePath);
  return xoaCloudinary(publicId, resourceType);
}

export {
  KICH_THUOC_VIDEO_TOI_DA,
  kiemTraVideo,
  layUrlTaiXuongVideo,
  layUrlVideo,
  suyLuanDinhDang,
  taiFileVideo,
  xoaFileVideo,
};
