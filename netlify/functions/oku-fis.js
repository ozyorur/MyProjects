const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Bu bir fiş/fatura fotoğrafıdır. Görseldeki bilgileri analiz et ve SADECE aşağıdaki alanları içeren geçerli bir JSON nesnesi döndür. Başka hiçbir açıklama, markdown işareti veya ek metin ekleme.

{
  "satici": string,
  "vergiNo": string veya null,
  "tarih": "YYYY-MM-DD" formatında string veya null,
  "tutar": number veya null,
  "kdv1": number veya null,
  "kdv10": number veya null,
  "kdv20": number veya null,
  "kategori": string
}

Kurallar:
- "satici": fişteki firma/işletme adı.
- "vergiNo": VKN fişte varsa yaz, yoksa null.
- "tarih": fiş üzerindeki tarih, YYYY-MM-DD formatında. Okunamıyorsa null.
- "tutar": KDV dahil toplam tutar. Okunamıyorsa null.
- "kdv1", "kdv10", "kdv20": ilgili KDV oranına ait tutar fişte açıkça yazılıyorsa yaz; fişte o oran hiç geçmiyorsa null döndür (0 yazma, tahmin etme).
- "kategori": şu listeden en uygun olanı seç: "Yakıt", "Market", "Yemek", "Ofis Malzemesi", "Kırtasiye", "Diğer".
- Emin olmadığın veya fişte yer almayan bilgiler için tahmin/uydurma yapma; ilgili alana null yaz.
- Sayısal alanları noktalı ondalık biçimde (örn. 123.45), para birimi simgesi veya binlik ayırıcı olmadan yaz.
- Yanıtın SADECE JSON nesnesinin kendisi olsun, başka hiçbir metin ekleme.`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    satici: { type: 'STRING', nullable: true },
    vergiNo: { type: 'STRING', nullable: true },
    tarih: { type: 'STRING', nullable: true },
    tutar: { type: 'NUMBER', nullable: true },
    kdv1: { type: 'NUMBER', nullable: true },
    kdv10: { type: 'NUMBER', nullable: true },
    kdv20: { type: 'NUMBER', nullable: true },
    kategori: { type: 'STRING', nullable: true },
  },
  required: ['satici', 'tarih', 'tutar', 'kategori'],
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Sadece POST istekleri kabul edilir.' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'Sunucu yapılandırması eksik: GEMINI_API_KEY tanımlı değil.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return jsonResponse(400, { error: 'Geçersiz istek gövdesi.' });
  }

  const { image, mediaType } = payload;
  if (!image || typeof image !== 'string') {
    return jsonResponse(400, { error: 'Görsel verisi eksik.' });
  }

  const body = {
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: mediaType || 'image/jpeg', data: image } },
          { text: PROMPT },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  try {
    const resp = await fetch(`${GEMINI_API_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const message = (data && data.error && data.error.message) || 'Gemini API isteği başarısız oldu.';
      return jsonResponse(resp.status, { error: message });
    }

    const candidate = Array.isArray(data.candidates) ? data.candidates[0] : null;
    const text = candidate && candidate.content && Array.isArray(candidate.content.parts)
      ? candidate.content.parts.map((p) => p.text || '').join('')
      : '';

    if (!text) {
      const blockReason = data.promptFeedback && data.promptFeedback.blockReason;
      const message = blockReason ? `İstek engellendi: ${blockReason}` : 'OCR sonucu boş döndü.';
      return jsonResponse(502, { error: message });
    }

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return jsonResponse(502, { error: 'OCR sonucu ayrıştırılamadı.' });
      }
      try {
        result = JSON.parse(jsonMatch[0]);
      } catch (e2) {
        return jsonResponse(502, { error: 'OCR sonucu geçersiz JSON döndürdü.' });
      }
    }

    return jsonResponse(200, { result });
  } catch (err) {
    return jsonResponse(500, { error: 'Sunucu hatası: ' + err.message });
  }
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}
