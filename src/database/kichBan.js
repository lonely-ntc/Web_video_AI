import { supabase } from './supabase';

const CAC_COT_KICH_BAN = [
  'id',
  'user_id',
  'project_id',
  'chapter_id',
  'content',
  'slides',
  'version',
  'status',
  'source',
  'word_count',
  'created_at',
  'updated_at',
].join(', ');

const TRANG_THAI_HOP_LE = ['draft', 'generating', 'completed', 'failed'];

function chuyenKichBanSangGiaoDien(banGhi) {
  return {
    id: banGhi.id,
    userId: banGhi.user_id,
    projectId: banGhi.project_id,
    chapterId: banGhi.chapter_id,
    content: banGhi.content || '',
    slides: Array.isArray(banGhi.slides) ? banGhi.slides : [],
    version: Number(banGhi.version) || 1,
    status: TRANG_THAI_HOP_LE.includes(banGhi.status) ? banGhi.status : 'draft',
    source: banGhi.source || 'ai',
    wordCount: Number(banGhi.word_count) || 0,
    createdAt: banGhi.created_at,
    updatedAt: banGhi.updated_at,
  };
}

function demSoTu(noiDung) {
  return (noiDung || '').trim().split(/\s+/).filter(Boolean).length;
}

async function layDanhSachKichBan(userId, chapterId) {
  const { data, error } = await supabase
    .from('scripts')
    .select(CAC_COT_KICH_BAN)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false });

  if (error) return { data: null, error };
  return { data: (data || []).map(chuyenKichBanSangGiaoDien), error: null };
}

async function layKichBanMoiNhat(userId, chapterId) {
  const { data, error } = await supabase
    .from('scripts')
    .select(CAC_COT_KICH_BAN)
    .eq('user_id', userId)
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: data ? chuyenKichBanSangGiaoDien(data) : null, error: null };
}

async function taoKichBanMoi(user, projectId, chapterId, content, source = 'ai') {
  const { data: banGhiMoiNhat, error: loiLayPhienBan } = await supabase
    .from('scripts')
    .select('version')
    .eq('user_id', user.id)
    .eq('chapter_id', chapterId)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (loiLayPhienBan) return { data: null, error: loiLayPhienBan };

  const phienBanMoi = (banGhiMoiNhat?.version || 0) + 1;

  const { data, error } = await supabase
    .from('scripts')
    .insert({
      user_id: user.id,
      project_id: projectId || null,
      chapter_id: chapterId,
      content: content || '',
      version: phienBanMoi,
      status: 'completed',
      source,
      word_count: demSoTu(content),
    })
    .select(CAC_COT_KICH_BAN)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenKichBanSangGiaoDien(data), error: null };
}

async function capNhatKichBan(userId, scriptId, content) {
  const { data, error } = await supabase
    .from('scripts')
    .update({ content, word_count: demSoTu(content) })
    .eq('id', scriptId)
    .eq('user_id', userId)
    .select(CAC_COT_KICH_BAN)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenKichBanSangGiaoDien(data), error: null };
}

async function xoaKichBan(userId, scriptId) {
  const { error } = await supabase
    .from('scripts')
    .delete()
    .eq('id', scriptId)
    .eq('user_id', userId);

  return { error: error || null };
}

async function taoKichBanBangAI(chapterId) {
  const { data, error } = await supabase.functions.invoke('generate-script', {
    body: { chapterId },
  });

  // supabase-js tra loi qua truong error khi Edge Function tra ve status
  // loi (vi du 4xx/5xx); noi dung chi tiet loi nam trong data.error khi
  // ham tra ve 200 nhung than payload co error (truong hop it gap).
  if (error) {
    let chiTiet = null;
    try {
      chiTiet = await error.context?.json?.();
    } catch {
      chiTiet = null;
    }
    return { data: null, error: chiTiet?.error || { code: 'FUNCTION_ERROR', message: error.message } };
  }

  if (data?.error) return { data: null, error: data.error };
  return { data: chuyenKichBanSangGiaoDien(data.data), error: null };
}

export {
  CAC_COT_KICH_BAN,
  capNhatKichBan,
  chuyenKichBanSangGiaoDien,
  layDanhSachKichBan,
  layKichBanMoiNhat,
  taoKichBanBangAI,
  taoKichBanMoi,
  xoaKichBan,
};
