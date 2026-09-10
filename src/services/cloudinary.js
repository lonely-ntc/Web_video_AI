// Tich hop Cloudinary: host media (video AI, anh, audio) + CDN + transform.
// Dung unsigned upload preset -> upload thang tu trinh duyet, KHONG can
// api_secret. Cung convention { data, error } nhu cac service khac.
//
// Config qua .env:
//   REACT_APP_CLOUDINARY_CLOUD_NAME     ten cloud (vd: "dxyz123")
//   REACT_APP_CLOUDINARY_UPLOAD_PRESET  ten upload preset (unsigned)

const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || '';
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || '';
const MEDIA_API_URL = process.env.REACT_APP_MEDIA_API_URL || 'http://127.0.0.1:8004';

function daCauHinhCloudinary() {
  return Boolean(CLOUD_NAME && UPLOAD_PRESET);
}

// Cloudinary chia media thanh 3 "resource_type": image | video | raw.
// Audio dung chung endpoint "video". File khac (pptx, pdf...) dung "raw".
function suyLuanResourceType(file) {
  const type = file?.type || '';
  if (type.startsWith('image/')) return 'image';
  if (type.startsWith('video/')) return 'video';
  if (type.startsWith('audio/')) return 'video';
  return 'raw';
}

// tuyChon: { folder, resourceType, publicId, tags: [], fileName }
async function taiLenCloudinary(file, tuyChon = {}) {
  if (!daCauHinhCloudinary()) {
    return {
      data: null,
      error: { code: 'CLOUDINARY_NOT_CONFIGURED', message: 'Chưa cấu hình Cloudinary trong .env.' },
    };
  }
  if (!file) {
    return { data: null, error: { code: 'MISSING_FILE', message: 'Thiếu file để tải lên.' } };
  }

  const resourceType = tuyChon.resourceType || suyLuanResourceType(file);
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;

  const form = new FormData();
  if (tuyChon.fileName) form.append('file', file, tuyChon.fileName);
  else form.append('file', file);
  form.append('upload_preset', UPLOAD_PRESET);
  if (tuyChon.folder) form.append('folder', tuyChon.folder);
  if (tuyChon.publicId) form.append('public_id', tuyChon.publicId);
  if (Array.isArray(tuyChon.tags) && tuyChon.tags.length) {
    form.append('tags', tuyChon.tags.join(','));
  }

  try {
    const phanHoi = await fetch(endpoint, { method: 'POST', body: form });
    const noiDung = await phanHoi.json();

    if (!phanHoi.ok) {
      return {
        data: null,
        error: {
          code: 'CLOUDINARY_UPLOAD_FAILED',
          message: noiDung?.error?.message || 'Tải media lên Cloudinary thất bại.',
        },
      };
    }

    return {
      data: {
        publicId: noiDung.public_id,
        url: noiDung.secure_url,
        resourceType: noiDung.resource_type,
        format: noiDung.format,
        bytes: noiDung.bytes,
        width: noiDung.width,
        height: noiDung.height,
        duration: noiDung.duration,
        raw: noiDung,
      },
      error: null,
    };
  } catch {
    return { data: null, error: { code: 'CLOUDINARY_UNAVAILABLE', message: 'Không kết nối được tới Cloudinary.' } };
  }
}

// Sinh URL co transform tu public_id. Vi du:
//   urlCloudinary('bai-giang/abc', { width: 640, crop: 'fill' })
//   urlCloudinary('videos/xyz', { resourceType: 'video', transform: 'f_auto,q_auto' })
function urlCloudinary(publicId, tuyChon = {}) {
  if (!CLOUD_NAME || !publicId) return '';
  const resourceType = tuyChon.resourceType || 'image';

  let transform = tuyChon.transform || '';
  if (!transform) {
    const phan = ['f_auto', 'q_auto'];
    if (tuyChon.width) phan.push(`w_${tuyChon.width}`);
    if (tuyChon.height) phan.push(`h_${tuyChon.height}`);
    if (tuyChon.crop) phan.push(`c_${tuyChon.crop}`);
    transform = phan.join(',');
  }

  const doanTransform = transform ? `${transform}/` : '';
  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${doanTransform}${publicId}`;
}

// Anh thumbnail (poster) tu 1 video da upload -> lay frame giua video.
function thumbnailVideoCloudinary(publicId, { width = 640 } = {}) {
  if (!CLOUD_NAME || !publicId) return '';
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/so_auto,w_${width},c_fill,f_jpg/${publicId}.jpg`;
}

// URL tai xuong (buoc trinh duyet tai ve thay vi mo) voi ten file mong muon.
function urlTaiXuongCloudinary(publicId, tenFile, resourceType = 'image') {
  if (!CLOUD_NAME || !publicId) return '';
  return `https://res.cloudinary.com/${CLOUD_NAME}/${resourceType}/upload/${flAttachment(tenFile)}/${publicId}`;
}

function flAttachment(tenFile) {
  const tenGon = String(tenFile || 'download')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^\w-]+/g, '_') || 'download';
  return `fl_attachment:${encodeURIComponent(tenGon)}`;
}

// Chen fl_attachment vao 1 secure_url da luu -> URL tai xuong voi ten mong muon.
function urlTaiXuongTuUrl(secureUrl, tenFile) {
  if (!secureUrl) return '';
  return secureUrl.replace('/upload/', `/upload/${flAttachment(tenFile)}/`);
}

// Tach public_id + resource_type tu 1 secure_url Cloudinary da luu.
// vd: https://res.cloudinary.com/x/video/upload/v17/ai-video-web/videos/u/i/abc.mp4
//  -> { publicId: "ai-video-web/videos/u/i/abc", resourceType: "video" }
function publicIdTuUrl(secureUrl) {
  if (!secureUrl) return { publicId: '', resourceType: 'image' };
  const m = /\/(image|video|raw)\/upload\/(.+)$/.exec(secureUrl);
  if (!m) return { publicId: '', resourceType: 'image' };
  let phan = m[2].split('/');
  // bo cac segment transform (chua "_" hoac "," truoc version) va version "v123..."
  phan = phan.filter((p) => !/^v\d+$/.test(p));
  const idCoDuoi = phan.join('/');
  return { publicId: idCoDuoi.replace(/\.[^/.]+$/, ''), resourceType: m[1] };
}

// Xoa asset tren Cloudinary. Can api_secret -> goi qua media-service (port 8004).
async function xoaCloudinary(publicId, resourceType = 'image') {
  if (!publicId) return { data: null, error: null };
  try {
    const phanHoi = await fetch(`${MEDIA_API_URL}/destroy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId, resourceType }),
    });
    const noiDung = await phanHoi.json().catch(() => ({}));
    if (!phanHoi.ok) {
      return { data: null, error: { code: 'CLOUDINARY_DESTROY_FAILED', message: noiDung.detail || 'Xóa media thất bại.' } };
    }
    return { data: noiDung, error: null };
  } catch {
    return { data: null, error: { code: 'MEDIA_SERVICE_UNAVAILABLE', message: 'Không kết nối được tới media-service.' } };
  }
}

export {
  daCauHinhCloudinary,
  taiLenCloudinary,
  urlCloudinary,
  thumbnailVideoCloudinary,
  urlTaiXuongCloudinary,
  urlTaiXuongTuUrl,
  publicIdTuUrl,
  xoaCloudinary,
};
