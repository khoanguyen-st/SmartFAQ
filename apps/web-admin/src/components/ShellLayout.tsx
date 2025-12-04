import { useEffect, useState, useCallback, useMemo } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api'
import educationUrl from '@/assets/icons/education.svg'
import userUrl from '@/assets/icons/user.svg'
import chevronDownUrl from '@/assets/icons/chevron-down.svg'
import { Menu, X } from 'lucide-react'
import { getCurrentUserInfo, type CurrentUserInfo } from '@/services/auth.services'

type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>
const EducationIcon: React.FC<ImgCompProps> = props => <img src={educationUrl} alt="edu" {...props} />
const UserIcon: React.FC<ImgCompProps> = props => <img src={userUrl} alt="upload" {...props} />

// Định nghĩa tất cả các item có thể có
const ALL_NAV_ITEMS = [
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'users', label: 'Users' },
  { path: 'departments', label: 'Departments' },
  { path: 'logs', label: 'Logs' },
  { path: 'settings', label: 'Settings' },
  { path: 'view-chat', label: 'View Chat' }
]

const ShellLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<CurrentUserInfo | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  // Fetch user info and departments
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('access_token')
        if (!token) return

        // Fetch current user info from API
        const data = await getCurrentUserInfo()
        setUserInfo(data)

        // Set default department from localStorage or first department
        const savedDeptId = localStorage.getItem('selected_department_id')
        if (savedDeptId) {
          setSelectedDepartment(parseInt(savedDeptId))
        } else if (data.departments.length > 0) {
          setSelectedDepartment(data.departments[0].id)
          localStorage.setItem('selected_department_id', data.departments[0].id.toString())
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    }

    fetchUserInfo()
  }, [])

  // Logic phân quyền hiển thị Menu
  const navItems = useMemo(() => {
    if (!userInfo) return []

    // ADMIN: dashboard, user, department, system log, system settings
    // (Lưu ý: Theo yêu cầu của bạn admin không có 'view-chat')
    if (userInfo.role === 'admin') {
      return ALL_NAV_ITEMS.filter(item => ['dashboard', 'users', 'departments', 'logs', 'settings'].includes(item.path))
    }

    // USER (STAFF): dashboard, system log, system setting, view chat
    // (Lưu ý: Ẩn users và departments)
    if (userInfo.role === 'staff' || userInfo.role === 'user') {
      return ALL_NAV_ITEMS.filter(item => ['dashboard', 'logs', 'settings', 'view-chat'].includes(item.path))
    }

    // Default fallback (nếu role lạ)
    return []
  }, [userInfo])

  const handleDepartmentChange = useCallback((departmentId: number) => {
    setSelectedDepartment(departmentId)
    localStorage.setItem('selected_department_id', departmentId.toString())
    setIsUserMenuOpen(false)
  }, [])

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
    [isSidebarOpen, toggleSidebar, handleNavigation, handleLogout, navItems] // Thêm navItems vào dependency
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

            {/* User Menu Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
              >
                <UserIcon />
                <span className="text-sm font-medium">{userInfo?.username || 'BO User'}</span>
                <img
                  src={chevronDownUrl}
                  alt="menu"
                  className={cn('h-4 w-4 transition-transform duration-200', isUserMenuOpen && 'rotate-180')}
                />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  <div className="py-2">
                    {/* Profile Link */}
                    <button
                      onClick={() => {
                        navigate('/profile')
                        setIsUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <UserIcon className="h-5 w-5" />
                      <span>Profile</span>
                    </button>

                    {/* Department Selector */}
                    {userInfo && userInfo.departments.length > 1 && (
                      <>
                        <div className="my-2 border-t border-gray-200" />
                        <div className="px-4 py-2">
                          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase">Select Department</p>
                          {userInfo.departments.map(dept => (
                            <button
                              key={dept.id}
                              onClick={() => handleDepartmentChange(dept.id)}
                              className={cn(
                                'mb-1 flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors',
                                selectedDepartment === dept.id
                                  ? 'bg-[#003087] text-white'
                                  : 'text-gray-700 hover:bg-gray-100'
                              )}
                            >
                              <span>{dept.name}</span>
                              {selectedDepartment === dept.id && (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Logout */}
                    <div className="mt-2 border-t border-gray-200" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
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
