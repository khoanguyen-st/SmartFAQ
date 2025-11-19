import { useState, useEffect, useRef } from 'react'
import { Button, Card, CardContent } from '../components/ui'
import UserDialog from '../components/users/UserDialog'
import type { User, CreateUserRequest, UpdateUserRequest } from '../types/user'

// Mock data - dữ liệu giả lập
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'nguyennt123',
    email: 'nguyennt123@example.com',
    phone_number: '0224570881',
    role: 'Super Admin',
    status: 'active'
  },
  {
    id: 2,
    username: 'nguyennt123',
    email: 'nguyennt123@example.com',
    phone_number: '0224570881',
    role: 'Admin',
    status: 'locked'
  },
  {
    id: 3,
    username: 'nguyennt123',
    email: 'nguyennt123@example.com',
    phone_number: '0224570881',
    role: 'Admin',
    status: 'active'
  },
  {
    id: 4,
    username: 'nguyennt123',
    email: 'nguyennt123@example.com',
    phone_number: '0224570881',
    role: 'Admin',
    status: 'active'
  }
]

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  const [searchQuery, setSearchQuery] = useState('')

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'update'>('create')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  // Filter dropdown state
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const filterRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }

    if (filterOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [filterOpen])

  const handleCreateUser = async (data: CreateUserRequest | UpdateUserRequest) => {
    const createData = data as CreateUserRequest
    const newUser: User = {
      id: Math.max(...users.map(u => u.id), 0) + 1,
      username: createData.username,
      email: createData.email,
      phone_number: '',
      role: createData.role || 'Staff',
      status: 'active',
      campus: createData.campus,
      department: createData.department
    }
    setUsers([...users, newUser])
  }

  const handleUpdateUser = async (data: CreateUserRequest | UpdateUserRequest) => {
    if (selectedUser) {
      const updateData = data as UpdateUserRequest
      setUsers(
        users.map(user =>
          user.id === selectedUser.id
            ? {
                ...user,
                username: updateData.username || user.username,
                email: updateData.email || user.email,
                role: updateData.role || user.role
              }
            : user
        )
      )
    }
  }

  const handleToggleLock = (userId: number) => {
    setUsers(
      users.map(user =>
        user.id === userId ? { ...user, status: user.status === 'active' ? 'locked' : 'active' } : user
      )
    )
  }

  const openCreateDialog = () => {
    setDialogMode('create')
    setSelectedUser(null)
    setDialogOpen(true)
  }

  const openUpdateDialog = (user: User) => {
    setDialogMode('update')
    setSelectedUser(user)
    setDialogOpen(true)
  }

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => (prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]))
  }

  const handleStatusToggle = (status: string) => {
    setSelectedStatuses(prev => (prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]))
  }

  const filteredUsers = users.filter(user => {
    // Search filter
    const matchesSearch =
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())

    // Role filter
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role)

    // Status filter
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(user.status)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700'
      case 'locked':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 md:gap-6 md:px-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl">List of User Accounts</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your user accounts</p>
        </div>
        <Button onClick={openCreateDialog} className="w-full sm:w-auto">
          <span className="mr-2 text-xl font-bold">+</span>
          <span className="hidden sm:inline">Create New Account</span>
          <span className="sm:hidden">New Account</span>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6">
          {/* Search and Filter */}
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-0">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter to Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-2 pr-10 focus:border-slate-300 focus:ring-0 focus:outline-none sm:rounded-l-lg sm:border-r-0"
              />
              <svg
                className="absolute top-1/2 right-3 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Filter Button */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setFilterOpen(!filterOpen)}
                className="flex h-[42px] w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50 sm:w-auto sm:rounded-r-lg"
              >
                <svg className="h-5 w-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span className="text-sm sm:hidden">Filter</span>
              </button>

              {/* Filter Dropdown */}
              {filterOpen && (
                <div className="ring-opacity-5 absolute left-0 z-20 mt-2 w-56 rounded-lg bg-white shadow-lg ring-1 ring-black sm:right-0 sm:left-auto">
                  <div className="p-4">
                    {/* Role Filter */}
                    <div className="mb-4">
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">Role</h3>
                      <div className="space-y-2">
                        {['Super Admin', 'Admin'].map(role => (
                          <label key={role} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedRoles.includes(role)}
                              onChange={() => handleRoleToggle(role)}
                              className="text-primary-600 focus:ring-primary-600 mr-2 h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">{role}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-900">Status</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'active', label: 'Active' },
                          { value: 'locked', label: 'Locked' }
                        ].map(status => (
                          <label key={status.value} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(status.value)}
                              onChange={() => handleStatusToggle(status.value)}
                              className="text-primary-600 focus:ring-primary-600 mr-2 h-4 w-4 rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Users Table */}
          <div className="-mx-4 mt-6 overflow-x-auto md:mx-0">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm">ID</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm">
                    Username
                  </th>
                  <th className="hidden px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm lg:table-cell">
                    Email
                  </th>
                  <th className="hidden px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm xl:table-cell">
                    Phone Number
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-900 md:px-4 md:text-sm">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-3 text-xs text-slate-900 md:px-4 md:py-4 md:text-sm">{user.id}</td>
                    <td className="px-3 py-3 text-xs text-slate-900 md:px-4 md:py-4 md:text-sm">
                      <div className="max-w-[120px] truncate md:max-w-none">{user.username}</div>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-slate-600 md:px-4 md:py-4 md:text-sm lg:table-cell">
                      <div className="max-w-[200px] truncate">{user.email}</div>
                    </td>
                    <td className="hidden px-3 py-3 text-xs text-slate-600 md:px-4 md:py-4 md:text-sm xl:table-cell">
                      {user.phone_number || '-'}
                    </td>
                    <td className="px-3 py-3 text-xs text-slate-900 md:px-4 md:py-4 md:text-sm">
                      <div className="max-w-[100px] truncate">{user.role}</div>
                    </td>
                    <td className="px-3 py-3 md:px-4 md:py-4">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium md:px-2.5 md:py-1 md:text-xs ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 md:px-4 md:py-4">
                      <div className="flex items-center gap-2 md:gap-3">
                        {/* Edit Button */}
                        <button
                          onClick={() => openUpdateDialog(user)}
                          className="inline-flex items-center justify-center text-green-600 hover:text-green-700"
                          title="Edit"
                        >
                          <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        {/* Lock/Unlock Button */}
                        <button
                          onClick={() => handleToggleLock(user.id)}
                          className="inline-flex items-center justify-center text-red-600 hover:text-red-700"
                          title={user.status === 'active' ? 'Lock' : 'Unlock'}
                        >
                          <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </button>

                        {/* Key Icon - Display Only */}
                        <button
                          className="inline-flex cursor-default items-center justify-center text-orange-600 hover:text-orange-700"
                          title="Key"
                        >
                          <svg className="h-4 w-4 md:h-5 md:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
        </CardContent>
      </Card>
      <div className="mt-4 flex flex-col items-center justify-end gap-4 px-4 sm:flex-row md:px-0">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <div className="mr-4 text-xs text-slate-600 md:text-sm">
            Showing 1-{filteredUsers.length} of {filteredUsers.length}
          </div>

          {/* Previous Button */}
          <button className="rounded p-2 hover:bg-slate-100" disabled>
            <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <button className="h-8 min-w-[32px] rounded border border-blue-500 bg-blue-500 text-sm font-medium text-white hover:bg-blue-600">
            1
          </button>
          <button className="h-8 min-w-[32px] rounded border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50">
            2
          </button>
          <button className="h-8 min-w-[32px] rounded border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50">
            3
          </button>
          <button className="h-8 min-w-[32px] rounded border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50">
            4
          </button>
          <button className="h-8 min-w-[32px] rounded border border-slate-300 bg-white text-sm text-slate-700 hover:bg-slate-50">
            5
          </button>

          {/* Next Button */}
          <button className="rounded p-2 hover:bg-slate-100">
            <svg className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Items per page */}
          <select className="ml-2 rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none">
            <option>10 / pages</option>
            <option>25 / pages</option>
            <option>50 / pages</option>
          </select>
        </div>
      </div>

      <UserDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={dialogMode === 'create' ? handleCreateUser : handleUpdateUser}
        user={selectedUser}
        mode={dialogMode}
      />
    </div>
  )
}

export default UsersPage
