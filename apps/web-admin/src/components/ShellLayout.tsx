import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { logout } from '@/lib/api'
import { getCurrentUserInfo, type CurrentUserInfo } from '@/services/auth.services'
import LogoutIcon from '@/assets/icons/logout.svg?react'
import SettingIcon from '@/assets/icons/setting.svg?react'
import avatarDefaultUrl from '@/assets/icons/user-avatar.svg'
import educationUrl from '@/assets/icons/education.svg'
import chevronDownUrl from '@/assets/icons/chevron-down.svg'

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff'
}

const NAV_CONFIG = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    allowedRoles: [ROLES.ADMIN, ROLES.STAFF]
  },
  {
    path: 'departments',
    label: 'Departments',
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: 'users',
    label: 'Users',
    allowedRoles: [ROLES.ADMIN]
  },
  {
    path: 'logs',
    label: 'System Logs',
    allowedRoles: [ROLES.ADMIN, ROLES.STAFF]
  },
  {
    path: 'settings',
    label: 'System Settings',
    allowedRoles: [ROLES.ADMIN, ROLES.STAFF]
  },
  {
    path: 'view-chat',
    label: 'View Chat',
    allowedRoles: [ROLES.ADMIN, ROLES.STAFF]
  }
]

// --- 2. COMPONENTS CON ---

type ImgCompProps = React.ImgHTMLAttributes<HTMLImageElement>
const EducationIcon: React.FC<ImgCompProps> = props => <img src={educationUrl} alt="edu" {...props} />

// --- 3. HELPER FUNCTIONS ---

const checkPermission = (userRole: string | undefined, allowedRoles: string[]) => {
  if (!userRole) return false
  const normalizedUserRole = userRole.trim().toLowerCase()
  return allowedRoles.some(r => r.toLowerCase() === normalizedUserRole)
}

// --- 4. MAIN COMPONENT ---

const ShellLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [userInfo, setUserInfo] = useState<CurrentUserInfo | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState<number | null>(null)
  const [seletectedNavItem, setSelectedNavItem] = useState<number>(0)

  const navigate = useNavigate()

  // Kiểm tra token khi mount
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      navigate('/login')
    }
  }, [navigate])

  // Fetch user info and departments
  const fetchUserInfo = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchUserInfo()
  }, [fetchUserInfo])

  // Listen for avatar update events from Profile page
  useEffect(() => {
    const handleRefreshUser = () => {
      fetchUserInfo()
    }

    // Lắng nghe cả 2 sự kiện: Avatar thay đổi & Info (username) thay đổi
    window.addEventListener('userAvatarUpdated', handleRefreshUser)
    window.addEventListener('userInfoUpdated', handleRefreshUser)

    return () => {
      window.removeEventListener('userAvatarUpdated', handleRefreshUser)
      window.removeEventListener('userInfoUpdated', handleRefreshUser)
    }
  }, [fetchUserInfo])

  const handleDepartmentChange = useCallback((departmentId: number) => {
    setSelectedDepartment(departmentId)
    localStorage.setItem('selected_department_id', departmentId.toString())
    setIsUserMenuOpen(false)
  }, [])

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), [])

  const handleNavigation = useCallback(
    (index: number) => {
      setSelectedNavItem(index)
      if (isSidebarOpen) {
        setIsSidebarOpen(false)
      }
    },
    [isSidebarOpen]
  )

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      navigate('/login')
    } catch {
      localStorage.removeItem('access_token')
      navigate('/login')
    }
  }, [navigate])

  // Lọc menu dựa trên Role
  const filteredNavItems = useMemo(() => {
    if (!userInfo?.role) return []

    return NAV_CONFIG.filter(item => checkPermission(userInfo.role, item.allowedRoles))
  }, [userInfo])

  const Sidebar = useMemo(
    () => (
      <aside
        className={cn(
          'z-50 flex w-60 flex-col bg-slate-900 px-4 py-6 text-slate-50 transition-transform duration-300',
          'lg:fixed lg:inset-y-0 lg:left-0 lg:translate-x-0',
          'fixed inset-y-0 left-0 shadow-2xl lg:shadow-none',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="ml-4 text-lg font-semibold">SmartFAQ Admin</div>
          <button
            onClick={toggleSidebar}
            className="rounded-full p-1 text-slate-300 transition-colors hover:bg-slate-700 hover:text-white lg:hidden"
            aria-label="Close Sidebar"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex flex-col gap-2">
          {filteredNavItems.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => handleNavigation(index)}
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

        <div className="mt-auto flex items-center justify-center rounded-lg bg-red-600 hover:bg-red-700">
          <LogoutIcon className="h-5 w-5 text-white" />
          <button onClick={handleLogout} className="flex p-2.5 text-sm">
            Logout
          </button>
        </div>
      </aside>
    ),
    [isSidebarOpen, toggleSidebar, handleNavigation, handleLogout, filteredNavItems]
  )

  return (
    <div className="flex min-h-screen bg-[#eff3fb] text-slate-900">
      {isSidebarOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={toggleSidebar} />}
      {Sidebar}

      <main className="w-full flex-1 overflow-y-auto lg:ml-60">
        <header className="sticky top-0 z-20 border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Header Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSidebar}
                className="p-1 text-gray-600 transition-colors hover:text-gray-800 lg:hidden"
                aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#003087]">
                <EducationIcon />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-semibold text-gray-900">Greenwich SmartFAQ</h1>
                <p className="text-sm text-gray-500">Document-based chatbot training system</p>
              </div>
            </div>

            {/* Right Header Section (User Menu) */}
            <div className="relative">
              <button
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
              >
                <img src={userInfo?.image || avatarDefaultUrl} alt="user" className="h-8 w-8 rounded-full bg-center" />
                <span className="text-sm font-medium">{userInfo?.username || 'BO User'}</span>
                <img
                  src={chevronDownUrl}
                  alt="menu"
                  className={cn('ml-1 h-4 w-4 transition-transform duration-200', isUserMenuOpen && 'rotate-180')}
                />
              </button>

              {/* Dropdown Content */}
              {isUserMenuOpen && (
                <div
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                  className="absolute top-full right-0 mt-2 w-64 rounded-lg border border-gray-200 bg-white shadow-lg"
                >
                  <div className="p-2">
                    {/* Profile Link */}
                    <button
                      onClick={() => {
                        navigate('/profile')
                        setIsUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <SettingIcon className="h-5 w-5" />
                      <span className="text-base font-semibold">Profile</span>
                    </button>

                    {/* Department Selector */}
                    {userInfo && userInfo.departments && userInfo.departments.length > 1 && (
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
                    <div className="border-t border-gray-200" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsUserMenuOpen(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogoutIcon className="h-5 w-5" />
                      <span className="text-base font-semibold">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={cn('flex flex-col gap-6', filteredNavItems[seletectedNavItem])}>
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default ShellLayout
