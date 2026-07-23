import { supabase } from './supabase';

const CAC_COT_HO_SO = [
  'id',
  'email',
  'full_name',
  'display_name',
  'phone',
  'company',
  'job_title',
  'bio',
  'avatar_url',
  'avatar_path',
  'created_at',
  'updated_at',
].join(', ');

function taoBanGhiHoSo(user, hoSo) {
  return {
    id: user.id,
    email: user.email || '',
    full_name: hoSo.fullName.trim(),
    display_name: hoSo.displayName.trim(),
    phone: hoSo.phone.trim(),
    company: hoSo.company.trim(),
    job_title: hoSo.jobTitle.trim(),
    bio: hoSo.bio.trim(),
    updated_at: new Date().toISOString(),
  };
}

async function layHoSoNguoiDung(userId) {
  return supabase
    .from('profiles')
    .select(CAC_COT_HO_SO)
    .eq('id', userId)
    .maybeSingle();
}

async function luuHoSoNguoiDung(user, hoSo) {
  return supabase
    .from('profiles')
    .upsert(taoBanGhiHoSo(user, hoSo), { onConflict: 'id' })
    .select(CAC_COT_HO_SO)
    .single();
}

async function capNhatAnhDaiDien(user, anhDaiDien) {
  return supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || '',
      avatar_url: anhDaiDien.url,
      avatar_path: anhDaiDien.path,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
    .select('id, avatar_url, avatar_path')
    .single();
}

export {
  capNhatAnhDaiDien,
  layHoSoNguoiDung,
  luuHoSoNguoiDung,
};
