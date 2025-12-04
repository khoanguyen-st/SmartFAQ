import { useEffect } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api'
import { useState, useCallback, useMemo } from 'react'
import educationUrl from '@/assets/icons/education.svg'
import userUrl from '@/assets/icons/user.svg'
import { Menu, X } from 'lucide-react'

type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>
const EducationIcon: React.FC<ImgCompProps> = props => <img src={educationUrl} alt="edu" {...props} />
const UserIcon: React.FC<ImgCompProps> = props => <img src={userUrl} alt="upload" {...props} />

const navItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' },
  { path: 'uploaded', label: 'Uploaded Documents' },
  { path: 'view-chat', label: 'View Chat' },
  { path: 'departments', label: 'Departments' },
  { path: 'profile', label: 'Profile' }
]

const ShellLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])
  const handleNavigation = useCallback(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false)
    }
  }, [isSidebarOpen])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // Even if logout fails, clear token and redirect
      localStorage.removeItem('access_token')
      navigate('/login')
    }
  }, [navigate])

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
        <button
          onClick={handleLogout}
          className="mt-auto rounded-lg bg-transparent px-3.5 py-2 text-sm text-red-400 transition-colors duration-200 hover:bg-red-600/20 hover:text-red-300"
        >
          Logout
        </button>
      </aside>
    ),
    [isSidebarOpen, toggleSidebar, handleNavigation, handleLogout]
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
        <div className="flex flex-col gap-6 p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default ShellLayout
