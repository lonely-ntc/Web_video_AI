// Goi service Python noi bo (avatar-service/api.py, chay EchoMimicV2)
// de tao video avatar tu anh nhan vat + file audio giong doc. Giong
// ttsGiongDoc.js, day chi la mot REST API don gian chay o localhost.

const AVATAR_API_URL = process.env.REACT_APP_AVATAR_API_URL || 'http://127.0.0.1:8002';

async function kiemTraAvatarServer() {
  try {
    const phanHoi = await fetch(`${AVATAR_API_URL}/health`);
    return phanHoi.ok;
  } catch {
    return false;
  }
}

// anhFile: File anh nhan vat. amThanh: File hoac Blob audio (wav).
// tuyChon: { pose, width, height, length, steps, sampleRate, cfg, fps,
//            contextFrames, contextOverlap, quantization, seed }
async function taoVideoAvatar(anhFile, amThanh, tuyChon = {}) {
  try {
    const form = new FormData();
    form.append('image', anhFile);
    form.append('audio', amThanh, amThanh.name || 'giong-doc.wav');

    const map = {
      pose: 'pose',
      width: 'width',
      height: 'height',
      length: 'length',
      steps: 'steps',
      sampleRate: 'sample_rate',
      cfg: 'cfg',
      fps: 'fps',
      contextFrames: 'context_frames',
      contextOverlap: 'context_overlap',
      quantization: 'quantization',
      seed: 'seed',
    };
    for (const [khoa, truong] of Object.entries(map)) {
      if (tuyChon[khoa] !== undefined && tuyChon[khoa] !== null) {
        form.append(truong, String(tuyChon[khoa]));
      }
    }

    const phanHoi = await fetch(`${AVATAR_API_URL}/generate`, {
      method: 'POST',
      body: form,
    });

    if (!phanHoi.ok) {
      let thongDiep = 'Không thể tạo video avatar.';
      try {
        const loi = await phanHoi.json();
        thongDiep = loi.detail || thongDiep;
      } catch {
        // giu thong diep mac dinh khi than loi khong phai JSON
      }
      return { data: null, error: { code: 'AVATAR_GENERATE_FAILED', message: thongDiep } };
    }

    const videoBlob = await phanHoi.blob();
    const seed = phanHoi.headers.get('X-Seed');
    return {
      data: { blob: videoBlob, videoUrl: URL.createObjectURL(videoBlob), seed },
      error: null,
    };
  } catch {
    return { data: null, error: { code: 'AVATAR_UNAVAILABLE', message: 'Không kết nối được tới Avatar server.' } };
  }
}

export {
  kiemTraAvatarServer,
  taoVideoAvatar,
};
