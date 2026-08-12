// Edge Function: generate-script
// Nhan chapterId, doc noi dung tai lieu (.txt/.md) da upload cho chuong do,
// goi OpenAI de tao kich ban, roi luu ket qua vao bang public.scripts.
//
// Chay bang chinh JWT cua nguoi dung goi request (khong dung service_role),
// nen moi truy van/insert deu tu dong bi RLS gioi han theo dung tai khoan do.
//
// Trien khai:
//   supabase functions deploy generate-script
// Thiet lap secret (mot lan):
//   supabase secrets set OPENAI_API_KEY=sk-...

import { createClient } from 'npm:@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const CAC_DINH_DANG_DOC_DUOC_VAN_BAN = new Set(['txt', 'md']);
const OPENAI_MODEL = 'gpt-4o-mini';

function traLoiJson(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function demSoTu(noiDung) {
  return (noiDung || '').trim().split(/\s+/).filter(Boolean).length;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { chapterId } = await req.json();
    if (!chapterId) {
      return traLoiJson({ error: { code: 'MISSING_CHAPTER_ID', message: 'Thieu chapterId.' } }, 400);
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      return traLoiJson({
        error: { code: 'MISSING_OPENAI_KEY', message: 'Chua thiet lap OPENAI_API_KEY tren Supabase.' },
      }, 500);
    }

    // Client chay voi JWT cua nguoi goi -> moi truy van deu tuan theo RLS
    // cua chinh tai khoan do, khong the doc/ghi du lieu tai khoan khac.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL'),
      Deno.env.get('SUPABASE_ANON_KEY'),
      { global: { headers: { Authorization: req.headers.get('Authorization') } } },
    );

    const { data: { user }, error: loiXacThuc } = await supabase.auth.getUser();
    if (loiXacThuc || !user) {
      return traLoiJson({ error: { code: 'UNAUTHORIZED', message: 'Chua dang nhap hoac phien het han.' } }, 401);
    }

    const { data: chuong, error: loiChuong } = await supabase
      .from('chapters')
      .select('id, project_id, name, description')
      .eq('id', chapterId)
      .single();

    if (loiChuong || !chuong) {
      return traLoiJson({ error: { code: 'CHAPTER_NOT_FOUND', message: 'Khong tim thay chuong nay.' } }, 404);
    }

    const { data: danhSachTaiLieu, error: loiTaiLieu } = await supabase
      .from('documents')
      .select('id, name, file_path, file_type, status')
      .eq('chapter_id', chapterId);

    if (loiTaiLieu) {
      return traLoiJson({ error: { code: 'LOAD_DOCUMENTS_FAILED', message: loiTaiLieu.message } }, 500);
    }

    const taiLieuVanBan = (danhSachTaiLieu || []).filter(
      (tl) => tl.status === 'ready' && CAC_DINH_DANG_DOC_DUOC_VAN_BAN.has(tl.file_type),
    );

    if (taiLieuVanBan.length === 0) {
      return traLoiJson({
        error: {
          code: 'NO_SUPPORTED_DOCUMENTS',
          message: 'Chua co tai lieu dang .txt hoac .md nao trong chuong nay de AI doc noi dung. '
            + 'Cac dinh dang PDF/Word/PowerPoint chua duoc ho tro trich xuat van ban.',
        },
      }, 422);
    }

    const noiDungTaiLieu = [];
    for (const taiLieu of taiLieuVanBan) {
      const { data: file, error: loiTai } = await supabase.storage
        .from('documents')
        .download(taiLieu.file_path);

      if (loiTai || !file) continue;
      const noiDung = await file.text();
      noiDungTaiLieu.push(`### ${taiLieu.name}\n${noiDung}`);
    }

    if (noiDungTaiLieu.length === 0) {
      return traLoiJson({
        error: { code: 'DOWNLOAD_DOCUMENTS_FAILED', message: 'Khong tai duoc noi dung tai lieu nao.' },
      }, 500);
    }

    const prompt = [
      `Ten chuong: ${chuong.name}`,
      chuong.description ? `Mo ta chuong: ${chuong.description}` : '',
      '',
      'Noi dung tai lieu nguon:',
      noiDungTaiLieu.join('\n\n'),
    ].filter(Boolean).join('\n');

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: 'Ban la tro ly viet kich ban video huong dan/dao tao bang tieng Viet. '
              + 'Dua tren tai lieu nguon duoc cung cap, viet mot kich ban video ro rang, '
              + 'mach lac, chia thanh cac doan tu nhien de nguoi dan chuong trinh doc thanh loi thoai. '
              + 'Khong bia them thong tin khong co trong tai lieu.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!openaiRes.ok) {
      const chiTiet = await openaiRes.text();
      return traLoiJson({
        error: { code: 'OPENAI_REQUEST_FAILED', message: `OpenAI loi: ${chiTiet}` },
      }, 502);
    }

    const openaiData = await openaiRes.json();
    const noiDungKichBan = openaiData.choices?.[0]?.message?.content?.trim();

    if (!noiDungKichBan) {
      return traLoiJson({ error: { code: 'EMPTY_OPENAI_RESPONSE', message: 'OpenAI khong tra ve noi dung.' } }, 502);
    }

    const { data: banGhiMoiNhat } = await supabase
      .from('scripts')
      .select('version')
      .eq('chapter_id', chapterId)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

    const phienBanMoi = (banGhiMoiNhat?.version || 0) + 1;

    const { data: kichBanMoi, error: loiLuu } = await supabase
      .from('scripts')
      .insert({
        user_id: user.id,
        project_id: chuong.project_id,
        chapter_id: chapterId,
        content: noiDungKichBan,
        version: phienBanMoi,
        status: 'completed',
        source: 'ai',
        word_count: demSoTu(noiDungKichBan),
      })
      .select()
      .single();

    if (loiLuu) {
      return traLoiJson({ error: { code: 'SAVE_SCRIPT_FAILED', message: loiLuu.message } }, 500);
    }

    return traLoiJson({ data: kichBanMoi });
  } catch (err) {
    return traLoiJson({ error: { code: 'UNEXPECTED_ERROR', message: String(err?.message || err) } }, 500);
  }
});
