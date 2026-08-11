import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { Category, PaymentMethod, Receipt } from '../types'
import { ReceiptCapture } from '../components/receipts/ReceiptCapture'
import { VatRateSection } from '../components/receipts/VatRateSection'
import { ZoomableImage } from '../components/receipts/ZoomableImage'
import { CreatableSelect } from '../components/ui/CreatableSelect'
import { DuplicateWarningModal } from '../components/receipts/DuplicateWarningModal'
import { compressImage } from '../services/imageCompression'
import { runOcr, type OcrResult } from '../services/ocrService'
import {
  createReceipt,
  findPotentialDuplicate,
  getReceiptById,
  updateReceipt,
} from '../services/receiptRepository'
import { getImageObjectUrl, replaceReceiptImage } from '../services/imageRepository'
import { addCategory, addPaymentMethod, getCategories, getPaymentMethods } from '../services/metaRepository'
import { calcFromInclusive, computeReceiptTotals, validateReceiptConsistency } from '../utils/vat'
import { formatCurrency, parseLocaleNumber, round2 } from '../utils/currency'
import { isoToday } from '../utils/date'
import { useToast } from '../hooks/useToast'
import { IconAlert, IconImage } from '../components/ui/icons'

interface VatSectionState {
  matrah: number
  tutar: number
}

const emptyVat: VatSectionState = { matrah: 0, tutar: 0 }

export function ReceiptFormPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const copyFromId = searchParams.get('copyFrom')
  const navigate = useNavigate()
  const { showToast } = useToast()

  const isEditing = Boolean(id)

  const [loading, setLoading] = useState(isEditing || Boolean(copyFromId))
  const [imageFile, setImageFile] = useState<File | Blob | null>(null)
  const [imagePreview, setImagePreview] = useState<string | undefined>()
  const [isPdf, setIsPdf] = useState(false)
  const [existingImageId, setExistingImageId] = useState<string | undefined>()
  const [showCapture, setShowCapture] = useState(!isEditing)

  const [ocrRunning, setOcrRunning] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrMeta, setOcrMeta] = useState<Record<string, 'low' | 'high'>>({})

  const [categories, setCategories] = useState<Category[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

  const [firmaAdi, setFirmaAdi] = useState('')
  const [vergiNo, setVergiNo] = useState('')
  const [musteri, setMusteri] = useState('')
  const [fisNo, setFisNo] = useState('')
  const [belgeNo, setBelgeNo] = useState('')
  const [tarih, setTarih] = useState(isoToday())
  const [saat, setSaat] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [kategori, setKategori] = useState('')
  const [odemeYontemi, setOdemeYontemi] = useState('')
  const [notlar, setNotlar] = useState('')
  const [toplamTutarStr, setToplamTutarStr] = useState('')

  const [kdv1, setKdv1] = useState<VatSectionState>(emptyVat)
  const [kdv10, setKdv10] = useState<VatSectionState>(emptyVat)
  const [kdv20, setKdv20] = useState<VatSectionState>(emptyVat)

  const [saving, setSaving] = useState(false)
  const [duplicate, setDuplicate] = useState<Receipt | null>(null)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  useEffect(() => {
    Promise.all([getCategories(), getPaymentMethods()]).then(([cats, pms]) => {
      setCategories(cats)
      setPaymentMethods(pms)
      setKategori((prev) => prev || cats.find((c) => c.name === 'Diğer')?.name || cats[0]?.name || '')
      setOdemeYontemi((prev) => prev || pms.find((p) => p.name === 'Nakit')?.name || pms[0]?.name || '')
    })
  }, [])

  useEffect(() => {
    async function load() {
      const sourceId = id ?? copyFromId
      if (!sourceId) {
        setLoading(false)
        return
      }
      const receipt = await getReceiptById(sourceId)
      if (!receipt) {
        showToast('Fiş bulunamadı', 'error')
        navigate('/fisler')
        return
      }
      applyReceiptToForm(receipt, Boolean(copyFromId))
      if (receipt.fisFotografi && !copyFromId) {
        setExistingImageId(receipt.fisFotografi)
        const url = await getImageObjectUrl(receipt.fisFotografi)
        setImagePreview(url)
        setIsPdf(false)
      }
      setShowCapture(false)
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, copyFromId])

  function applyReceiptToForm(r: Receipt, isCopy: boolean) {
    setFirmaAdi(r.firmaAdi)
    setVergiNo(r.vergiNo ?? '')
    setMusteri(r.musteri ?? '')
    setFisNo(r.fisNo ?? '')
    setBelgeNo(r.belgeNo ?? '')
    setTarih(isCopy ? isoToday() : r.tarih)
    setSaat(r.saat ?? '')
    setAciklama(r.aciklama ?? '')
    setKategori(r.kategori)
    setOdemeYontemi(r.odemeYontemi)
    setNotlar(r.notlar ?? '')
    setToplamTutarStr(String(r.toplamTutar).replace('.', ','))
    setKdv1({ matrah: r.kdv1Matrah, tutar: r.kdv1Tutar })
    setKdv10({ matrah: r.kdv10Matrah, tutar: r.kdv10Tutar })
    setKdv20({ matrah: r.kdv20Matrah, tutar: r.kdv20Tutar })
  }

  async function handleFileSelected(file: File) {
    setShowCapture(false)
    const pdf = file.type === 'application/pdf'
    setIsPdf(pdf)

    if (pdf) {
      setImageFile(file)
      setImagePreview(undefined)
      showToast('PDF eklendi. OCR yalnızca görsellerde çalışır, alanları manuel doldurabilirsiniz.', 'info')
      return
    }

    try {
      const compressed = await compressImage(file)
      setImageFile(compressed)
      const url = URL.createObjectURL(compressed)
      setImagePreview(url)

      setOcrRunning(true)
      setOcrProgress(0)
      const result = await runOcr(compressed, setOcrProgress)
      applyOcrResult(result)
      showToast('OCR tamamlandı. Alanları kontrol edip düzenleyebilirsiniz.', 'success')
    } catch (err) {
      console.error(err)
      showToast('OCR başarısız oldu, bilgileri manuel girebilirsiniz.', 'error')
    } finally {
      setOcrRunning(false)
    }
  }

  function applyOcrResult(result: OcrResult) {
    const meta: Record<string, 'low' | 'high'> = {}
    if (result.firmaAdi) {
      setFirmaAdi(result.firmaAdi.value)
      meta.firmaAdi = result.firmaAdi.confidence === 'high' ? 'high' : 'low'
    }
    if (result.vergiNo) {
      setVergiNo(result.vergiNo.value)
      meta.vergiNo = 'high'
    }
    if (result.fisNo) {
      setFisNo(result.fisNo.value)
      meta.fisNo = 'low'
    }
    if (result.belgeNo) {
      setBelgeNo(result.belgeNo.value)
      meta.belgeNo = 'low'
    }
    if (result.tarih) {
      setTarih(result.tarih.value)
      meta.tarih = result.tarih.confidence === 'high' ? 'high' : 'low'
    }
    if (result.saat) {
      setSaat(result.saat.value)
      meta.saat = 'high'
    }
    if (result.toplamTutar) {
      setToplamTutarStr(String(result.toplamTutar.value).replace('.', ','))
      meta.toplamTutar = 'high'
    }
    if (result.odemeYontemi) {
      setOdemeYontemi(result.odemeYontemi.value)
      meta.odemeYontemi = 'high'
    }
    for (const item of result.kdvOranTutarlari) {
      const { matrah, tutar } = calcFromInclusive(item.dahilTutar, item.oran / 100)
      if (item.oran === 1) setKdv1({ matrah, tutar })
      if (item.oran === 10) setKdv10({ matrah, tutar })
      if (item.oran === 20) setKdv20({ matrah, tutar })
      meta[`kdv${item.oran}`] = 'low'
    }
    setOcrMeta(meta)
  }

  const totals = useMemo(
    () => computeReceiptTotals({ kdv1, kdv10, kdv20 }),
    [kdv1, kdv10, kdv20]
  )

  const toplamTutar = useMemo(() => round2(parseLocaleNumber(toplamTutarStr)), [toplamTutarStr])

  const consistency = useMemo(
    () =>
      validateReceiptConsistency({
        kdv1Matrah: kdv1.matrah,
        kdv1Tutar: kdv1.tutar,
        kdv10Matrah: kdv10.matrah,
        kdv10Tutar: kdv10.tutar,
        kdv20Matrah: kdv20.matrah,
        kdv20Tutar: kdv20.tutar,
        toplamTutar,
      }),
    [kdv1, kdv10, kdv20, toplamTutar]
  )

  function validate(): string[] {
    const errs: string[] = []
    if (!tarih) errs.push('Tarih zorunludur.')
    if (!firmaAdi.trim()) errs.push('Firma adı zorunludur.')
    if (!(toplamTutar > 0)) errs.push('Toplam tutar sıfırdan büyük olmalıdır.')
    if (toplamTutar < 0) errs.push('Toplam tutar negatif olamaz.')
    return errs
  }

  async function persist(forceSaveDespiteDuplicate: boolean) {
    const validationErrors = validate()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }
    setErrors([])

    const resolvedKategori = kategori || categories.find((c) => c.name === 'Diğer')?.name || categories[0]?.name || 'Diğer'
    const resolvedOdemeYontemi = odemeYontemi || paymentMethods.find((p) => p.name === 'Nakit')?.name || paymentMethods[0]?.name || 'Nakit'
    if (resolvedKategori !== kategori) setKategori(resolvedKategori)
    if (resolvedOdemeYontemi !== odemeYontemi) setOdemeYontemi(resolvedOdemeYontemi)

    if (!forceSaveDespiteDuplicate) {
      const found = await findPotentialDuplicate({ firmaAdi, tarih, musteri, odemeYontemi: resolvedOdemeYontemi }, id)
      if (found) {
        setDuplicate(found)
        setShowDuplicateModal(true)
        return
      }
    }

    setSaving(true)
    try {
      const receiptInput = {
        firmaAdi: firmaAdi.trim(),
        vergiNo: vergiNo.trim() || undefined,
        musteri: musteri.trim() || undefined,
        fisNo: fisNo.trim() || undefined,
        belgeNo: belgeNo.trim() || undefined,
        tarih,
        saat: saat || undefined,
        aciklama: aciklama.trim() || undefined,
        kategori: resolvedKategori,
        odemeYontemi: resolvedOdemeYontemi,
        kdv1Matrah: kdv1.matrah,
        kdv1Tutar: kdv1.tutar,
        kdv10Matrah: kdv10.matrah,
        kdv10Tutar: kdv10.tutar,
        kdv20Matrah: kdv20.matrah,
        kdv20Tutar: kdv20.tutar,
        kdvHaricToplam: totals.kdvHaric,
        toplamKdv: totals.toplamKdv,
        toplamTutar,
        fisFotografi: existingImageId,
        notlar: notlar.trim() || undefined,
        ocrMeta,
      }

      let saved: Receipt
      if (isEditing && id) {
        saved = await updateReceipt(id, receiptInput)
      } else {
        saved = await createReceipt(receiptInput)
      }

      if (imageFile) {
        const newImageId = await replaceReceiptImage(isEditing ? existingImageId : undefined, saved.id, imageFile)
        saved = await updateReceipt(saved.id, { ...receiptInput, fisFotografi: newImageId })
      }

      showToast(isEditing ? 'Fiş güncellendi.' : 'Fiş kaydedildi.', 'success')
      navigate(`/fisler/${saved.id}`)
    } catch (err) {
      console.error(err)
      showToast('Kaydetme sırasında bir hata oluştu.', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-sm text-slate-400">Yükleniyor…</div>
  }

  if (showCapture) {
    return <ReceiptCapture onFileSelected={handleFileSelected} onSkip={() => setShowCapture(false)} />
  }

  return (
    <div className="space-y-5 pb-6">
      {ocrRunning && (
        <div className="card flex items-center gap-3 px-4 py-3 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <span className="text-slate-600 dark:text-slate-300">Fiş okunuyor… %{ocrProgress}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {isPdf ? (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
                <IconImage width={32} height={32} />
                <span className="text-sm">PDF dosyası eklendi</span>
              </div>
            ) : imagePreview ? (
              <ZoomableImage src={imagePreview} alt="Fiş" className="h-64 bg-slate-100 dark:bg-slate-800 lg:h-96" />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
                <IconImage width={32} height={32} />
                <span className="text-sm">Fotoğraf eklenmedi</span>
              </div>
            )}
            <div className="p-3">
              <button className="btn-secondary w-full" onClick={() => setShowCapture(true)}>
                Fotoğrafı Değiştir
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-3">
          {errors.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
              <ul className="list-inside list-disc space-y-0.5">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="card space-y-4 p-4 md:p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Genel Bilgiler</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">
                  Firma / İşyeri Adı <span className="text-red-500">*</span>
                  {ocrMeta.firmaAdi === 'low' && <OcrBadge />}
                </label>
                <input className="input" value={firmaAdi} onChange={(e) => setFirmaAdi(e.target.value)} placeholder="Örn: Migros" />
              </div>
              <div>
                <label className="label">
                  Tarih <span className="text-red-500">*</span>
                  {ocrMeta.tarih === 'low' && <OcrBadge />}
                </label>
                <input type="date" className="input" value={tarih} onChange={(e) => setTarih(e.target.value)} />
              </div>
              <div>
                <label className="label">Saat</label>
                <input type="time" className="input" value={saat} onChange={(e) => setSaat(e.target.value)} />
              </div>
              <div>
                <label className="label">Vergi No</label>
                <input className="input" value={vergiNo} onChange={(e) => setVergiNo(e.target.value)} />
              </div>
              <div>
                <label className="label">Müşteri</label>
                <input className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)} placeholder="Opsiyonel" />
              </div>
              <div>
                <label className="label">Fiş No</label>
                <input className="input" value={fisNo} onChange={(e) => setFisNo(e.target.value)} />
              </div>
              <div>
                <label className="label">Belge No</label>
                <input className="input" value={belgeNo} onChange={(e) => setBelgeNo(e.target.value)} />
              </div>
              <CreatableSelect
                label="Kategori"
                value={kategori}
                options={categories}
                onChange={setKategori}
                onCreate={async (name) => {
                  const c = await addCategory(name)
                  setCategories(await getCategories())
                  return c
                }}
              />
              <CreatableSelect
                label="Ödeme Yöntemi"
                value={odemeYontemi}
                options={paymentMethods}
                onChange={setOdemeYontemi}
                onCreate={async (name) => {
                  const p = await addPaymentMethod(name)
                  setPaymentMethods(await getPaymentMethods())
                  return p
                }}
              />
              <div className="sm:col-span-2">
                <label className="label">Açıklama</label>
                <input className="input" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Opsiyonel" />
              </div>
            </div>
          </div>

          <div className="card space-y-4 p-4 md:p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">
              Toplam Tutar <span className="text-red-500">*</span>
              {ocrMeta.toplamTutar === 'low' && <OcrBadge />}
            </h3>
            <input
              type="text"
              inputMode="decimal"
              className="input text-lg font-semibold"
              value={toplamTutarStr}
              onChange={(e) => setToplamTutarStr(e.target.value)}
              placeholder="0,00"
            />
          </div>

          <div className="card space-y-3 p-4 md:p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">KDV Dağılımı</h3>
            <p className="text-sm text-slate-400">Yalnızca fişte bulunan oranları doldurun.</p>
            <div className="space-y-2">
              <VatRateSection title="%1 KDV" rate={0.01} matrah={kdv1.matrah} tutar={kdv1.tutar} onChange={(m, t) => setKdv1({ matrah: m, tutar: t })} confidence={ocrMeta.kdv1} />
              <VatRateSection title="%10 KDV" rate={0.1} matrah={kdv10.matrah} tutar={kdv10.tutar} onChange={(m, t) => setKdv10({ matrah: m, tutar: t })} confidence={ocrMeta.kdv10} />
              <VatRateSection title="%20 KDV" rate={0.2} matrah={kdv20.matrah} tutar={kdv20.tutar} onChange={(m, t) => setKdv20({ matrah: m, tutar: t })} confidence={ocrMeta.kdv20} />
            </div>

            <div className="mt-2 space-y-1.5 rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">KDV Hariç</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(totals.kdvHaric)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Toplam KDV</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(totals.toplamKdv)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1.5 dark:border-slate-700">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Hesaplanan Genel Toplam</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(totals.genelToplam)}</span>
              </div>
            </div>

            {!consistency.isConsistent && toplamTutar > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400">
                <IconAlert width={16} height={16} className="mt-0.5 shrink-0" />
                <span>
                  KDV dağılımı toplamı ({formatCurrency(consistency.calculatedTotal)}) ile girilen toplam tutar ({formatCurrency(toplamTutar)}) arasında fark var.
                  Yine de kaydedebilirsiniz.
                </span>
              </div>
            )}
          </div>

          <div className="card space-y-3 p-4 md:p-5">
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Notlar</h3>
            <textarea className="input min-h-20" value={notlar} onChange={(e) => setNotlar(e.target.value)} placeholder="Opsiyonel notlar" />
          </div>

          <div className="sticky bottom-16 flex gap-3 md:static">
            <button className="btn-secondary flex-1" onClick={() => navigate(-1)} disabled={saving}>
              Vazgeç
            </button>
            <button className="btn-primary flex-1" onClick={() => persist(false)} disabled={saving}>
              {saving ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        </div>
      </div>

      <DuplicateWarningModal
        open={showDuplicateModal}
        duplicate={duplicate}
        onCancel={() => setShowDuplicateModal(false)}
        onOpenExisting={() => duplicate && navigate(`/fisler/${duplicate.id}`)}
        onSaveAnyway={() => {
          setShowDuplicateModal(false)
          persist(true)
        }}
      />
    </div>
  )
}

function OcrBadge() {
  return (
    <span className="badge ml-2 bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
      OCR: kontrol edin
    </span>
  )
}
