import { supabase } from './supabase';

const TEN_BUCKET_VIDEO = 'videos';
const KICH_THUOC_VIDEO_TOI_DA = 500 * 1024 * 1024;

const DINH_DANG_HOP_LE = {
  'video/mp4': 'MP4',
  'video/quicktime': 'MOV',
  'video/webm': 'WEBM',
};

function suyLuanDinhDang(file) {
  return DINH_DANG_HOP_LE[file.type] || file.name.split('.').pop()?.toUpperCase() || null;
}

function kiemTraVideo(file) {
  if (!DINH_DANG_HOP_LE[file.type]) {
    return {
      code: 'INVALID_VIDEO_TYPE',
      message: 'Video must be an MP4, MOV, or WebM file.',
    };
  }
  if (file.size > KICH_THUOC_VIDEO_TOI_DA) {
    return {
      code: 'VIDEO_TOO_LARGE',
      message: 'Video cannot be larger than 500 MB.',
    };
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

  const duongDan = `${userId}/${videoId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_VIDEO)
    .upload(duongDan, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

  if (error) return { data: null, error };
  const thongTin = await layThongTinVideo(file);
  return {
    data: { path: data.path, format: suyLuanDinhDang(file), ...thongTin },
    error: null,
  };
}

async function layUrlVideo(duongDan) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_VIDEO)
    .createSignedUrl(duongDan, 3600);

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function layUrlTaiXuongVideo(duongDan, tenFile) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_VIDEO)
    .createSignedUrl(duongDan, 300, { download: tenFile || true });

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function xoaFileVideo(duongDan) {
  if (!duongDan) return { data: null, error: null };
  return supabase.storage
    .from(TEN_BUCKET_VIDEO)
    .remove([duongDan]);
}

export {
  KICH_THUOC_VIDEO_TOI_DA,
  TEN_BUCKET_VIDEO,
  kiemTraVideo,
  layUrlTaiXuongVideo,
  layUrlVideo,
  suyLuanDinhDang,
  taiFileVideo,
  xoaFileVideo,
};
