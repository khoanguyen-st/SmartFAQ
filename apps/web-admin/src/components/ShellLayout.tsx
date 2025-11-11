import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

const navItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' },
]

const ShellLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 bg-slate-900 px-4 py-6 text-slate-50 h-screen flex-col">
        <div className="mb-6 text-lg font-semibold">SmartFAQ Admin</div>
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-2 text-sm transition-colors duration-200',
                  isActive ? 'bg-primary-600 text-white' : 'bg-transparent hover:bg-slate-400/20'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col gap-4 md:gap-8 p-4 md:p-8 w-full min-h-screen max-w-[1920px] mx-auto">
        <header className="flex flex-col sm:flex-row items-start sm:items-baseline justify-between gap-2 sm:gap-4">
          <h1 className="text-xl md:text-3xl font-bold">Greenwich SmartFAQ</h1>
          <span className="text-xs uppercase tracking-wider text-slate-500">Version {__APP_VERSION__}</span>
        </header>
        <div className="flex flex-col gap-4 md:gap-6 flex-1">{children}</div>
      </main>
    </div>
  )
}

export default ShellLayout
