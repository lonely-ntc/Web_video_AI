import { supabase } from './supabase';

const TEN_BUCKET_TAI_LIEU = 'documents';
const KICH_THUOC_TAI_LIEU_TOI_DA = 20 * 1024 * 1024;

const DINH_DANG_TAI_LIEU_HOP_LE = {
  'application/pdf': 'pdf',
  'application/msword': 'word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ppt',
  'text/plain': 'txt',
  'text/markdown': 'md',
};

const LOAI_THEO_PHAN_MO_RONG = {
  pdf: 'pdf',
  doc: 'word',
  docx: 'word',
  ppt: 'ppt',
  pptx: 'ppt',
  txt: 'txt',
  md: 'md',
};

function suyLuanLoaiFile(file) {
  if (DINH_DANG_TAI_LIEU_HOP_LE[file.type]) return DINH_DANG_TAI_LIEU_HOP_LE[file.type];
  const phanMoRong = file.name.split('.').pop()?.toLowerCase();
  return LOAI_THEO_PHAN_MO_RONG[phanMoRong] || null;
}

function kiemTraTaiLieu(file) {
  const loai = suyLuanLoaiFile(file);
  if (!loai) {
    return {
      code: 'INVALID_DOCUMENT_TYPE',
      message: 'Document must be a PDF, Word, PowerPoint, TXT, or Markdown file.',
    };
  }
  if (file.size > KICH_THUOC_TAI_LIEU_TOI_DA) {
    return {
      code: 'DOCUMENT_TOO_LARGE',
      message: 'Document cannot be larger than 20 MB.',
    };
  }
  return null;
}

async function taiFileTaiLieu(userId, documentId, file) {
  const loiKiemTra = kiemTraTaiLieu(file);
  if (loiKiemTra) return { data: null, error: loiKiemTra };

  const duongDan = `${userId}/${documentId}/${file.name}`;
  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_TAI_LIEU)
    .upload(duongDan, file, {
      cacheControl: '3600',
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });

  if (error) return { data: null, error };
  return { data: { path: data.path, fileType: suyLuanLoaiFile(file) }, error: null };
}

async function layUrlFileTaiLieu(duongDan) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_TAI_LIEU)
    .createSignedUrl(duongDan, 3600);

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function layUrlTaiXuongTaiLieu(duongDan, tenFile) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_TAI_LIEU)
    .createSignedUrl(duongDan, 300, { download: tenFile || true });

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function xoaFileTaiLieu(duongDan) {
  if (!duongDan) return { data: null, error: null };
  return supabase.storage
    .from(TEN_BUCKET_TAI_LIEU)
    .remove([duongDan]);
}

export {
  KICH_THUOC_TAI_LIEU_TOI_DA,
  TEN_BUCKET_TAI_LIEU,
  kiemTraTaiLieu,
  layUrlFileTaiLieu,
  layUrlTaiXuongTaiLieu,
  suyLuanLoaiFile,
  taiFileTaiLieu,
  xoaFileTaiLieu,
};
