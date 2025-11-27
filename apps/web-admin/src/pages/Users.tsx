import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { UserPlus } from 'lucide-react'
import type { User } from '@/types/users'
import { useUsers } from '@/hooks/useUsers'
import { useUserFilters, usePagination } from '@/hooks/useUseFilters'
import { SearchBar, FilterDropdown } from '@/components/users/SearchAndFilter'
import { UserTable } from '@/components/users/UserTable'
import { UserCardList } from '@/components/users/UserCardList'
import Pagination from '@/components/users/Pagination'
import CreateUserDialog from '@/components/users/CreateUserDialog'
import EditUserDialog from '@/components/users/EditUserDialog'
import ConfirmDialog from '@/components/users/ConfirmDialog'
import Toast from '@/components/Toast'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

const Users: React.FC = () => {
  const { t } = useTranslation()
  const {
    users,
    loading,
    error,
    page,
    pageSize,
    totalRecords,
    setPage,
    setPageSize,
    createUser,
    updateUser,
    lockUser,
    unlockUser
  } = useUsers()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [filterOpen, setFilterOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    type: 'lock' | 'unlock'
    userId: string
    username: string
  } | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null)
  const filterRef = useRef<HTMLDivElement>(null)

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
        type: 'lock',
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
        type: 'unlock',
        userId: userId.toString(),
        username: user.username
      })
    }
  }

  // Đã loại bỏ reset password

  const handleConfirmAction = async () => {
    if (!confirmDialog) return

    setActionLoading(true)
    try {
      const userId = parseInt(confirmDialog.userId)
      switch (confirmDialog.type) {
        case 'lock':
          await lockUser(userId)
          setToast({ type: 'success', message: 'User locked successfully' })
          break
        case 'unlock':
          await unlockUser(userId)
          setToast({ type: 'success', message: 'User unlocked successfully' })
          break
      }
      setConfirmDialog(null)
    } catch (error) {
      console.error('Action failed:', error)
      setToast({ type: 'error', message: 'An error occurred. Please try again.' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleClearFilters = () => {
    setSelectedDepartments([])
    setSelectedStatuses([])
  }

  const filtersApplied = Boolean(searchQuery || selectedDepartments.length || selectedStatuses.length)
  const effectiveTotal = filtersApplied ? filteredUsers.length : totalRecords || users.length || 0

  return (
    <div className="space-y-4 md:space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 md:text-2xl lg:text-3xl">{t('user.pageTitle')}</h1>
          <p className="text-xs text-slate-500 md:text-sm">{t('user.pageDescription')}</p>
        </div>
        <div className="flex gap-3">
          <LanguageSwitcher />
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 md:w-auto"
          >
            <UserPlus className="h-4 w-4" />
            {t('user.createNewAccount')}
          </button>
        </div>
      </header>

      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterOpen={filterOpen}
        onToggleFilter={() => setFilterOpen(prev => !prev)}
        filterRef={filterRef}
        renderFilterDropdown={() => (
          <FilterDropdown
            selectedDepartments={selectedDepartments}
            selectedStatuses={selectedStatuses}
            onToggleDepartment={dept => toggleValue(dept, selectedDepartments, setSelectedDepartments)}
            onToggleStatus={status => toggleValue(status, selectedStatuses, setSelectedStatuses)}
            onClearFilters={handleClearFilters}
          />
        )}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Table view for desktop (>= 768px) */}

        <UserTable
          users={paginatedUsers}
          loading={loading}
          onEdit={handleEdit}
          onLock={handleLock}
          onUnlock={handleUnlock}
        />

        {/* Card view for mobile (< 768px) */}
        <div className="space-y-4 p-4 md:hidden">
          <UserCardList
            users={paginatedUsers}
            loading={loading}
            onEdit={handleEdit}
            onLock={handleLock}
            onUnlock={handleUnlock}
          />
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
        onSubmit={data => {
          // Chuyển đổi payload cho đúng type của createUser
          return createUser({
            ...data
          })
        }}
        onSuccess={() => {}}
      />

      <EditUserDialog
        open={editDialogOpen}
        user={selectedUser}
        onClose={() => {
          setEditDialogOpen(false)
          setSelectedUser(null)
        }}
        onSubmit={updateUser}
        onSuccess={() => {}}
      />

      <ConfirmDialog
        open={confirmDialog?.open || false}
        type={confirmDialog?.type || 'lock'}
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
