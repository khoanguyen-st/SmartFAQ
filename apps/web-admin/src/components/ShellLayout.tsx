import { NavLink } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Menu, X } from 'lucide-react'

const navItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' }
]

const ShellLayout = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg bg-slate-900 p-2 text-white md:hidden"
        aria-label="Toggle menu"
      >
        {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50 transition-transform duration-300 md:static',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="mb-6 text-lg font-semibold">SmartFAQ Admin</div>
        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
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

      {/* Main content */}
      <main className="flex w-full flex-1 flex-col md:w-auto">
        <header className="sticky top-0 z-20 flex flex-col gap-2 border-b border-slate-200/50 bg-[#eff3fb] px-4 py-4 pt-16 md:flex-row md:items-baseline md:justify-between md:gap-4 md:px-8 md:pt-4">
          <h1 className="text-2xl font-bold md:text-3xl">Greenwich SmartFAQ</h1>
          <span className="text-xs tracking-wider text-slate-500 uppercase">Version {__APP_VERSION__}</span>
        </header>
        <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-8">{children}</div>
      </main>
    </div>
  )
}

export default ShellLayout
