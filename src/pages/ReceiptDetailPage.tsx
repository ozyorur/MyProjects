import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import type { Receipt } from '../types'
import { deleteReceipt, getReceiptById } from '../services/receiptRepository'
import { getImageObjectUrl } from '../services/imageRepository'
import { formatCurrency } from '../utils/currency'
import { formatDateTR, formatDateTimeTR } from '../utils/date'
import { ZoomableImage } from '../components/receipts/ZoomableImage'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../hooks/useToast'
import { IconCopy, IconEdit, IconImage, IconTrash, IconZoomIn } from '../components/ui/icons'

export function ReceiptDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [receipt, setReceipt] = useState<Receipt | null | undefined>(undefined)
  const [imageUrl, setImageUrl] = useState<string | undefined>()
  const [showDelete, setShowDelete] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  useEffect(() => {
    if (!id) return
    getReceiptById(id).then(async (r) => {
      setReceipt(r ?? null)
      if (r?.fisFotografi) {
        setImageUrl(await getImageObjectUrl(r.fisFotografi))
      }
    })
  }, [id])

  if (receipt === undefined) {
    return <div className="py-20 text-center text-sm text-slate-400">Yükleniyor…</div>
  }
  if (receipt === null) {
    return (
      <div className="card px-6 py-16 text-center">
        <p className="text-slate-500">Fiş bulunamadı.</p>
        <Link to="/fisler" className="btn-secondary mt-4 inline-flex">
          Fişlere Dön
        </Link>
      </div>
    )
  }

  const handleDelete = async () => {
    await deleteReceipt(receipt.id)
    showToast('Fiş silindi.', 'success')
    navigate('/fisler')
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            {imageUrl ? (
              <div className="group relative">
                <ZoomableImage src={imageUrl} alt={receipt.firmaAdi} className="h-64 bg-slate-100 dark:bg-slate-800 lg:h-96" />
                <button
                  onClick={() => setShowFullscreen(true)}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"
                >
                  <IconZoomIn width={17} height={17} />
                </button>
              </div>
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
                <IconImage width={32} height={32} />
                <span className="text-sm">Fotoğraf yok</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-1">
            <button className="btn-secondary" onClick={() => navigate(`/fis-duzenle/${receipt.id}`)}>
              <IconEdit width={17} height={17} />
              Düzenle
            </button>
            <button className="btn-secondary" onClick={() => navigate(`/fis-ekle?copyFrom=${receipt.id}`)}>
              <IconCopy width={17} height={17} />
              Kopyala
            </button>
            {imageUrl && (
              <button className="btn-secondary" onClick={() => setShowFullscreen(true)}>
                <IconImage width={17} height={17} />
                Fotoğrafı Görüntüle
              </button>
            )}
            <button className="btn-danger" onClick={() => setShowDelete(true)}>
              <IconTrash width={17} height={17} />
              Sil
            </button>
          </div>
        </div>

        <div className="space-y-5 lg:col-span-3">
          <div className="card p-4 md:p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{receipt.firmaAdi}</h2>
                <p className="mt-0.5 text-sm text-slate-400">
                  {formatDateTR(receipt.tarih)}
                  {receipt.saat ? ` · ${receipt.saat}` : ''}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">{formatCurrency(receipt.toplamTutar)}</div>
                <span className="badge mt-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{receipt.kategori}</span>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
              <DetailField label="Müşteri" value={receipt.musteri} />
              <DetailField label="Vergi No" value={receipt.vergiNo} />
              <DetailField label="Fiş No" value={receipt.fisNo} />
              <DetailField label="Belge No" value={receipt.belgeNo} />
              <DetailField label="Ödeme Yöntemi" value={receipt.odemeYontemi} />
              <DetailField label="Açıklama" value={receipt.aciklama} />
            </dl>
            {receipt.notlar && (
              <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                {receipt.notlar}
              </div>
            )}
          </div>

          <div className="card p-4 md:p-5">
            <h3 className="mb-3 font-bold text-slate-800 dark:text-slate-100">KDV Dağılımı</h3>
            <div className="space-y-2">
              <VatRow label="%1 KDV" matrah={receipt.kdv1Matrah} tutar={receipt.kdv1Tutar} />
              <VatRow label="%10 KDV" matrah={receipt.kdv10Matrah} tutar={receipt.kdv10Tutar} />
              <VatRow label="%20 KDV" matrah={receipt.kdv20Matrah} tutar={receipt.kdv20Tutar} />
            </div>
            <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">KDV Hariç Toplam</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(receipt.kdvHaricToplam)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Toplam KDV</span>
                <span className="font-medium text-slate-800 dark:text-slate-100">{formatCurrency(receipt.toplamKdv)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="font-bold text-slate-700 dark:text-slate-200">Genel Toplam</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(receipt.toplamTutar)}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-400">
            Oluşturulma: {formatDateTimeTR(receipt.createdAt)} · Güncelleme: {formatDateTimeTR(receipt.updatedAt)}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Fişi Sil"
        message="Bu fişi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="Sil"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />

      {imageUrl && (
        <Modal open={showFullscreen} onClose={() => setShowFullscreen(false)} size="lg">
          <ZoomableImage src={imageUrl} alt={receipt.firmaAdi} className="h-[75dvh] bg-slate-900" />
        </Modal>
      )}
    </div>
  )
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-700 dark:text-slate-200">{value || '-'}</dd>
    </div>
  )
}

function VatRow({ label, matrah, tutar }: { label: string; matrah: number; tutar: number }) {
  if (matrah <= 0 && tutar <= 0) {
    return (
      <div className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-300 dark:text-slate-600">
        <span>{label}</span>
        <span>Kullanılmadı</span>
      </div>
    )
  }
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/60">
      <div className="font-semibold text-slate-700 dark:text-slate-200">{label}</div>
      <div className="mt-1 grid grid-cols-3 gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Hariç: {formatCurrency(matrah)}</span>
        <span>KDV: {formatCurrency(tutar)}</span>
        <span className="font-medium text-slate-700 dark:text-slate-200">Dahil: {formatCurrency(matrah + tutar)}</span>
      </div>
    </div>
  )
}
