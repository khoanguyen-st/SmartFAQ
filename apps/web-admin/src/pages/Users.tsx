import { useState, useEffect, useMemo } from 'react'
import { User, fetchUsers, lockUser, unlockUser, resetUserPassword } from '@/lib/api'
import { Button, Card, CardContent, Input, Select } from '@/components/ui'
import { CreateUserDialog } from '../components/users/CreateUserDialog'
import { EditUserDialog } from '../components/users/EditUserDialog'
import { Lock, Unlock, Key, Pencil, UserPlus, Search, Filter as FilterIcon } from 'lucide-react'
import { DEPARTMENT_OPTIONS } from '@/lib/validation'

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
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
      const data = await fetchUsers()
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
        (user) =>
          user.username.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.phoneNumber?.toLowerCase().includes(query)
      )
    }

    // Department filter
    if (departmentFilter !== 'all') {
      result = result.filter((user) => user.departments.includes(departmentFilter))
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter((user) => user.status === statusFilter)
    }

    return result
  }, [users, searchQuery, departmentFilter, statusFilter])

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
  }, [searchQuery, departmentFilter, statusFilter, itemsPerPage])

  const handleLockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to lock this user account?')) return

    setActionLoading(userId)
    try {
      await lockUser(userId)
      await loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to lock user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleUnlockUser = async (userId: string) => {
    if (!confirm('Are you sure you want to unlock this user account?')) return

    setActionLoading(userId)
    try {
      await unlockUser(userId)
      await loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to unlock user')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetPassword = async (userId: string) => {
    if (!confirm("Are you sure you want to reset this user's password? An email will be sent to the user.")) return

    setActionLoading(userId)
    try {
      const result = await resetUserPassword(userId)
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
          className={`min-w-[32px] h-8 px-3 rounded text-sm font-medium transition-colors ${
            currentPage === i 
              ? 'bg-blue-600 text-white border border-blue-600' 
              : 'text-slate-600 hover:bg-slate-100 border border-transparent'
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
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={loadUsers}>Retry</Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">List of User Accounts</h1>
          <p className="text-sm text-slate-600 mt-1">Manage your user accounts</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Create New Account
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Enter to Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white"
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)} 
          className="px-4"
        >
          <FilterIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Filter Dropdowns */}
      {showFilters && (
        <div className="mb-6 flex gap-3">
          <Select 
            value={departmentFilter} 
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="bg-white w-64"
          >
            <option value="all">Department</option>
            {DEPARTMENT_OPTIONS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </Select>
          <Select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white w-64"
          >
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
            <div className="text-center py-12 text-slate-600">
              {users.length === 0 ? 'No users found. Create a new user to get started.' : 'No users match your filters.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Username</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Phone Number</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Department</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-slate-900">Status</th>
                      <th className="text-center py-3 px-4 text-sm font-semibold text-slate-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.map((user, index) => (
                      <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-900 font-medium">{user.username}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{user.phoneNumber || '-'}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">{user.role}</td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {user.departments.length > 0 ? user.departments.join(', ') : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full ${
                              user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1">
                            {/* Edit Button */}
                            <button
                              onClick={() => handleEditUser(user)}
                              disabled={actionLoading === user.id}
                              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                              title="Edit User"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>

                            {/* Reset Password Button */}
                            {user.role !== 'SuperAdmin' && (
                              <button
                                onClick={() => handleResetPassword(user.id)}
                                disabled={actionLoading === user.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Reset Password"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            )}

                            {/* Lock/Unlock Button */}
                            {user.role !== 'SuperAdmin' && (
                              <>
                                {user.status === 'Active' ? (
                                  <button
                                    onClick={() => handleLockUser(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                                    title="Lock User"
                                  >
                                    <Lock className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnlockUser(user.id)}
                                    disabled={actionLoading === user.id}
                                    className="p-2 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                                    title="Unlock User"
                                  >
                                    <Unlock className="w-4 h-4" />
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
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-slate-600">
              Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
            </div>

            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="min-w-[32px] h-8 px-2 text-sm text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>

              {/* Page Numbers */}
              {renderPagination()}

              {/* Next Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="min-w-[32px] h-8 px-2 text-sm text-slate-600 hover:bg-slate-100 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>

              {/* Items per page dropdown */}
              <div className="flex items-center gap-2 ml-4">
                <Select
                  value={itemsPerPage.toString()}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="h-8 px-2 text-sm border-slate-300"
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