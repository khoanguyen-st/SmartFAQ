import { NavLink } from 'react-router-dom'
import { useState, useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import Education from '@/assets/icon/education.svg?react'
import UserIcon from '@/assets/icon/user.svg?react'
import { Menu, X } from 'lucide-react'

const navItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' },
  { path: 'uploaded', label: 'Uploaded Documents' },
  { path: 'view-chat', label: 'View Chat' }
]

const ShellLayout = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])
  const handleNavigation = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isSidebarOpen])

  const Sidebar = useMemo(
    () => (
      <aside
        className={cn(
          'z-50 flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50 transition-transform duration-300',
          'fixed inset-y-0 left-0 shadow-2xl',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="text-lg font-semibold">SmartFAQ Admin</div>
          <button
            onClick={toggleSidebar}
            className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
            aria-label="Đóng Sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => (
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
    [isSidebarOpen, toggleSidebar, handleNavigation]
  )

  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50" onClick={toggleSidebar} />}
      {Sidebar}

      <main className="w-full flex-1 overflow-y-auto">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-1 text-gray-600 transition-colors hover:text-gray-800"
                aria-label={isSidebarOpen ? 'Đóng menu' : 'Mở menu'}
              >
                {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087]">
                <Education />
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
        <div className="flex flex-col gap-4 md:gap-6 flex-1">{children}</div>
      </main>
    </div>
  )
}

export default ShellLayout
