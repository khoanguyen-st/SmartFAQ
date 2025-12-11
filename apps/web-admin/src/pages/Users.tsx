import React, { useState, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import type { User, Department } from '@/types/users'
import { fetchDepartments, type IDepartment } from '@/services/department.services'
import { useUsers } from '@/hooks/useUsers'
import { useUserFilters } from '@/hooks/useUseFilters'
import { usePagination } from '@/hooks/usePagination'
import { SearchBar, FilterDropdown } from '@/components/users/SearchAndFilter'
import { UserTable } from '@/components/users/UserTable'
import { UserCardList } from '@/components/users/UserCardList'
import Pagination from '@/components/users/Pagination'
import CreateUserDialog from '@/components/users/CreateUserDialog'
import EditUserDialog from '@/components/users/EditUserDialog'
import ConfirmDialog from '@/components/users/ConfirmDialog'
import Toast from '@/components/Toast'
import { USER_ACTIONS } from '@/constants/user'

const Users: React.FC = () => {
  const {
    users,
    loading,
    error,
    page,
    pageSize,
    setPage,
    setPageSize,
    createUser,
    updateUser,
    lockUser,
    unlockUser,
    resetPassword
  } = useUsers()

  const [searchQuery, setSearchQuery] = useState('')

  const [availableDepartments, setAvailableDepartments] = useState<Department[]>([])

  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: typeof USER_ACTIONS.LOCK | typeof USER_ACTIONS.UNLOCK | typeof USER_ACTIONS.RESET_PASSWORD
    userId: string
    username: string
  } | null>(null)

  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)

  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchDepartments()
        // 2. SỬA MAP: Thay 'any' bằng 'IDepartment'
        const mappedDepts: Department[] = data.map((d: IDepartment) => ({
          id: d.id,
          name: d.name
        }))
        setAvailableDepartments(mappedDepts)
      } catch (err) {
        console.error('Failed to load departments', err)
      }
    }
    loadDepartments()
  }, [])

  const filteredUsers = useUserFilters({ users, searchQuery, selectedDepartments, selectedStatuses })

  const { paginatedItems: paginatedUsers, totalPages } = usePagination({
    items: filteredUsers,
    page,
    pageSize,
    onPageChange: setPage
  })

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (filterOpen && filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [filterOpen])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, selectedDepartments, selectedStatuses, pageSize, setPage])

  const toggleValue = <T extends string>(value: T, list: T[], setter: (next: T[]) => void) => {
    setter(list.includes(value) ? list.filter(item => item !== value) : [...list, value])
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setEditDialogOpen(true)
  }

  const handleLock = (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setConfirmDialog({
        open: true,
        type: USER_ACTIONS.LOCK,
        userId: userId.toString(),
        username: user.username
      })
    }
  }

  const handleUnlock = (userId: number) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setConfirmDialog({
        open: true,
        type: USER_ACTIONS.UNLOCK,
        userId: userId.toString(),
        username: user.username
      })
    }
  }

  const handleResetPassword = (user: User) => {
    setConfirmDialog({
      open: true,
      type: USER_ACTIONS.RESET_PASSWORD,
      userId: user.id.toString(),
      username: user.username
    })
  }

  const handleConfirmAction = async () => {
    if (!confirmDialog) return

    setActionLoading(true)
    try {
      const userId = parseInt(confirmDialog.userId)
      switch (confirmDialog.type) {
        case USER_ACTIONS.LOCK:
          await lockUser(userId)
          setToast({ type: 'success', message: 'Inactive user successfully' })
          break
        case USER_ACTIONS.UNLOCK:
          await unlockUser(userId)
          setToast({ type: 'success', message: 'Active user successfully' })
          break
        case USER_ACTIONS.RESET_PASSWORD: {
          const user = users.find(u => u.id === userId)
          if (user && user.email) {
            await resetPassword(user.email)
            setToast({ type: 'success', message: 'Password reset email has been sent successfully' })
          } else {
            setToast({ type: 'error', message: 'User email not found' })
          }
          break
        }
      }
      setConfirmDialog(null)
    } catch (error) {
      console.error('Action failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.'
      setToast({ type: 'error', message: errorMessage })
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedDepartments([])
    setSelectedStatuses([])
  }

  return (
    <div className="flex flex-col gap-6 p-6 h-[calc(100vh-81px)] bg-white overflow-auto ">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="pl-2">
          <h1 className="font-bold mb-2 text-slate-900 text-3xl">User Management</h1>
          <p className="text-base text-slate-500">Manage user accounts and system access</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#003087] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#002060] md:w-auto"
          >
            <Plus className="h-5 w-5" />
            Create New Account
          </button>
        </div>
      </header>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOpen={filterOpen}
        onToggleFilter={() => setFilterOpen(prev => !prev)}
        filterRef={filterRef as React.RefObject<HTMLDivElement>}
        renderFilterDropdown={() => (
          <FilterDropdown
            selectedDepartments={selectedDepartments}
            selectedStatuses={selectedStatuses}
            onToggleDepartment={dept => toggleValue(dept, selectedDepartments, setSelectedDepartments)}
            onToggleStatus={status => toggleValue(status, selectedStatuses, setSelectedStatuses)}
            onClearFilters={handleClearFilters}
            departments={availableDepartments}
          />
        )}
      />

      <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">      
        <UserTable
          users={paginatedUsers}
          loading={loading}
          onEdit={handleEdit}
          onLock={handleLock}
          onUnlock={handleUnlock}
          onResetPassword={handleResetPassword}
        />

        <div className="space-y-4 p-4 md:hidden">
          <UserCardList
            users={paginatedUsers}
            loading={loading}
            onEdit={handleEdit}
            onLock={handleLock}
            onUnlock={handleUnlock}
            onResetPassword={handleResetPassword}
          />
        </div>
      </div>

      <div className="w-full">
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalCount={filteredUsers.length}
        />
      </div>

      <CreateUserDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={data => createUser(data)}
        onSuccess={() => {
          setToast({
            type: 'success',
            message: 'User created successfully'
          })
        }}
        users={users}
      />

      <EditUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={updateUser}
        onSuccess={() => {
          setToast({
            type: 'success',
            message: 'User updated successfully'
          })
        }}
        users={users}
      />

      <ConfirmDialog
        open={confirmDialog?.open || false}
        type={confirmDialog?.type || USER_ACTIONS.LOCK}
        username={confirmDialog?.username}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmDialog(null)}
        loading={actionLoading}
      />

      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    </div>
  )
}
export default Users
