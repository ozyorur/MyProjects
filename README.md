# FişTakip

Küçük işletmeler için fiş/fatura gider ve KDV takip uygulaması. Tamamen client-side (local-first) çalışan bir PWA'dır; backend gerektirmez.

## Özellikler

- Kamera / galeri / dosyadan fiş fotoğrafı ekleme (JPG, PNG, WEBP, PDF)
- Tarayıcı içinde çalışan OCR (Tesseract.js, tüm varlıklar yerelden sunulur, CDN bağımlılığı yoktur)
- %1 / %10 / %20 KDV oranlarının ayrı ayrı takibi, çoklu KDV desteği
- Dashboard: dönem özetleri, geçen yıl aynı dönem karşılaştırması, aylık trend grafiği
- Fişler listesi: arama, filtreleme, sıralama (tablo / mobil kart görünümü)
- Raporlar: aylık KDV raporu, firma/müşteri/kategori/ödeme yöntemi dağılımları, Excel (XLSX) export
- Yedekleme: tüm veriler + fiş fotoğrafları tek bir ZIP dosyasına aktarılır
- Yedekten geri yükleme: firma + tarih + müşteri + ödeme yöntemi eşleşen kayıtlar overwrite edilir, çakışma yaratmaz
- Karanlık / aydınlık tema, tam responsive (telefon, tablet, masaüstü)
- IndexedDB (Dexie.js) ile tamamen cihaz üzerinde veri saklama

## Geliştirme

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

`dist/` klasörü oluşur. Netlify için `netlify.toml` ve `public/_redirects` SPA yönlendirmelerini otomatik yapılandırır.

- Build command: `npm run build`
- Publish directory: `dist`

## Proje Yapısı

```
src/
  components/   UI bileşenleri (layout, dashboard, receipts, reports, ui)
  pages/        Route sayfaları
  db/           Dexie şeması ve varsayılan veriler
  services/       Repository / iş mantığı katmanı (receipts, images, backup, ocr, excel, analytics)
  hooks/         Tema, toast gibi paylaşılan React hook'ları
  utils/         KDV hesaplama, para/tarih formatlama, normalize fonksiyonları
  types/         Ortak TypeScript tipleri
```

## Notlar

- Veriler yalnızca kullanılan cihazda (IndexedDB) saklanır; düzenli yedek almak önerilir (Ayarlar → Veri Yönetimi / Yedek sayfası).
- OCR varlıkları (`public/tesseract`) ilk kullanımda indirilir ve service worker tarafından önbelleğe alınır; sonraki kullanımlarda offline çalışır.
