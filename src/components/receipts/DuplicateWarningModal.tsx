import type { Receipt } from '../../types'
import { Modal } from '../ui/Modal'
import { formatCurrency } from '../../utils/currency'
import { formatDateTR } from '../../utils/date'

interface DuplicateWarningModalProps {
  open: boolean
  duplicate: Receipt | null
  onOpenExisting: () => void
  onSaveAnyway: () => void
  onCancel: () => void
}

export function DuplicateWarningModal({ open, duplicate, onOpenExisting, onSaveAnyway, onCancel }: DuplicateWarningModalProps) {
  if (!duplicate) return null
  return (
    <Modal open={open} onClose={onCancel} title="Benzer bir fiş zaten mevcut">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Aynı firma, tarih, müşteri ve ödeme yöntemine sahip bir fiş bulundu:
      </p>
      <div className="mt-3 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-800">
        <div className="font-semibold text-slate-800 dark:text-slate-100">{duplicate.firmaAdi}</div>
        <div className="mt-1 flex justify-between text-slate-500 dark:text-slate-400">
          <span>{formatDateTR(duplicate.tarih)}</span>
          <span>{formatCurrency(duplicate.toplamTutar)}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button className="btn-secondary" onClick={onCancel}>
          Vazgeç
        </button>
        <button className="btn-secondary" onClick={onOpenExisting}>
          Mevcut Fişi Aç
        </button>
        <button className="btn-primary" onClick={onSaveAnyway}>
          Yine de Kaydet
        </button>
      </div>
    </Modal>
  )
}
