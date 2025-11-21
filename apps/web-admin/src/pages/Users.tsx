import { useState, useEffect, useMemo } from 'react'
import { api, User } from '@/lib/api.client'
import { Button, Card, CardContent, Input, Select } from '@/components/ui'
import { CreateUserDialog } from '../components/users/CreateUserDialog'
import { EditUserDialog } from '../components/users/EditUserDialog'
import { Lock, Unlock, Key, Pencil, UserPlus, Search, Filter as FilterIcon } from 'lucide-react'

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(true) // Always show filters

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.fetchUsers()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // Filter and search logic
  const filteredUsers = useMemo(() => {
    let result = [...users]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        user => user.username.toLowerCase().includes(query) || user.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(user => user.status === statusFilter)
    }

    return result
  }, [users, searchQuery, statusFilter])

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredUsers.slice(startIndex, endIndex)
  }, [filteredUsers, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, itemsPerPage])

  const handleLockUser = async (userId: number) => {
    if (!confirm('Are you sure you want to lock this user account?')) return

    setActionLoading(userId)
    try {
      await api.lockUser(userId)
      await loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to lock user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlockUser = async (userId: number) => {
    if (!confirm('Are you sure you want to unlock this user account?')) return

    setActionLoading(userId)
    try {
      await api.unlockUser(userId)
      await loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unlock user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (userId: number) => {
    if (!confirm("Are you sure you want to reset this user's password? An email will be sent to the user.")) return

    setActionLoading(userId)
    try {
      const result = await api.resetUserPassword(userId)
      alert(result.message || 'Password reset email sent successfully')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleSuccess = () => {
    loadUsers()
  }

  const renderPagination = () => {
    const pages = []
    const maxPagesToShow = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1)

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`h-8 min-w-[32px] rounded px-3 text-sm font-medium transition-colors ${
            currentPage === i
              ? 'border border-blue-600 bg-blue-600 text-white'
              : 'border border-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          {i}
        </button>
      )
    }

    return pages
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-600">Loading users...</div>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mb-4 text-red-600">{error}</div>
          <Button onClick={loadUsers}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">List of User Accounts</h1>
          <p className="mt-1 text-sm text-slate-600">Manage your user accounts</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Create New Account
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Enter to Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-white pl-10"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="px-4">
          <FilterIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-6 flex gap-3">
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-64 bg-white">
            <option value="all">Status</option>
            <option value="Active">Active</option>
            <option value="Locked">Locked</option>
          </Select>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="py-12 text-center text-slate-600">
              {users.length === 0
                ? 'No users found. Create a new user to get started.'
                : 'No users match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Username</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Phone Number</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Department</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-slate-900">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-slate-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user, index) => (
                    <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {(currentPage - 1) * itemsPerPage + index + 1}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{user.username}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.phoneNumber || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">Staff</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user.address || '-'}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Button */}
                          <button
                            onClick={() => handleEditUser(user)}
                            disabled={actionLoading === user.id}
                            className="rounded p-2 text-green-600 transition-colors hover:bg-green-50 disabled:opacity-50"
                            title="Edit User"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Reset Password Button */}
                          {user.role !== 'SuperAdmin' && (
                            <button
                              onClick={() => handleResetPassword(user.id)}
                              disabled={actionLoading === user.id}
                              className="rounded p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                              title="Reset Password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                          )}

                          {/* Lock/Unlock Button */}
                          {user.role !== 'SuperAdmin' && (
                            <>
                              {user.status === 'Active' ? (
                                <button
                                  onClick={() => handleLockUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="rounded p-2 text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50"
                                  title="Lock User"
                                >
                                  <Lock className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUnlockUser(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="rounded p-2 text-orange-600 transition-colors hover:bg-orange-50 disabled:opacity-50"
                                  title="Unlock User"
                                >
                                  <Unlock className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination - Outside the card */}
      {filteredUsers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)}{' '}
            of {filteredUsers.length}
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 min-w-[32px] rounded px-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              &lt;
            </button>

            {/* Page Numbers */}
            {renderPagination()}

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 min-w-[32px] rounded px-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              &gt;
            </button>

            {/* Items per page dropdown */}
            <div className="ml-4 flex items-center gap-2">
              <Select
                value={itemsPerPage.toString()}
                onChange={e => setItemsPerPage(Number(e.target.value))}
                className="h-8 border-slate-300 px-2 text-sm"
              >
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </Select>
              <span className="text-sm text-slate-600">/ pages</span>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <CreateUserDialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} onSuccess={handleSuccess} />

      <EditUserDialog
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedUser(null)
        }}
        onSuccess={handleSuccess}
        user={selectedUser}
      />
    </div>
  )
}

export default UsersPage
