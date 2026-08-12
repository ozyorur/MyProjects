import { createWorker, PSM, type Worker } from 'tesseract.js'
import { parseLocaleNumber, round2 } from '../utils/currency'
import type { FieldConfidence } from '../types'

export interface OcrExtractedField<T> {
  value: T
  confidence: FieldConfidence
}

export interface OcrResult {
  rawText: string
  firmaAdi?: OcrExtractedField<string>
  vergiNo?: OcrExtractedField<string>
  fisNo?: OcrExtractedField<string>
  belgeNo?: OcrExtractedField<string>
  tarih?: OcrExtractedField<string> // ISO
  saat?: OcrExtractedField<string>
  toplamTutar?: OcrExtractedField<number>
  odemeYontemi?: OcrExtractedField<string>
  kdvOranTutarlari: OcrVatItem[]
}

export interface OcrVatItem {
  oran: 1 | 10 | 20
  /** Bu oran için KDV dahil tutar (yalnızca oran-bazlı satır bulunduğunda) */
  dahilTutar?: number
  /** Fişte tek bir birleşik KDV tutarı varsa (oran belirtilmeden), doğrudan okunan matrah/KDV */
  matrah?: number
  tutar?: number
}

let workerPromise: Promise<Worker> | null = null

// Tüm OCR varlıkları (worker, wasm core, dil verisi) harici bir CDN'e bağımlı kalmadan
// /public/tesseract altında yerel olarak paketlenir; böylece offline PWA çalışması ve
// kısıtlı ağlarda güvenilirlik sağlanır.
const ASSET_BASE = `${import.meta.env.BASE_URL}tesseract`.replace(/\/+$/, '')

function getWorker(onProgress?: (pct: number) => void): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker(
      'tur+eng',
      1,
      {
        workerPath: `${ASSET_BASE}/worker.min.js`,
        corePath: `${ASSET_BASE}/core/tesseract-core-simd-lstm.wasm.js`,
        langPath: `${ASSET_BASE}/lang`,
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100))
          }
        },
      }
    ).catch((err) => {
      workerPromise = null
      throw err
    })
  }
  return workerPromise
}

export async function terminateOcrWorker(): Promise<void> {
  if (workerPromise) {
    const worker = await workerPromise
    await worker.terminate()
    workerPromise = null
  }
}

export async function runOcr(image: Blob | string, onProgress?: (pct: number) => void): Promise<OcrResult> {
  const worker = await getWorker(onProgress)
  // Fişler dar, tek sütunluk metin şeritleridir; SINGLE_COLUMN modu Tesseract'ın
  // arka plan gürültüsünü sütun/blok olarak yanlış yorumlamasını engelleyip doğruluğu artırır.
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN })
  const { data } = await worker.recognize(image, {}, { text: true })
  onProgress?.(100)
  const text = data.text || ''
  return parseReceiptText(text)
}

// ---- Parsing helpers ----

const monthNamesTR: Record<string, string> = {
  ocak: '01', şubat: '02', subat: '02', mart: '03', nisan: '04', mayıs: '05', mayis: '05',
  haziran: '06', temmuz: '07', ağustos: '08', agustos: '08', eylül: '09', eylul: '09',
  ekim: '10', kasım: '11', kasim: '11', aralık: '12', aralik: '12',
}

function normalizeDigits(s: string): string {
  // OCR sıklıkla O/o -> 0, I/l -> 1 karışıklığı yapar; sayısal bağlamda düzelt
  return s.replace(/[Oo]/g, '0').replace(/[Il]/g, '1')
}

function findDate(text: string): OcrExtractedField<string> | undefined {
  // dd.mm.yyyy / dd/mm/yyyy / dd-mm-yyyy / dd.mm.yy
  const numeric = text.match(/(\d{1,2})[.\/\-](\d{1,2})[.\/\-](\d{2,4})/)
  if (numeric) {
    let [, d, m, y] = numeric
    if (y.length === 2) y = `20${y}`
    const dd = d.padStart(2, '0')
    const mm = m.padStart(2, '0')
    if (Number(dd) >= 1 && Number(dd) <= 31 && Number(mm) >= 1 && Number(mm) <= 12) {
      return { value: `${y}-${mm}-${dd}`, confidence: 'high' }
    }
  }
  // 11 Ağustos 2026 gibi
  const textual = text.match(/(\d{1,2})\s+([A-Za-zÇĞİÖŞÜçğıöşü]+)\s+(\d{4})/)
  if (textual) {
    const [, d, monthRaw, y] = textual
    const monthKey = monthRaw.toLocaleLowerCase('tr-TR')
    const mm = monthNamesTR[monthKey]
    if (mm) {
      return { value: `${y}-${mm}-${d.padStart(2, '0')}`, confidence: 'low' }
    }
  }
  return undefined
}

function findTime(text: string): OcrExtractedField<string> | undefined {
  const m = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)
  if (m) return { value: `${m[1].padStart(2, '0')}:${m[2]}`, confidence: 'high' }
  return undefined
}

function findVergiNo(text: string): OcrExtractedField<string> | undefined {
  const m = text.match(/(?:VERG[İI]\s*(?:NO|NUMARASI)|VKN)\s*[:\-]?\s*(\d{10,11})/i)
  if (m) return { value: normalizeDigits(m[1]), confidence: 'high' }
  return undefined
}

function findFisNo(text: string): OcrExtractedField<string> | undefined {
  const m = text.match(/(?:F[İI][ŞS]\s*(?:NO|N[Oo])|FIS\s*NO)\s*[:\-]?\s*([A-Z0-9\-\/]{2,20})/i)
  if (m) return { value: m[1], confidence: 'low' }
  return undefined
}

function findBelgeNo(text: string): OcrExtractedField<string> | undefined {
  const m = text.match(/(?:BELGE\s*NO|EK[UÜ]\s*NO|Z\s*NO)\s*[:\-]?\s*([A-Z0-9\-\/]{2,20})/i)
  if (m) return { value: m[1], confidence: 'low' }
  return undefined
}

// Ondalıklı bir para tutarına benzeyen ilk deseni yakalar (virgül veya nokta ile 2 basamak).
// Anahtar kelime ile tutar arasında OCR'ın "*" gibi işaretleri neye çevirdiği önemli değildir.
const AMOUNT_PATTERN = /\d{1,3}(?:[.,]\d{3})*[.,]\d{2}\b/

/** Belirtilen anahtar kelimeyi içeren satırda veya ondan sonraki 1-2 satırda bir tutar arar */
function extractAmountNear(text: string, keyword: RegExp): number | undefined {
  const lines = text.split('\n').map((l) => l.trim())
  for (let i = 0; i < lines.length; i++) {
    if (!keyword.test(lines[i])) continue
    for (let j = i; j <= Math.min(i + 2, lines.length - 1); j++) {
      const m = lines[j].match(AMOUNT_PATTERN)
      if (m) {
        const val = parseLocaleNumber(m[0])
        if (val > 0) return round2(val)
      }
    }
  }
  return undefined
}

function findTotal(text: string): OcrExtractedField<number> | undefined {
  const keywordsByPriority = [
    /GENEL\s*TOPLAM/i,
    /TOPLAM\s*TUTAR/i,
    /[ÖO]DENEN\s*TUTAR/i,
    /\bTOPLAM\b/i,
    /\bTUTAR\b/i,
  ]
  for (const keyword of keywordsByPriority) {
    const val = extractAmountNear(text, keyword)
    if (val !== undefined) return { value: val, confidence: 'high' }
  }
  return undefined
}

function findPaymentMethod(text: string): OcrExtractedField<string> | undefined {
  const upper = text.toLocaleUpperCase('tr-TR')
  if (/KRED[İI]\s*KART/.test(upper)) return { value: 'Kredi Kartı', confidence: 'high' }
  if (/BANKA\s*KART/.test(upper)) return { value: 'Banka Kartı', confidence: 'high' }
  if (/HAVALE|EFT/.test(upper)) return { value: 'Havale / EFT', confidence: 'high' }
  if (/NAK[İI]T/.test(upper)) return { value: 'Nakit', confidence: 'high' }
  return undefined
}

/** OCR gürültüsünden (rastgele sembol/karakter dizileri) gelen anlamsız metinleri elemek için */
function isPlausibleText(line: string): boolean {
  const letters = (line.match(/[A-Za-zÇĞİÖŞÜçğıöşü]/g) ?? []).length
  const letterRatio = letters / line.length
  if (letterRatio < 0.55) return false
  // Art arda gelen tek harf + boşluk grupları (OCR gürültüsünün tipik izi) çok fazlaysa reddet
  const words = line.split(/\s+/).filter(Boolean)
  const singleCharWords = words.filter((w) => w.length === 1).length
  if (words.length > 0 && singleCharWords / words.length > 0.4) return false
  return true
}

function findCompanyName(text: string): OcrExtractedField<string> | undefined {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 2)
  // İlk birkaç satırda genelde firma adı bulunur; çok sayıda rakam içeren veya anlamsız satırları ele
  for (const line of lines.slice(0, 6)) {
    const digitRatio = (line.match(/\d/g)?.length ?? 0) / line.length
    if (
      digitRatio < 0.3 &&
      line.length >= 3 &&
      line.length <= 60 &&
      !/^(FİŞ|FIS|SAAT|TARİH|TARIH)/i.test(line) &&
      isPlausibleText(line)
    ) {
      return { value: line, confidence: 'low' }
    }
  }
  return undefined
}

/** Fişte "KDV %20 ..." gibi oranı açıkça yazılmış satırlar varsa bunları bulur */
function findVatBreakdown(text: string): OcrVatItem[] {
  const results: OcrVatItem[] = []
  const rates: (1 | 10 | 20)[] = [1, 10, 20]
  for (const rate of rates) {
    const val = extractAmountNear(text, new RegExp(`KDV\\s*%?\\s*${rate}\\b`, 'i'))
    if (val !== undefined) results.push({ oran: rate, dahilTutar: val })
  }
  return results
}

/** "TOPKDV" / "TOPLAM KDV" gibi orana göre ayrılmamış tek bir birleşik KDV tutarı arar */
function findCombinedVat(text: string): number | undefined {
  return extractAmountNear(text, /TOP\s*KDV|TOPLAM\s*KDV/i)
}

/**
 * Türkiye'de KDV yalnızca %1, %10 veya %20 olabilir. Fişte oran açıkça yazmasa bile,
 * toplam tutar ile toplam KDV biliniyorsa örtük oran hesaplanıp en yakın resmi orana
 * (2.5 puan toleransla) eşlenir.
 */
function inferVatRateBucket(toplam: number, kdv: number): 1 | 10 | 20 | undefined {
  const matrah = toplam - kdv
  if (kdv <= 0 || matrah <= 0) return undefined
  const impliedRatePct = (kdv / matrah) * 100
  const candidates: (1 | 10 | 20)[] = [1, 10, 20]
  let best: 1 | 10 | 20 | undefined
  let bestDiff = Infinity
  for (const c of candidates) {
    const diff = Math.abs(impliedRatePct - c)
    if (diff < bestDiff) {
      bestDiff = diff
      best = c
    }
  }
  return bestDiff <= 2.5 ? best : undefined
}

export function parseReceiptText(rawText: string): OcrResult {
  const toplamTutar = findTotal(rawText)
  let kdvOranTutarlari = findVatBreakdown(rawText)

  // Oran-bazlı bir satır bulunamadıysa, birleşik TOPKDV değerinden örtük oranı tahmin et
  if (kdvOranTutarlari.length === 0 && toplamTutar) {
    const combinedKdv = findCombinedVat(rawText)
    if (combinedKdv !== undefined) {
      const rate = inferVatRateBucket(toplamTutar.value, combinedKdv)
      if (rate !== undefined) {
        kdvOranTutarlari = [{ oran: rate, matrah: round2(toplamTutar.value - combinedKdv), tutar: combinedKdv }]
      }
    }
  }

  return {
    rawText,
    firmaAdi: findCompanyName(rawText),
    vergiNo: findVergiNo(rawText),
    fisNo: findFisNo(rawText),
    belgeNo: findBelgeNo(rawText),
    tarih: findDate(rawText),
    saat: findTime(rawText),
    toplamTutar,
    odemeYontemi: findPaymentMethod(rawText),
    kdvOranTutarlari,
  }
}
