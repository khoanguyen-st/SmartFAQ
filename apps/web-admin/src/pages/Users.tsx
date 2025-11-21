import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Filter, Key, Lock, Search, Unlock, UserPlus, Pencil } from 'lucide-react'
import { apiClient } from '../lib/api.client'
import type { User, CreateUserRequest } from '../types/users'
import Pagination from '../components/users/Pagination'
import CreateUserDialog from '../components/users/CreateUserDialog'
import EditUserDialog from '../components/users/EditUserDialog'

const DepartmentOptions = ['Academic Affairs', 'Student Affairs', 'Information Technology']
const StatusOptions: Array<User['status']> = ['Active', 'Locked']

const normalizeUser = (user: User): User => {
  const normalizedStatus = String(user.status).toLowerCase() === 'locked' ? 'Locked' : 'Active'
  return { ...user, status: normalizedStatus as User['status'] }
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalRecords, setTotalRecords] = useState(50)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<User['status'][]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.listUsers({ page, pageSize })
      const normalized = res.data.map(normalizeUser)
      setUsers(normalized)
      setTotalRecords(res.metadata?.total ?? res.data.length)
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load users'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [filterOpen])

  const handleCreate = async (payload: CreateUserRequest) => {
    await apiClient.createUser(payload)
    await loadUsers()
  }

  const handleEditSubmit = async (userId: number, payload: Partial<User>) => {
    await apiClient.updateUser(userId, payload)
    await loadUsers()
  }

  const handleLock = async (userId: number) => {
    await apiClient.lockUser(userId)
    await loadUsers()
  }

  const handleUnlock = async (userId: number) => {
    await apiClient.unlockUser(userId)
    await loadUsers()
  }

  const handleResetPassword = async (userId: number) => {
    await apiClient.resetUserPassword(userId)
    alert('Password reset email sent successfully')
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = searchQuery
        ? user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
        : true

      const department = user.department ?? ''
      const matchesDepartment = selectedDepartments.length
        ? department !== '' && selectedDepartments.includes(department)
        : true

      const matchesStatus = selectedStatuses.length ? selectedStatuses.includes(user.status) : true

      return matchesSearch && matchesDepartment && matchesStatus
    })
  }, [users, searchQuery, selectedDepartments, selectedStatuses])
  const paginatedUsers = useMemo(() => {
    const startIndex = (page - 1) * pageSize
    return filteredUsers.slice(startIndex, startIndex + pageSize)
  }, [filteredUsers, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedDepartments, selectedStatuses, pageSize])

  const filtersApplied = Boolean(searchQuery || selectedDepartments.length || selectedStatuses.length)
  const effectiveTotal = filtersApplied ? filteredUsers.length : totalRecords || users.length || 0
  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const toggleValue = <T extends string>(value: T, list: T[], setter: (next: T[]) => void) => {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value])
  }

  const renderStatusBadge = (status: User['status']) => {
    const base = 'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold'
    if (status === 'Locked') return `${base} bg-red-50 text-red-600`
    return `${base} bg-emerald-50 text-emerald-600`
  }

  const getStatusText = (status: User['status']) => {
    return status === 'Locked' ? 'Inactive' : 'Active'
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl lg:text-3xl">List of User Accounts</h1>
          <p className="text-xs text-slate-500 md:text-sm">Manage your user accounts</p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 md:w-auto"
        >
          <UserPlus className="h-4 w-4" />
          Create New Account
        </button>
      </header>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm md:px-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <input
            type="text"
            placeholder="Enter to Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm text-slate-600 outline-none placeholder:text-slate-400"
          />
          <div className="flex items-center gap-4">
            <button type="button" aria-label="Search" className="text-slate-400 hover:text-slate-600">
              <Search className="h-4 w-4" />
            </button>
            <span className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setFilterOpen(prev => !prev)}
                className={`text-slate-400 transition hover:text-slate-600 ${filterOpen ? 'text-blue-600' : ''}`}
                aria-haspopup="true"
                aria-expanded={filterOpen}
              >
                <Filter className="h-4 w-4" />
              </button>
              {filterOpen && (
                <div className="absolute top-full right-0 z-20 mt-3 w-64 rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-2xl">
                  <p className="mb-2 text-xs font-semibold text-slate-500 uppercase">Department</p>
                  <div className="space-y-2">
                    {DepartmentOptions.map(option => (
                      <label key={option} className="flex items-center gap-2 text-slate-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedDepartments.includes(option)}
                          onChange={() => toggleValue(option, selectedDepartments, setSelectedDepartments)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <p className="mt-4 mb-2 text-xs font-semibold text-slate-500 uppercase">Status</p>
                  <div className="space-y-2">
                    {StatusOptions.map(option => (
                      <label key={option} className="flex items-center gap-2 text-slate-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={selectedStatuses.includes(option)}
                          onChange={() => toggleValue(option, selectedStatuses, setSelectedStatuses)}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDepartments([])
                      setSelectedStatuses([])
                    }}
                    className="mt-4 text-sm font-semibold text-blue-600"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table view for desktop (>= 768px) */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-3 text-left whitespace-nowrap">ID</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Username</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Email</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Phone Number</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Role</th>
                <th className="px-6 py-3 text-left whitespace-nowrap">Department</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && paginatedUsers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-slate-500">
                    No users found
                  </td>
                </tr>
              )}
              {!loading &&
                paginatedUsers.map((user, index) => (
                  <tr key={user.id} className="border-b border-slate-100 text-sm text-slate-700 last:border-b-0">
                    <td className="px-6 py-4 whitespace-nowrap">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900">{user.username}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">{user.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{user.department ?? '—'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <span className={renderStatusBadge(user.status)}>{getStatusText(user.status)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setEditDialogOpen(true)
                          }}
                          className="rounded-full border border-transparent p-2 text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50"
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => handleLock(user.id)}
                            className="rounded-full border border-transparent p-2 text-red-500 hover:border-red-100 hover:bg-red-50"
                            aria-label="Lock user"
                          >
                            <Lock className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            className="rounded-full border border-transparent p-2 text-orange-500 hover:border-orange-100 hover:bg-orange-50"
                            aria-label="Unlock user"
                          >
                            <Unlock className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleResetPassword(user.id)}
                          className="rounded-full border border-transparent p-2 text-amber-500 hover:border-amber-100 hover:bg-amber-50"
                          aria-label="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Card view for mobile (< 768px) */}
        <div className="space-y-4 p-4 md:hidden">
          {loading && <div className="py-12 text-center text-sm text-slate-500">Loading...</div>}
          {!loading && paginatedUsers.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">No users found</div>
          )}
          {!loading &&
            paginatedUsers.map((user, index) => (
              <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-bold text-blue-700">#{(page - 1) * pageSize + index + 1}</div>
                  <span className={renderStatusBadge(user.status)}>{getStatusText(user.status)}</span>
                </div>
                <div className="mb-3 space-y-2">
                  <div className="text-base font-semibold text-slate-900">{user.username}</div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Email:</span> {user.email}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Phone:</span> {user.phoneNumber}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Role:</span> {user.role}
                  </div>
                  <div className="text-sm text-slate-600">
                    <span className="font-medium">Department:</span> {user.department ?? '—'}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setSelectedUser(user)
                      setEditDialogOpen(true)
                    }}
                    className="min-w-[80px] flex-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    <Pencil className="mr-1 inline h-4 w-4" />
                    Edit
                  </button>
                  {user.status === 'Active' ? (
                    <button
                      onClick={() => handleLock(user.id)}
                      className="min-w-[80px] flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                    >
                      <Lock className="mr-1 inline h-4 w-4" />
                      Lock
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnlock(user.id)}
                      className="min-w-[80px] flex-1 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100"
                    >
                      <Unlock className="mr-1 inline h-4 w-4" />
                      Unlock
                    </button>
                  )}
                  <button
                    onClick={() => handleResetPassword(user.id)}
                    className="min-w-[120px] flex-1 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
                  >
                    <Key className="mr-1 inline h-4 w-4" />
                    Reset Password
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="w-full">
        <Pagination
          currentPage={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={effectiveTotal}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreate}
        onSuccess={loadUsers}
      />

      <EditUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={handleEditSubmit}
        onSuccess={loadUsers}
      />

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    </div>
  )
}

export default Users
