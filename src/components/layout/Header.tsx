import { useLocation } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { IconMoon, IconSun } from '../ui/icons'

const titles: Record<string, string> = {
  '/': 'Dashboard',
  '/fis-ekle': 'Yeni Fiş',
  '/fisler': 'Fişler',
  '/raporlar': 'Raporlar',
  '/yedek': 'Yedekleme',
  '/ayarlar': 'Ayarlar',
}

function resolveTitle(pathname: string): string {
  if (titles[pathname]) return titles[pathname]
  if (pathname.startsWith('/fisler/')) return 'Fiş Detayı'
  if (pathname.startsWith('/fis-duzenle/')) return 'Fişi Düzenle'
  return 'FişTakip'
}

export function Header() {
  const location = useLocation()
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3.5 backdrop-blur md:px-8 dark:border-slate-800 dark:bg-slate-950/90">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white md:hidden">
          F
        </div>
        <h1 className="text-lg font-bold text-slate-900 md:text-xl dark:text-white">{resolveTitle(location.pathname)}</h1>
      </div>
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Tema değiştir"
      >
        {resolvedTheme === 'dark' ? <IconSun width={19} height={19} /> : <IconMoon width={19} height={19} />}
      </button>
    </header>
  )
}
