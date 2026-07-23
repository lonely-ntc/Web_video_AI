import { supabase } from './supabase';

const TEN_BUCKET_ANH_DAI_DIEN = 'avatars';

async function taiAnhDaiDien(userId, file) {
  const duongDan = `${userId}/avatar`;
  const { data, error } = await supabase.storage
    .from(TEN_BUCKET_ANH_DAI_DIEN)
    .upload(duongDan, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: true,
    });

  if (error) return { data: null, error };

  const { data: publicUrlData } = supabase.storage
    .from(TEN_BUCKET_ANH_DAI_DIEN)
    .getPublicUrl(data.path);

  return {
    data: {
      path: data.path,
      url: `${publicUrlData.publicUrl}?v=${Date.now()}`,
    },
    error: null,
  };
}

export { TEN_BUCKET_ANH_DAI_DIEN, taiAnhDaiDien };
