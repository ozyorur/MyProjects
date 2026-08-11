import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/database'
import type { Receipt } from '../types'
import { formatCurrency } from '../utils/currency'
import { formatDateTR } from '../utils/date'
import { IconChevronRight, IconFilter, IconPlus, IconSearch } from '../components/ui/icons'
import { getCategories, getPaymentMethods } from '../services/metaRepository'

type SortOption = 'newest' | 'oldest' | 'amountDesc' | 'amountAsc'

const sortLabels: Record<SortOption, string> = {
  newest: 'En Yeni',
  oldest: 'En Eski',
  amountDesc: 'Tutar: Yüksekten Düşüğe',
  amountAsc: 'Tutar: Düşükten Yükseğe',
}

export function ReceiptsListPage() {
  const receipts = useLiveQuery(() => db.receipts.toArray(), [])
  const categories = useLiveQuery(() => getCategories(), [])
  const paymentMethods = useLiveQuery(() => getPaymentMethods(), [])

  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<SortOption>('newest')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [firma, setFirma] = useState('')
  const [musteri, setMusteri] = useState('')
  const [kategori, setKategori] = useState('')
  const [odemeYontemi, setOdemeYontemi] = useState('')
  const [vatRate, setVatRate] = useState<'' | '1' | '10' | '20'>('')

  const companies = useMemo(() => {
    if (!receipts) return []
    return Array.from(new Set(receipts.map((r) => r.firmaAdi))).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [receipts])

  const filtered = useMemo(() => {
    if (!receipts) return []
    const q = search.trim().toLocaleLowerCase('tr-TR')
    let list = receipts.filter((r) => {
      if (q) {
        const haystack = `${r.firmaAdi} ${r.musteri ?? ''} ${r.fisNo ?? ''} ${r.belgeNo ?? ''} ${r.aciklama ?? ''}`.toLocaleLowerCase('tr-TR')
        if (!haystack.includes(q)) return false
      }
      if (startDate && r.tarih < startDate) return false
      if (endDate && r.tarih > endDate) return false
      if (firma && r.firmaAdi !== firma) return false
      if (musteri && (r.musteri ?? '') !== musteri) return false
      if (kategori && r.kategori !== kategori) return false
      if (odemeYontemi && r.odemeYontemi !== odemeYontemi) return false
      if (vatRate === '1' && r.kdv1Tutar <= 0) return false
      if (vatRate === '10' && r.kdv10Tutar <= 0) return false
      if (vatRate === '20' && r.kdv20Tutar <= 0) return false
      return true
    })

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.tarih.localeCompare(a.tarih) || b.createdAt.localeCompare(a.createdAt)
        case 'oldest':
          return a.tarih.localeCompare(b.tarih) || a.createdAt.localeCompare(b.createdAt)
        case 'amountDesc':
          return b.toplamTutar - a.toplamTutar
        case 'amountAsc':
          return a.toplamTutar - b.toplamTutar
      }
    })
    return list
  }, [receipts, search, startDate, endDate, firma, musteri, kategori, odemeYontemi, vatRate, sort])

  const customers = useMemo(() => {
    if (!receipts) return []
    return Array.from(new Set(receipts.map((r) => r.musteri).filter(Boolean) as string[])).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [receipts])

  const activeFilterCount = [startDate, endDate, firma, musteri, kategori, odemeYontemi, vatRate].filter(Boolean).length

  const clearFilters = () => {
    setStartDate('')
    setEndDate('')
    setFirma('')
    setMusteri('')
    setKategori('')
    setOdemeYontemi('')
    setVatRate('')
  }

  if (!receipts) {
    return <div className="py-20 text-center text-sm text-slate-400">Yükleniyor…</div>
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch width={17} height={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Firma, müşteri, fiş no, belge no veya açıklama ara…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary relative" onClick={() => setShowFilters((s) => !s)}>
            <IconFilter width={17} height={17} />
            Filtrele
            {activeFilterCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
          <Link to="/fis-ekle" className="btn-primary hidden sm:inline-flex">
            <IconPlus width={17} height={17} />
            Fiş Ekle
          </Link>
        </div>
      </div>

      {showFilters && (
        <div className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="label">Başlangıç Tarihi</label>
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Bitiş Tarihi</label>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Sıralama</label>
            <select className="input" value={sort} onChange={(e) => setSort(e.target.value as SortOption)}>
              {Object.entries(sortLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Firma</label>
            <select className="input" value={firma} onChange={(e) => setFirma(e.target.value)}>
              <option value="">Tümü</option>
              {companies.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Müşteri</label>
            <select className="input" value={musteri} onChange={(e) => setMusteri(e.target.value)}>
              <option value="">Tümü</option>
              {customers.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Kategori</label>
            <select className="input" value={kategori} onChange={(e) => setKategori(e.target.value)}>
              <option value="">Tümü</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Ödeme Yöntemi</label>
            <select className="input" value={odemeYontemi} onChange={(e) => setOdemeYontemi(e.target.value)}>
              <option value="">Tümü</option>
              {paymentMethods?.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">KDV Oranı</label>
            <select className="input" value={vatRate} onChange={(e) => setVatRate(e.target.value as typeof vatRate)}>
              <option value="">Tümü</option>
              <option value="1">%1</option>
              <option value="10">%10</option>
              <option value="20">%20</option>
            </select>
          </div>
          <div className="flex items-end sm:col-span-2 md:col-span-1">
            <button className="btn-ghost" onClick={clearFilters}>
              Filtreleri Temizle
            </button>
          </div>
        </div>
      )}

      <div className="text-sm text-slate-400">{filtered.length} fiş bulundu</div>

      {filtered.length === 0 ? (
        <div className="card px-6 py-16 text-center text-sm text-slate-400">Kayıt bulunamadı.</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  <th className="px-4 py-3 font-medium">Tarih</th>
                  <th className="px-4 py-3 font-medium">Firma</th>
                  <th className="px-4 py-3 font-medium">Müşteri</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Ödeme</th>
                  <th className="px-4 py-3 text-right font-medium">KDV Hariç</th>
                  <th className="px-4 py-3 text-right font-medium">%1</th>
                  <th className="px-4 py-3 text-right font-medium">%10</th>
                  <th className="px-4 py-3 text-right font-medium">%20</th>
                  <th className="px-4 py-3 text-right font-medium">Toplam KDV</th>
                  <th className="px-4 py-3 text-right font-medium">Toplam</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <ReceiptRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2.5 md:hidden">
            {filtered.map((r) => (
              <ReceiptCard key={r.id} r={r} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function ReceiptRow({ r }: { r: Receipt }) {
  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-4 py-3 text-slate-500 dark:text-slate-400">{formatDateTR(r.tarih)}</td>
      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-100">{r.firmaAdi}</td>
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.musteri || '-'}</td>
      <td className="px-4 py-3">
        <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{r.kategori}</span>
      </td>
      <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{r.odemeYontemi}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(r.kdvHaricToplam)}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{r.kdv1Tutar > 0 ? formatCurrency(r.kdv1Tutar) : '-'}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{r.kdv10Tutar > 0 ? formatCurrency(r.kdv10Tutar) : '-'}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-500 dark:text-slate-400">{r.kdv20Tutar > 0 ? formatCurrency(r.kdv20Tutar) : '-'}</td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(r.toplamKdv)}</td>
      <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">{formatCurrency(r.toplamTutar)}</td>
      <td className="px-4 py-3 text-right">
        <Link to={`/fisler/${r.id}`} className="inline-flex text-slate-400 hover:text-brand-600">
          <IconChevronRight width={18} height={18} />
        </Link>
      </td>
    </tr>
  )
}

function ReceiptCard({ r }: { r: Receipt }) {
  return (
    <Link to={`/fisler/${r.id}`} className="card flex items-center justify-between gap-3 px-4 py-3.5 active:scale-[0.99]">
      <div className="min-w-0">
        <div className="truncate font-semibold text-slate-800 dark:text-slate-100">{r.firmaAdi}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-400">
          <span>{formatDateTR(r.tarih)}</span>
          <span>·</span>
          <span>{r.kategori}</span>
          <span>·</span>
          <span>{r.odemeYontemi}</span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(r.toplamTutar)}</div>
          {r.toplamKdv > 0 && <div className="text-xs text-slate-400">KDV {formatCurrency(r.toplamKdv)}</div>}
        </div>
        <IconChevronRight width={18} height={18} className="text-slate-300" />
      </div>
    </Link>
  )
}
