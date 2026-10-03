// Edge Function: generate-script
// Nhan chapterId (+ documentIds tuy chon), doc noi dung tai lieu (.txt/.md/.pdf/.docx/.pptx),
// goi mot LLM chay local (Ollama, qua gateway-service + tunnel ngrok) de tao
// DONG THOI kich ban giang day + noi dung slide theo dung quy trinh 8 buoc:
// phan tich tai lieu -> xac dinh muc tieu/doi tuong -> xay cau truc bai hoc
// -> viet kich ban -> xay slide -> danh dau diem nhan -> (kiem tra dong bo o
// day, o muc co ban) -> tra ve de giao vien xem truoc/chinh sua/phe duyet.
//
// Khong dung OpenAI (da go bo, het credit). Model local: qwen2.5:3b-instruct
// qua Ollama (xem local-ai/README hoac ghi chu o goiOllama() ben duoi).
//
// Co 2 cach goi function nay:
//   1. Tu web app: dung JWT cua nguoi dung dang nhap (Authorization: Bearer <access_token>).
//      Moi truy van deu bi RLS gioi han theo dung tai khoan do.
//   2. Tu automation chay nen (vd Make.com, khong co user dang nhap dung cho):
//      Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>  + body them "userId".
//      Luc nay bo qua RLS (service_role) nen function TU KIEM TRA thu cong
//      chuong do co dung thuoc ve userId truyen vao khong, tranh ghi nham.
//
// Trien khai:
//   supabase functions deploy generate-script
// Thiet lap secret (LLM_GATEWAY_URL doi moi lan ngrok cap domain moi):
//   supabase secrets set LLM_GATEWAY_URL=https://<domain-ngrok>/llm
//   supabase secrets set LLM_GATEWAY_TOKEN=<GATEWAY_TOKEN trong local-ai/gateway-service/.env>

import { createClient } from 'npm:@supabase/supabase-js@2';
import JSZip from 'npm:jszip@3';
import { extractText, getDocumentProxy } from 'npm:unpdf@0.12';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Doc duoc: txt, md, pdf (co lop chu), docx, pptx. Bo .doc/.ppt cu (nhi phan).
const CAC_LOAI_FILE_HO_TRO = new Set(['txt', 'md', 'pdf', 'word', 'ppt']);
// Model local ngu canh nho (~8K token) nen phai cat tai lieu ngan hon nhieu
// so voi luc dung OpenAI (truoc day 150_000 ky tu).
const TOI_DA_KY_TU_TAI_LIEU = 12_000;
const OLLAMA_MODEL = 'qwen2.5:3b-instruct';

function phanMoRong(duongDan) {
  return (duongDan || '').split('.').pop()?.toLowerCase() || '';
}

function taiLieuDocDuoc(taiLieu) {
  if (!CAC_LOAI_FILE_HO_TRO.has(taiLieu.file_type)) return false;
  const duoi = phanMoRong(taiLieu.file_path);
  if (taiLieu.file_type === 'word') return duoi === 'docx';
  if (taiLieu.file_type === 'ppt') return duoi === 'pptx';
  return true;
}

function xmlSangVanBan(xml) {
  return xml
    .replace(/<\/(w:p|a:p)>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, ma) => String.fromCharCode(Number(ma)))
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function trichXuatVanBan(taiLieu, file) {
  if (taiLieu.file_type === 'txt' || taiLieu.file_type === 'md') {
    return await file.text();
  }

  const buffer = new Uint8Array(await file.arrayBuffer());

  if (taiLieu.file_type === 'pdf') {
    const pdf = await getDocumentProxy(buffer);
    const { text } = await extractText(pdf, { mergePages: true });
    return (text || '').trim();
  }

  const zip = await JSZip.loadAsync(buffer);

  if (taiLieu.file_type === 'word') {
    const xml = await zip.file('word/document.xml')?.async('string');
    return xml ? xmlSangVanBan(xml) : '';
  }

  const cacSlide = Object.keys(zip.files)
    .map((ten) => ({ ten, so: Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(ten)?.[1]) }))
    .filter((muc) => Number.isFinite(muc.so))
    .sort((a, b) => a.so - b.so);
  const noiDungSlide = [];
  for (const slide of cacSlide) {
    const xml = await zip.file(slide.ten).async('string');
    noiDungSlide.push(`[Slide ${slide.so}]\n${xmlSangVanBan(xml)}`);
  }
  return noiDungSlide.join('\n\n');
}

// Prompt he thong ep model tuan theo dung quy trinh 8 buoc soan bai giang:
// (1) da phan tich tai lieu o buoc trich xuat van ban phia tren; (2)-(6) giao
// cho model quyet dinh muc tieu/doi tuong, cau truc, kich ban, slide, diem
// nhan; (7) dong bo duoc kiem tra co ban bang cach bat buoc slide.note trich
// tu chinh script; (8) giao vien xem truoc/chinh sua/phe duyet o phia web app
// (man hinh "Xem noi dung" + nut xac nhan giong doc) truoc khi sang buoc TTS.
const PROMPT_HE_THONG = `Ban la chuyen gia thiet ke bai giang video bang tieng Viet.
Nhiem vu: doc noi dung tai lieu nguon do giao vien cung cap va soan ra kich ban
giang day + slide trinh chieu, hoan toan bam sat kien thuc trong tai lieu
(khong bia dat, khong them kien thuc ngoai tai lieu).

Quy trinh phai tuan theo:
1. Xac dinh muc tieu bai hoc va doi tuong nguoi hoc phu hop voi noi dung tai lieu.
2. Xay dung cau truc bai hoc theo trinh tu: gioi thieu chu de -> muc tieu bai hoc
   -> kien thuc nen tang -> noi dung chuyen sau (co vi du minh hoa) -> tong ket
   -> cau hoi kiem tra cuoi bai.
3. Viet kich ban ("script") la loi thoai TU NHIEN nhu nguoi that dang giang bai,
   KHONG doc nguyen van tai lieu, co cau chuyen tiep muot giua cac phan.
4. Xay slide tuong ung tung phan cua kich ban: moi slide chi 1 y chinh, tieu de
   ro rang, bullet ngan gon (KHONG phai ca cau van dai), co the goi y tu khoa.
5. Danh dau "emphasis": true cho nhung slide chua kien thuc quan trong can nhan
   manh (giong doc/hieu ung se duoc uu tien o nhung slide nay).
6. Truong "note" cua moi slide PHAI la mot doan trich nguyen van tu "script",
   theo dung thu tu xuat hien, de dam bao kich ban va slide dong bo.

Chi tra ve DUY NHAT mot JSON object dung dinh dang sau, khong thom chu nao khac:
{
  "objective": "muc tieu bai hoc, 1-2 cau",
  "script": "toan bo kich ban: gioi thieu, muc tieu, noi dung chinh, vi du, tong ket, cau hoi kiem tra",
  "slides": [
    {
      "type": "title" | "objective" | "content" | "example" | "summary" | "quiz",
      "title": "tieu de slide",
      "bullets": ["y ngan gon 1", "y ngan gon 2"],
      "keywords": ["tu khoa"],
      "note": "doan loi thoai trich tu script tuong ung slide nay",
      "emphasis": true
    }
  ]
}
Slide dau tien type "title", slide ke tiep type "objective" neu can, slide
cuoi cung type "quiz" chua cau hoi kiem tra trong "bullets". Voi slide type
"title"/"objective"/"summary"/"quiz" thi "keywords" co the de mang rong [].`;

function xayPromptNguoiDung(chuong, noiDungTaiLieu) {
  return [
    `Ten chuong: ${chuong.name}`,
    chuong.description ? `Mo ta chuong: ${chuong.description}` : '',
    '',
    'Noi dung tai lieu nguon:',
    noiDungTaiLieu.join('\n\n'),
  ].filter(Boolean).join('\n');
}

// Goi Ollama chay local (model qwen2.5:3b-instruct) qua gateway-service +
// tunnel ngrok, vi Edge Function chay tren cloud khong voi toi 127.0.0.1
// cua may nguoi dung duoc. Can 2 secret: LLM_GATEWAY_URL (doi moi lan ngrok
// cap domain moi) va LLM_GATEWAY_TOKEN (= GATEWAY_TOKEN cua gateway-service).
async function goiOllama(promptNguoiDung) {
  const gatewayUrl = Deno.env.get('LLM_GATEWAY_URL');
  const gatewayToken = Deno.env.get('LLM_GATEWAY_TOKEN');
  if (!gatewayUrl) {
    return {
      data: null,
      error: { code: 'MISSING_LLM_GATEWAY', message: 'Chua thiet lap secret LLM_GATEWAY_URL tren Supabase.' },
    };
  }

  let res;
  try {
    res = await fetch(`${gatewayUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(gatewayToken ? { 'X-Automation-Token': gatewayToken } : {}),
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        format: 'json',
        options: { num_ctx: 8192, num_predict: 3000, temperature: 0.4 },
        messages: [
          { role: 'system', content: PROMPT_HE_THONG },
          { role: 'user', content: promptNguoiDung },
        ],
      }),
    });
  } catch {
    return {
      data: null,
      error: { code: 'LLM_UNAVAILABLE', message: 'Khong ket noi duoc toi Ollama (kiem tra may local + ngrok con chay khong).' },
    };
  }

  if (!res.ok) {
    const chiTiet = await res.text();
    return { data: null, error: { code: 'LLM_REQUEST_FAILED', message: `Ollama loi: ${chiTiet}` } };
  }

  const goc = await res.json();
  const noiDungTho = goc?.message?.content?.trim();
  if (!noiDungTho) {
    return { data: null, error: { code: 'EMPTY_LLM_RESPONSE', message: 'Ollama khong tra ve noi dung.' } };
  }

  try {
    return { data: JSON.parse(noiDungTho), error: null };
  } catch {
    // Model doi khi keo them chu ngoai JSON du da yeu cau format json; thu
    // cat lay doan {...} dau tien truoc khi bo cuoc.
    const khop = noiDungTho.match(/\{[\s\S]*\}/);
    if (khop) {
      try {
        return { data: JSON.parse(khop[0]), error: null };
      } catch {
        // roi qua loi ben duoi
      }
    }
    return { data: null, error: { code: 'INVALID_LLM_JSON', message: 'Ollama tra ve JSON khong hop le.' } };
  }
}

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
    const { chapterId, userId: userIdTuBody, documentIds } = await req.json();
    if (!chapterId) {
      return traLoiJson({ error: { code: 'MISSING_CHAPTER_ID', message: 'Thieu chapterId.' } }, 400);
    }

    const authHeader = req.headers.get('Authorization') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const laGoiTuAutomation = Boolean(serviceRoleKey) && authHeader === `Bearer ${serviceRoleKey}`;

    let supabase;
    let userId;

    if (laGoiTuAutomation) {
      if (!userIdTuBody) {
        return traLoiJson({
          error: { code: 'MISSING_USER_ID', message: 'Goi bang service_role can truyen them "userId" trong body.' },
        }, 400);
      }
      // service_role bo qua RLS -> tu kiem tra quyen so huu chuong thu cong ben duoi.
      supabase = createClient(Deno.env.get('SUPABASE_URL'), serviceRoleKey);
      userId = userIdTuBody;
    } else {
      // Client chay voi JWT cua nguoi goi -> moi truy van deu tuan theo RLS
      // cua chinh tai khoan do, khong the doc/ghi du lieu tai khoan khac.
      supabase = createClient(
        Deno.env.get('SUPABASE_URL'),
        Deno.env.get('SUPABASE_ANON_KEY'),
        { global: { headers: { Authorization: authHeader } } },
      );

      const { data: { user }, error: loiXacThuc } = await supabase.auth.getUser();
      if (loiXacThuc || !user) {
        return traLoiJson({ error: { code: 'UNAUTHORIZED', message: 'Chua dang nhap hoac phien het han.' } }, 401);
      }
      userId = user.id;
    }

    const { data: chuong, error: loiChuong } = await supabase
      .from('chapters')
      .select('id, project_id, name, description, user_id')
      .eq('id', chapterId)
      .single();

    if (loiChuong || !chuong) {
      return traLoiJson({ error: { code: 'CHAPTER_NOT_FOUND', message: 'Khong tim thay chuong nay.' } }, 404);
    }

    if (laGoiTuAutomation && chuong.user_id !== userId) {
      return traLoiJson({
        error: { code: 'FORBIDDEN', message: 'Chuong nay khong thuoc ve userId da truyen.' },
      }, 403);
    }

    const { data: danhSachTaiLieu, error: loiTaiLieu } = await supabase
      .from('documents')
      .select('id, name, file_path, file_type, status')
      .eq('chapter_id', chapterId);

    if (loiTaiLieu) {
      return traLoiJson({ error: { code: 'LOAD_DOCUMENTS_FAILED', message: loiTaiLieu.message } }, 500);
    }

    const idDaChon = Array.isArray(documentIds) && documentIds.length > 0 ? new Set(documentIds) : null;
    const taiLieuVanBan = (danhSachTaiLieu || []).filter(
      (tl) => tl.status === 'ready'
        && taiLieuDocDuoc(tl)
        && (!idDaChon || idDaChon.has(tl.id)),
    );

    if (taiLieuVanBan.length === 0) {
      return traLoiJson({
        error: {
          code: 'NO_SUPPORTED_DOCUMENTS',
          message: 'Khong co tai lieu hop le de AI doc. Ho tro: .txt, .md, .pdf, .docx, .pptx '
            + '(khong ho tro .doc/.ppt cu).',
        },
      }, 422);
    }

    const noiDungTaiLieu = [];
    let tongKyTu = 0;
    for (const taiLieu of taiLieuVanBan) {
      const { data: file, error: loiTai } = await supabase.storage
        .from('documents')
        .download(taiLieu.file_path);

      if (loiTai || !file) continue;

      let noiDung = '';
      try {
        noiDung = await trichXuatVanBan(taiLieu, file);
      } catch {
        continue;
      }
      if (!noiDung.trim()) continue;

      const conLai = TOI_DA_KY_TU_TAI_LIEU - tongKyTu;
      if (conLai <= 0) break;
      noiDung = noiDung.slice(0, conLai);
      tongKyTu += noiDung.length;
      noiDungTaiLieu.push(`### ${taiLieu.name}\n${noiDung}`);
    }

    if (noiDungTaiLieu.length === 0) {
      return traLoiJson({
        error: {
          code: 'DOWNLOAD_DOCUMENTS_FAILED',
          message: 'Khong doc duoc noi dung van ban tu tai lieu nao (file that bai hoac PDF dang anh scan, khong co lop chu).',
        },
      }, 422);
    }

    const promptNguoiDung = xayPromptNguoiDung(chuong, noiDungTaiLieu);

    let { data: ketQua, error: loiLlm } = await goiOllama(promptNguoiDung);
    // Model nho doi khi tra thieu field hoac sai kieu -> thu lai 1 lan voi
    // yeu cau nhac lai nghiem ngat truoc khi bao loi hang cho nguoi dung.
    const hopLe = (kq) => kq && typeof kq.script === 'string' && kq.script.trim()
      && Array.isArray(kq.slides) && kq.slides.length > 0;

    if (!loiLlm && !hopLe(ketQua)) {
      const thuLai = await goiOllama(
        `${promptNguoiDung}\n\nLUU Y: lan truoc ban tra loi sai dinh dang. Chi tra ve DUY NHAT `
        + 'mot JSON object dung schema da mo ta, co day du "script" (chuoi khong rong) va '
        + '"slides" (mang co it nhat 1 phan tu).',
      );
      ketQua = thuLai.data;
      loiLlm = thuLai.error;
    }

    if (loiLlm) {
      return traLoiJson({ error: loiLlm }, 502);
    }
    if (!hopLe(ketQua)) {
      return traLoiJson({
        error: { code: 'INVALID_LLM_RESULT', message: 'AI tra ve ket qua thieu kich ban hoac slide.' },
      }, 502);
    }

    const noiDungKichBan = ketQua.script.trim();
    const danhSachSlide = ketQua.slides;

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
        user_id: userId,
        project_id: chuong.project_id,
        chapter_id: chapterId,
        content: noiDungKichBan,
        slides: danhSachSlide,
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
