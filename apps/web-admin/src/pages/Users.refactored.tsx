import { useState, useEffect } from 'react'
import type { User } from '../types/users'
import { Button, Card, CardContent, Input, Select } from '@/components/ui'
import { CreateUserDialog } from '../components/users/CreateUserDialog'
import { EditUserDialog } from '../components/users/EditUserDialog'
import UserTableRow from '../components/users/UserTableRow'
import Pagination from '../components/users/Pagination'
import { useUsers } from '../hooks/useUsers'
import { useUserFilters } from '../hooks/useUserFilters'
import { usePagination } from '../hooks/usePagination'
import { UserPlus, Search, Filter as FilterIcon } from 'lucide-react'

export default function UsersPage() {
  const { users, loading, error, actionLoading, loadUsers, handleLockUser, handleUnlockUser, handleResetPassword } =
    useUsers()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true)
  useEffect(() => {
    if (window.innerWidth < 640) setShowFilters(false)
  }, [])

  const filteredUsers = useUserFilters({ users, searchQuery, statusFilter })

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedUsers,
    setCurrentPage,
    setItemsPerPage
  } = usePagination({ items: filteredUsers, initialItemsPerPage: 10 })

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }
  const handleSuccess = () => loadUsers()

  if (loading && users.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    )
  }
  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md text-center">
          <p className="mb-4 text-lg font-medium text-red-600">Failed to load users</p>
          <p className="mb-4 text-slate-600">{error}</p>
          <Button onClick={loadUsers}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 pt-4 pb-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">User Management</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">Manage user accounts and permissions</p>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setCreateDialogOpen(true)} className="w-full sm:w-auto">
            <UserPlus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <FilterIcon className="h-5 w-5" />
              Filters
            </h3>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              {showFilters ? 'Hide' : 'Show'}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="relative">
                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by username or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
              </Select>
            </div>
          )}

          <div className="mt-4 flex flex-col gap-4 border-t border-slate-200 pt-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span className="order-2 text-slate-600 sm:order-1">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
              {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
            </span>
            <Select
              value={itemsPerPage.toString()}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="order-1 w-full sm:order-2 sm:w-auto"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Responsive user list: table for desktop, cards for mobile */}
      <Card>
        <CardContent className="p-0">
          {/* Table for screens >= md */}
          <div
            className="scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent hidden overflow-x-auto md:block"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    ID
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    Username
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    Email
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    Phone
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    Status
                  </th>
                  <th className="px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs">
                    Actions
                  </th>
                  <th className="hidden px-3 py-3 text-left text-[11px] font-semibold tracking-wide text-slate-600 uppercase sm:px-6 sm:text-xs xl:table-cell">
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <p className="text-lg text-slate-500">No users found</p>
                      <p className="mt-1 text-sm text-slate-400">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map(user => (
                    <UserTableRow
                      key={user.id}
                      user={user}
                      actionLoading={actionLoading}
                      onEdit={handleEditUser}
                      onLock={handleLockUser}
                      onUnlock={handleUnlockUser}
                      onResetPassword={handleResetPassword}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Card list for screens < md */}
          <div className="space-y-4 px-2 py-2 md:hidden">
            {paginatedUsers.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-lg text-slate-500">No users found</p>
                <p className="mt-1 text-sm text-slate-400">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedUsers.map(user => (
                <div key={user.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-bold text-blue-700">#{user.id}</div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${user.status === 'Locked' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="mb-1 text-base font-semibold text-slate-900">{user.username}</div>
                  <div className="mb-1 text-sm text-slate-600">Email: {user.email}</div>
                  <div className="mb-1 text-sm text-slate-600">Phone: {user.phoneNumber || 'N/A'}</div>
                  <div className="mb-1 text-sm text-slate-600">Role: {user.role}</div>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} title="Edit user">
                      Sửa
                    </Button>
                    {user.status !== 'Locked' ? (
                      <Button size="sm" variant="outline" onClick={() => handleLockUser(user.id)} title="Lock user">
                        Khoá
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleUnlockUser(user.id)} title="Unlock user">
                        Mở khoá
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetPassword(user.id)}
                      title="Reset password"
                    >
                      Đặt lại mật khẩu
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex flex-wrap justify-center gap-4 border-t border-slate-200 px-4 py-4 sm:px-6">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <CreateUserDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleSuccess} />
      <EditUserDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
