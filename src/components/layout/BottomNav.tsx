import { NavLink } from 'react-router-dom'
import { IconDashboard, IconPlus, IconReceipt, IconReports, IconSettings } from '../ui/icons'

const items = [
  { to: '/', label: 'Ana Sayfa', icon: IconDashboard, end: true },
  { to: '/fisler', label: 'Fişler', icon: IconReceipt },
  { to: '/fis-ekle', label: 'Fiş', icon: IconPlus, primary: true },
  { to: '/raporlar', label: 'Raporlar', icon: IconReports },
  { to: '/ayarlar', label: 'Ayarlar', icon: IconSettings },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-900/95">
      <div className="flex items-stretch justify-around">
        {items.map((item) =>
          item.primary ? (
            <NavLink key={item.to} to={item.to} className="flex flex-1 flex-col items-center justify-center py-2">
              <span className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/30">
                <item.icon width={22} height={22} stroke="white" />
              </span>
              <span className="mt-0.5 text-[11px] font-medium text-brand-600 dark:text-brand-400">{item.label}</span>
            </NavLink>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
                }`
              }
            >
              <item.icon width={20} height={20} />
              {item.label}
            </NavLink>
          )
        )}
      </div>
    </nav>
  )
}
