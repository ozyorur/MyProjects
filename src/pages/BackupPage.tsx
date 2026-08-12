import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/database'
import {
  type BackupSummary,
  type ParsedBackup,
  downloadBackup,
  parseBackupZip,
  restoreFromBackup,
  summarizeParsedBackup,
} from '../services/backupService'
import type { RestoreSummary } from '../types'
import { formatDateTimeTR, formatDateTR } from '../utils/date'
import { Modal } from '../components/ui/Modal'
import { useToast } from '../hooks/useToast'
import { IconBackup, IconCheck, IconDownload, IconUpload } from '../components/ui/icons'

export function BackupPage() {
  const settings = useLiveQuery(() => db.settings.get('app'), [])
  const { showToast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [backingUp, setBackingUp] = useState(false)
  const [parsed, setParsed] = useState<ParsedBackup | null>(null)
  const [summary, setSummary] = useState<BackupSummary | null>(null)
  const [createSafetyBackup, setCreateSafetyBackup] = useState(true)
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState<RestoreSummary | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const handleBackup = async () => {
    setBackingUp(true)
    try {
      await downloadBackup()
      showToast('Yedek başarıyla indirildi.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Yedek alınırken bir hata oluştu.', 'error')
    } finally {
      setBackingUp(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setParseError(null)
    try {
      const result = await parseBackupZip(file)
      setParsed(result)
      setSummary(summarizeParsedBackup(result))
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Yedek dosyası okunamadı.')
    }
  }

  const handleRestore = async () => {
    if (!parsed) return
    setRestoring(true)
    try {
      const result = await restoreFromBackup(parsed, { createSafetyBackup })
      setRestoreResult(result)
      setParsed(null)
      setSummary(null)
      showToast('Geri yükleme tamamlandı.', 'success')
    } catch (err) {
      console.error(err)
      showToast('Geri yükleme sırasında bir hata oluştu.', 'error')
    } finally {
      setRestoring(false)
    }
  }

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
        Verileriniz bu cihazda saklanmaktadır. Tarayıcı verileri temizlenirse kayıtlarınız kaybolabilir. Düzenli olarak yedek almanız önerilir.
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
            <IconDownload width={22} height={22} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Yedek Al</h2>
            <p className="text-sm text-slate-400">
              {settings?.lastBackupAt ? `Son yedek: ${formatDateTimeTR(settings.lastBackupAt)}` : 'Henüz yedek alınmadı.'}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Tüm fişleriniz, fotoğrafları, kategoriler ve ödeme yöntemleri tek bir ZIP dosyasına aktarılır. Bu dosyayı başka bir cihaza aktararak
          verilerinizi taşıyabilirsiniz.
        </p>
        <button className="btn-primary mt-4" onClick={handleBackup} disabled={backingUp}>
          <IconDownload width={17} height={17} />
          {backingUp ? 'Yedek Hazırlanıyor…' : 'YEDEK AL'}
        </button>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
            <IconUpload width={22} height={22} />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">Yedekten Geri Yükle</h2>
            <p className="text-sm text-slate-400">Bir ZIP yedek dosyası seçin.</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Aynı firma, tarih, müşteri ve ödeme yöntemine sahip kayıtlar otomatik olarak güncellenir; tekrar oluşturulmaz.
        </p>
        <button className="btn-secondary mt-4" onClick={() => fileRef.current?.click()}>
          <IconUpload width={17} height={17} />
          Yedek Dosyası Seç
        </button>
        <input ref={fileRef} type="file" accept=".zip" className="hidden" onChange={handleFileChange} />
        {parseError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{parseError}</p>}
      </div>

      <Modal open={Boolean(summary)} onClose={() => { setParsed(null); setSummary(null) }} title="Yedek Bulundu">
        {summary && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <SummaryStat label="Fiş" value={String(summary.fisSayisi)} />
              <SummaryStat label="Firma" value={String(summary.firmaSayisi)} />
              <SummaryStat
                label="Tarih Aralığı"
                value={summary.tarihAraligi ? `${formatDateTR(summary.tarihAraligi.start)} - ${formatDateTR(summary.tarihAraligi.end)}` : '-'}
                small
              />
            </div>
            <label className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3 text-sm dark:bg-slate-800/60">
              <input type="checkbox" checked={createSafetyBackup} onChange={(e) => setCreateSafetyBackup(e.target.checked)} className="h-4 w-4 rounded" />
              <span className="text-slate-600 dark:text-slate-300">Geri yüklemeden önce mevcut verilerin otomatik yedeğini al</span>
            </label>
            <div className="flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => { setParsed(null); setSummary(null) }}>
                Vazgeç
              </button>
              <button className="btn-primary flex-1" onClick={handleRestore} disabled={restoring}>
                {restoring ? 'Geri Yükleniyor…' : 'Geri Yükle'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(restoreResult)} onClose={() => setRestoreResult(null)} title="Geri Yükleme Tamamlandı">
        {restoreResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <IconCheck width={18} height={18} />
              <span className="text-sm font-medium">İşlem başarıyla tamamlandı.</span>
            </div>
            <ResultRow label="Toplam yedek kaydı" value={restoreResult.toplamKayit} />
            <ResultRow label="Yeni eklenen" value={restoreResult.yeniEklenen} />
            <ResultRow label="Üzerine yazılan" value={restoreResult.uzerineYazilan} />
            <ResultRow label="Hatalı" value={restoreResult.hatali} />
            <button className="btn-primary w-full" onClick={() => setRestoreResult(null)}>
              Tamam
            </button>
          </div>
        )}
      </Modal>

      <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-4 py-3.5 text-sm text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
        <IconBackup width={17} height={17} className="mt-0.5 shrink-0" />
        <span>Yedek dosyanızı e-posta, bulut depolama veya USB bellek gibi güvenli bir yerde saklamanız önerilir.</span>
      </div>
    </div>
  )
}

function SummaryStat({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="rounded-xl bg-slate-50 px-2 py-3 dark:bg-slate-800/60">
      <div className={`font-bold text-slate-800 dark:text-slate-100 ${small ? 'text-xs' : 'text-lg'}`}>{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{label}</div>
    </div>
  )
}

function ResultRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5 text-sm dark:bg-slate-800/60">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="font-bold text-slate-800 dark:text-slate-100">{value.toLocaleString('tr-TR')}</span>
    </div>
  )
}
