# Fiş Defteri

Fiş fotoğrafını yapay zeka ile okuyup (satıcı, tarih, tutar, KDV kırılımı) kaydeden, muhasebeye
iletilip iletilmediğini takip eden, yedek alıp geri yükleyebilen tek kullanıcılı web uygulaması.
Statik HTML/CSS/JS + tek bir Netlify Function'dan oluşur, build adımı gerektirmez.

## Yapı

```
index.html                     Arayüz
css/style.css                  Tasarım (koyu kasa temalı, kağıt fiş kartları)
js/app.js                      Tüm istemci mantığı (localStorage, OCR çağrısı, export/import)
netlify/functions/oku-fis.js   Google Gemini API'ye görsel gönderip JSON döndüren serverless fonksiyon
netlify.toml                   Netlify build/functions yapılandırması
```

## Nasıl çalışır

- Tüm fiş kayıtları tarayıcının `localStorage`'ında tutulur (`fisDefteri.receipts.v1` anahtarı).
  Sayfa kapatılıp açılsa da veriler kaybolmaz. Veriler yalnızca o tarayıcıda/cihazda saklanır —
  cihazlar arası senkron için "Yedek Al" / "Yedek Geri Yükle" kullanılır.
- "Fotoğraf Çek" veya "Galeriden Seç" ile bir görsel seçildiğinde, görsel base64 olarak
  `/.netlify/functions/oku-fis` adresine POST edilir. Bu fonksiyon `GEMINI_API_KEY` ortam
  değişkenini kullanarak Google Gemini API'ye istek atar ve satıcı/tarih/tutar/KDV/kategori
  alanlarını JSON olarak döndürür (Gemini'nin yapılandırılmış çıktı — "structured output" —
  özelliği kullanılır, bu yüzden yanıt her zaman geçerli JSON'dur). API anahtarı hiçbir zaman
  tarayıcıya gönderilmez.
- OCR sonucu bir "Yeni Fiş" formunda önizlenir; kaydetmeden önce her alan düzenlenebilir.
- "Yedek Al" tüm kayıtları `fis-defteri-yedek-YYYY-MM-DD.json` adında bir dosya olarak indirir.
- "Yedek Geri Yükle" ile seçilen JSON dosyasındaki her kayıt, **satıcı + tarih + müşteri +
  ödeme yöntemi** kombinasyonuna göre mevcut kayıtlarla eşleştirilir: eşleşme varsa kayıt
  güncellenir (üzerine yazılır), yoksa yeni satır olarak eklenir. İşlem sonunda kaç kaydın
  güncellendiği/eklendiği bildirilir.

## Netlify'a deploy

### Git bağlantısıyla (önerilen)

1. Bu depoyu bir GitHub reposuna push edin.
2. Netlify'da **Add new site → Import an existing project** ile repoyu bağlayın.
3. Build ayarları: **Build command** boş bırakılabilir, **Publish directory**: `.`
   (`netlify.toml` bu ayarları zaten içeriyor, Netlify otomatik algılar).
4. [Google AI Studio](https://aistudio.google.com/apikey) üzerinden ücretsiz bir Gemini API
   anahtarı oluşturun (kredi kartı gerekmez, ücretsiz kullanım kotası vardır).
5. Netlify site ayarlarından **Environment variables** bölümüne gidin ve şunu ekleyin:
   - `GEMINI_API_KEY` = Google AI Studio'dan aldığınız API anahtarı
   - (opsiyonel) `GEMINI_MODEL` = kullanılacak model adı (varsayılan: `gemini-2.5-flash`)
6. Deploy edin. `netlify/functions/oku-fis.js` otomatik olarak
   `https://<site-adiniz>.netlify.app/.netlify/functions/oku-fis` adresinde yayınlanır.

### Sürükle-bırak ile

Netlify CLI ile de deploy edilebilir:

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Sürükle-bırak deploy'da environment variable'ları Netlify site ayarlarından
(**Site configuration → Environment variables**) elle eklemeniz gerekir; sürükle-bırak arayüzü
`netlify.toml` içindeki functions klasörünü otomatik algılar.

### Yerelde test etme

```bash
npm install -g netlify-cli
netlify dev
```

`netlify dev`, hem statik dosyaları hem `netlify/functions` içindeki fonksiyonu yerelde ayağa
kaldırır. Yerel `.env` dosyasına (repo'ya eklemeyin) `GEMINI_API_KEY=...` satırını ekleyerek
OCR'ı yerelde de test edebilirsiniz.

## Neden Gemini, neden Anthropic değil?

Anthropic API'de kalıcı bir ücretsiz kota yok; kullanmak için hesaba bakiye yüklemeniz gerekir.
Google AI Studio üzerinden alınan Gemini API anahtarı ise kredi kartı istemeden, ücretsiz bir
kotayla gelir ve vision (görsel anlama) desteği var — bu yüzden OCR sağlayıcısı olarak Gemini
seçildi. `netlify/functions/oku-fis.js` fonksiyonunu tekrar Anthropic'e (veya başka bir vision
modeline) çevirmek isterseniz, tek yapmanız gereken bu dosya içindeki API çağrısını değiştirmek;
frontend (`js/app.js`) sağlayıcıdan bağımsız olarak aynı `{ result: {...} }` / `{ error: "..." }`
sözleşmesini bekler.

## Notlar

- Uygulama tek kullanıcı için tasarlanmıştır, kimlik doğrulama içermez. Site adresini
  paylaşmayın; isterseniz Netlify'ın "Password protection" özelliğiyle ek bir koruma katmanı
  ekleyebilirsiniz.
- `GEMINI_API_KEY` asla istemci koduna (JS/HTML) gömülmemelidir; yalnızca Netlify Function
  içinde, sunucu tarafında okunur.
- Gemini'nin ücretsiz kotası da sınırsız değildir (dakika/gün başına istek limiti vardır); tek
  kullanıcılı, ara sıra fiş okuma senaryosu için yeterlidir. Kota aşılırsa uygulama "Elle Ekle"
  seçeneğine düşer, veri kaybı olmaz.
