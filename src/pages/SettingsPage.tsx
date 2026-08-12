import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/database'
import { addCategory, addPaymentMethod, getCategories, getPaymentMethods } from '../services/metaRepository'
import { clearAllData, loadDemoData } from '../services/demoDataService'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { IconBackup, IconMoon, IconPlus, IconSun } from '../components/ui/icons'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const categories = useLiveQuery(() => getCategories(), [], [])
  const paymentMethods = useLiveQuery(() => getPaymentMethods(), [], [])
  const receiptCount = useLiveQuery(() => db.receipts.count(), [])

  const [newCategory, setNewCategory] = useState('')
  const [newPaymentMethod, setNewPaymentMethod] = useState('')
  const [loadingDemo, setLoadingDemo] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return
    await addCategory(newCategory.trim())
    setNewCategory('')
  }

  const handleAddPaymentMethod = async () => {
    if (!newPaymentMethod.trim()) return
    await addPaymentMethod(newPaymentMethod.trim())
    setNewPaymentMethod('')
  }

  const handleLoadDemo = async () => {
    setLoadingDemo(true)
    try {
      const count = await loadDemoData()
      showToast(`${count} adet demo fiş eklendi.`, 'success')
    } catch (err) {
      console.error(err)
      showToast('Demo veri yüklenirken hata oluştu.', 'error')
    } finally {
      setLoadingDemo(false)
    }
  }

  const handleClearAll = async () => {
    await clearAllData()
    setShowClearConfirm(false)
    showToast('Tüm fiş verileri temizlendi.', 'success')
  }

  return (
    <div className="space-y-5 pb-6">
      <section className="card p-5 md:p-6">
        <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Görünüm</h2>
        <div className="flex gap-2">
          <ThemeButton active={theme === 'light'} onClick={() => setTheme('light')} icon={<IconSun width={17} height={17} />} label="Açık" />
          <ThemeButton active={theme === 'dark'} onClick={() => setTheme('dark')} icon={<IconMoon width={17} height={17} />} label="Koyu" />
          <ThemeButton active={theme === 'system'} onClick={() => setTheme('system')} icon={<IconBackup width={17} height={17} />} label="Sistem" />
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Kategoriler</h2>
        <div className="flex flex-wrap gap-2">
          {categories?.map((c) => (
            <span key={c.id} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {c.name}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="input"
            placeholder="Yeni kategori adı"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <button className="btn-secondary shrink-0" onClick={handleAddCategory}>
            <IconPlus width={16} height={16} />
            Ekle
          </button>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="mb-4 font-bold text-slate-800 dark:text-slate-100">Ödeme Yöntemleri</h2>
        <div className="flex flex-wrap gap-2">
          {paymentMethods?.map((p) => (
            <span key={p.id} className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {p.name}
            </span>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <input
            className="input"
            placeholder="Yeni ödeme yöntemi"
            value={newPaymentMethod}
            onChange={(e) => setNewPaymentMethod(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddPaymentMethod()}
          />
          <button className="btn-secondary shrink-0" onClick={handleAddPaymentMethod}>
            <IconPlus width={16} height={16} />
            Ekle
          </button>
        </div>
      </section>

      <section className="card p-5 md:p-6">
        <h2 className="mb-1 font-bold text-slate-800 dark:text-slate-100">Veri Yönetimi</h2>
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          Verileriniz bu cihazda saklanmaktadır. Düzenli olarak yedek almanız önerilir.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className="btn-primary" onClick={() => navigate('/yedek')}>
            YEDEK AL
          </button>
          <button className="btn-secondary" onClick={() => navigate('/yedek')}>
            YEDEKTEN GERİ YÜKLE
          </button>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Demo Verileri Yükle</div>
              <p className="text-xs text-slate-400">Uygulamayı denemek için son 14 ayı kapsayan örnek fişler ekler.</p>
            </div>
            <button className="btn-secondary shrink-0" onClick={handleLoadDemo} disabled={loadingDemo}>
              {loadingDemo ? 'Yükleniyor…' : 'Demo Verileri Yükle'}
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-medium text-slate-700 dark:text-slate-200">Tüm Fiş Verilerini Temizle</div>
              <p className="text-xs text-slate-400">{receiptCount ?? 0} kayıt kalıcı olarak silinir. Önce yedek almanız önerilir.</p>
            </div>
            <button className="btn-danger shrink-0" onClick={() => setShowClearConfirm(true)}>
              Temizle
            </button>
          </div>
        </div>
      </section>

      <section className="card p-5 text-center text-xs text-slate-400 md:p-6">
        <p>FişTakip · Yerel-öncelikli gider ve KDV takip uygulaması</p>
        <p className="mt-1">
          Tüm verileriniz yalnızca bu cihazda saklanır. <Link to="/yedek" className="text-brand-600 underline dark:text-brand-400">Yedekleme sayfasını</Link> ziyaret edin.
        </p>
      </section>

      <ConfirmDialog
        open={showClearConfirm}
        title="Tüm Verileri Temizle"
        message="Bu işlem tüm fiş kayıtlarını ve fotoğraflarını kalıcı olarak silecektir. Bu işlem geri alınamaz. Devam etmeden önce yedek almanızı öneririz."
        confirmLabel="Evet, Temizle"
        danger
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  )
}

function ThemeButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-medium transition ${
        active
          ? 'border-brand-500 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-950/40 dark:text-brand-300'
          : 'border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
