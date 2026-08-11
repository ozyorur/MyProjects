import { useState } from 'react'
import { formatCurrency, parseLocaleNumber, round2 } from '../../utils/currency'
import { calcFromInclusive } from '../../utils/vat'
import { IconChevronDown } from '../ui/icons'
import type { FieldConfidence } from '../../types'

interface VatRateSectionProps {
  title: string
  rate: number // 0.01 | 0.1 | 0.2
  matrah: number
  tutar: number
  onChange: (matrah: number, tutar: number) => void
  confidence?: FieldConfidence
  defaultOpen?: boolean
}

export function VatRateSection({ title, rate, matrah, tutar, onChange, confidence, defaultOpen }: VatRateSectionProps) {
  const hasValue = matrah > 0 || tutar > 0
  const [open, setOpen] = useState(defaultOpen ?? hasValue)
  const [dahilInput, setDahilInput] = useState('')

  const dahil = round2(matrah + tutar)

  const handleDahilCalc = () => {
    const val = parseLocaleNumber(dahilInput)
    if (val > 0) {
      const { matrah: m, tutar: t } = calcFromInclusive(val, rate)
      onChange(m, t)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-800 dark:text-slate-100">{title}</span>
          {confidence === 'low' && (
            <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">OCR: kontrol edin</span>
          )}
          {hasValue && !open && (
            <span className="text-sm text-slate-400">· {formatCurrency(dahil)} dahil</span>
          )}
        </div>
        <IconChevronDown width={18} height={18} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-4 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">KDV Hariç (Matrah)</label>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={matrah === 0 ? '' : String(matrah).replace('.', ',')}
                placeholder="0,00"
                onChange={(e) => onChange(round2(parseLocaleNumber(e.target.value)), tutar)}
              />
            </div>
            <div>
              <label className="label">KDV Tutarı</label>
              <input
                type="text"
                inputMode="decimal"
                className="input"
                value={tutar === 0 ? '' : String(tutar).replace('.', ',')}
                placeholder="0,00"
                onChange={(e) => onChange(matrah, round2(parseLocaleNumber(e.target.value)))}
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
            <span className="text-slate-500 dark:text-slate-400">KDV Dahil</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">{formatCurrency(dahil)}</span>
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-brand-600 dark:text-brand-400">KDV dahil tutardan otomatik hesapla</summary>
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                inputMode="decimal"
                className="input"
                placeholder={`Örn: ${title} dahil tutar`}
                value={dahilInput}
                onChange={(e) => setDahilInput(e.target.value)}
              />
              <button type="button" onClick={handleDahilCalc} className="btn-secondary shrink-0">
                Hesapla
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
