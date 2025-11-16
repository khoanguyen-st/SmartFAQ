import { NavLink } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Menu, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { EducationIcon, UserIcon } from '@/assets'
import { useI18n } from '@/lib/i18n'

const ShellLayout = ({ children }: { children: ReactNode }) => {
  const { t } = useI18n()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navItems = useMemo(
    () => [
      { path: 'dashboard', label: t('dashboard') },
      { path: 'users', label: t('users') },
      { path: 'logs', label: t('logs') },
      { path: 'settings', label: t('settings') },
      { path: 'uploaded', label: t('uploadedDocuments') },
      { path: 'view-chat', label: t('viewChat') }
    ],
    [t]
  )

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])
  const handleNavigation = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isSidebarOpen])

  const sidebar = useMemo(
    () => (
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50 shadow-2xl transition-transform duration-300',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:translate-x-0'
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold">SmartFAQ Admin</div>
          <button
            onClick={toggleSidebar}
            className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:hidden"
            aria-label={t('closeSidebar')}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={handleNavigation}
              className={({ isActive }) =>
                cn(
                  'rounded-lg px-3.5 py-2 text-sm transition-colors duration-200',
                  isActive ? 'bg-[#003087] text-white' : 'bg-transparent hover:bg-slate-400/20'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    ),
    [handleNavigation, isSidebarOpen, toggleSidebar, navItems, t]
  )

  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />}
      {sidebar}

      <main className="flex w-full flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-1 text-gray-600 transition-colors hover:text-gray-800 lg:hidden"
                aria-label={isSidebarOpen ? t('closeMenu') : t('openMenu')}
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087]">
                <EducationIcon />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Greenwich SmartFAQ</h1>
                <p className="text-sm text-gray-500">Document-based chatbot training system</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <UserIcon />
              <span className="text-sm font-medium">BO User</span>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 sm:gap-6 sm:p-6">{children}</div>
      </main>
    </div>
  )
}

export default ShellLayout
