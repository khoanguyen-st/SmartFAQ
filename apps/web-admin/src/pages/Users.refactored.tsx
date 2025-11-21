import { useState } from 'react'
import { User } from '@/lib/api'
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
  // Data & actions
  const { users, loading, error, actionLoading, loadUsers, handleLockUser, handleUnlockUser, handleResetPassword } =
    useUsers()

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true)

  // Filtered users
  const filteredUsers = useUserFilters({ users, searchQuery, statusFilter })

  // Pagination
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedItems: paginatedUsers,
    setCurrentPage,
    setItemsPerPage
  } = usePagination({ items: filteredUsers, initialItemsPerPage: 10 })

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleSuccess = () => {
    loadUsers()
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="mt-1 text-slate-600">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
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
              {/* Search */}
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

              {/* Status filter */}
              <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Locked">Locked</option>
              </Select>
            </div>
          )}

          {/* Results summary */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 text-sm">
            <span className="text-slate-600">
              Showing {paginatedUsers.length} of {filteredUsers.length} users
              {filteredUsers.length !== users.length && ` (filtered from ${users.length} total)`}
            </span>
            <Select
              value={itemsPerPage.toString()}
              onChange={e => setItemsPerPage(Number(e.target.value))}
              className="w-auto"
            >
              <option value="10">10 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-slate-700 uppercase">
                    Actions
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center border-t border-slate-200 px-6 py-4">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
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
