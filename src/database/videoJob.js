import { supabase } from './supabase';

const CAC_COT_JOB = 'id, stage, status, error_message, video_url, pptx_path';

function chuyenJobSangGiaoDien(banGhi) {
  return {
    id: banGhi.id,
    stage: banGhi.stage,
    status: banGhi.status,
    errorMessage: banGhi.error_message || '',
    videoUrl: banGhi.video_url || '',
    pptxPath: banGhi.pptx_path || '',
  };
}

async function taoVideoJob(user, chapterId) {
  const { data, error } = await supabase
    .from('video_jobs')
    .insert({ user_id: user.id, chapter_id: chapterId })
    .select(CAC_COT_JOB)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenJobSangGiaoDien(data), error: null };
}

async function layVideoJob(jobId) {
  const { data, error } = await supabase
    .from('video_jobs')
    .select(CAC_COT_JOB)
    .eq('id', jobId)
    .maybeSingle();

  if (error || !data) return { data: null, error: error || null };
  return { data: chuyenJobSangGiaoDien(data), error: null };
}

async function capNhatVideoJob(jobId, thayDoi) {
  const { data, error } = await supabase
    .from('video_jobs')
    .update(thayDoi)
    .eq('id', jobId)
    .select(CAC_COT_JOB)
    .single();

  if (error) return { data: null, error };
  return { data: chuyenJobSangGiaoDien(data), error: null };
}

async function layUrlPptx(duongDan) {
  const { data, error } = await supabase.storage
    .from('pptx')
    .createSignedUrl(duongDan, 3600);

  if (error) return { data: null, error };
  return { data: { url: data.signedUrl }, error: null };
}

export {
  capNhatVideoJob,
  layUrlPptx,
  layVideoJob,
  taoVideoJob,
};
