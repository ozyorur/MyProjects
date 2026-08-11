import { NavLink } from 'react-router-dom'
import { IconBackup, IconDashboard, IconPlus, IconReceipt, IconReports, IconSettings } from '../ui/icons'

const navItems = [
  { to: '/', label: 'Dashboard', icon: IconDashboard, end: true },
  { to: '/fis-ekle', label: 'Yeni Fiş', icon: IconPlus },
  { to: '/fisler', label: 'Fişler', icon: IconReceipt },
  { to: '/raporlar', label: 'Raporlar', icon: IconReports },
  { to: '/yedek', label: 'Yedek', icon: IconBackup },
  { to: '/ayarlar', label: 'Ayarlar', icon: IconSettings },
]

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white font-bold shadow-sm">
          F
        </div>
        <div>
          <div className="text-base font-bold leading-tight text-slate-900 dark:text-white">FişTakip</div>
          <div className="text-[11px] text-slate-400">Gider &amp; KDV Takibi</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`
            }
          >
            <item.icon width={19} height={19} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 pb-5 pt-2">
        <NavLink to="/fis-ekle" className="btn-primary w-full">
          <IconPlus width={18} height={18} />
          Fiş Ekle
        </NavLink>
      </div>
    </aside>
  )
}
