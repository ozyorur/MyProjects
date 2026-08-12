const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';

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

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Sadece POST istekleri kabul edilir.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'Sunucu yapılandırması eksik: ANTHROPIC_API_KEY tanımlı değil.' });
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
    model: MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType || 'image/jpeg',
              data: image,
            },
          },
          { type: 'text', text: PROMPT },
        ],
      },
    ],
  };

  try {
    const resp = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();

    if (!resp.ok) {
      const message = (data && data.error && data.error.message) || 'Anthropic API isteği başarısız oldu.';
      return jsonResponse(resp.status, { error: message });
    }

    const textBlock = Array.isArray(data.content) ? data.content.find((c) => c.type === 'text') : null;
    const text = textBlock ? textBlock.text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return jsonResponse(502, { error: 'OCR sonucu ayrıştırılamadı.' });
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch (e) {
      return jsonResponse(502, { error: 'OCR sonucu geçersiz JSON döndürdü.' });
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
