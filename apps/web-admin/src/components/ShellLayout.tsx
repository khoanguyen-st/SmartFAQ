import { useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api'

const navItems = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' },
  { path: 'view-chat', label: 'View  Chat' },
  { path: 'profile', label: 'Profile' }
]

const ShellLayout = () => {
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      // Even if logout fails, clear token and redirect
      localStorage.removeItem('access_token')
      navigate('/login')
    }
  }
  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      <aside className="flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50">
        <div className="mb-6 text-lg font-semibold">SmartFAQ Admin</div>
        <nav className="flex flex-1 flex-col gap-2">
          {navItems.map(item => (
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
        <button
          onClick={handleLogout}
          className="mt-auto rounded-lg bg-transparent px-3.5 py-2 text-sm text-red-400 transition-colors duration-200 hover:bg-red-600/20 hover:text-red-300"
        >
          Logout
        </button>
      </aside>
      <main className="flex flex-1 flex-col gap-8 p-8">
        <header className="flex items-baseline justify-between gap-4">
          <h1 className="text-3xl font-bold">Greenwich SmartFAQ</h1>
          <span className="text-xs tracking-wider text-slate-500 uppercase">Version {__APP_VERSION__}</span>
        </header>
        <div className="flex flex-col gap-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default ShellLayout
