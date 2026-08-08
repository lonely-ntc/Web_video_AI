import { supabase } from './supabase';

const TEN_BUCKET_ANH_BIA_DU_AN = 'project-covers';
const KICH_THUOC_ANH_BIA_TOI_DA = 10 * 1024 * 1024;
const DINH_DANG_ANH_HOP_LE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

function kiemTraAnhBia(file) {
  if (!file || !DINH_DANG_ANH_HOP_LE[file.type]) {
    return {
      code: 'INVALID_PROJECT_COVER_TYPE',
      message: 'Project cover must be a JPG, PNG, or WebP image.',
    };
  }
  if (file.size > KICH_THUOC_ANH_BIA_TOI_DA) {
    return {
      code: 'PROJECT_COVER_TOO_LARGE',
      message: 'Project cover cannot be larger than 10 MB.',
    };
  }
  return null;
}

async function taiAnhBiaDuAn(userId, projectId, file) {
  const loiKiemTra = kiemTraAnhBia(file);
  if (loiKiemTra) return { data: null, error: loiKiemTra };

  const phanMoRong = DINH_DANG_ANH_HOP_LE[file.type];
  const duongDan = `${userId}/${projectId}/cover.${phanMoRong}`;
  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_ANH_BIA_DU_AN)
    .upload(duongDan, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

  if (error) return { data: null, error };
  return { data: { path: data.path }, error: null };
}

async function layUrlAnhBiaDuAn(duongDan) {
  if (!duongDan) return { data: { url: '' }, error: null };

  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_ANH_BIA_DU_AN)
    .createSignedUrl(duongDan, 3600);

  if (error) return { data: { url: '' }, error };
  return { data: { url: data.signedUrl || '' }, error: null };
}

async function xoaAnhBiaDuAn(duongDan) {
  if (!duongDan) return { data: null, error: null };
  return supabase.storage
    .from(TEN_BUCKET_ANH_BIA_DU_AN)
    .remove([duongDan]);
}

export {
  KICH_THUOC_ANH_BIA_TOI_DA,
  TEN_BUCKET_ANH_BIA_DU_AN,
  kiemTraAnhBia,
  layUrlAnhBiaDuAn,
  taiAnhBiaDuAn,
  xoaAnhBiaDuAn,
};
