import { useEffect, useMemo, useState } from 'react'

import CreateDepartmentModal from '@/components/departments/CreateDepartmentModal'
import DeleteDepartmentModal from '@/components/departments/DeleteDepartmentModal'
import UpdateDepartmentModal from '@/components/departments/UpdateDepartmentModal'
import {
  createDepartment,
  deleteDepartment,
  fetchDepartments,
  fetchUsersForDepartment,
  IDepartment,
  IUserInDepartment,
  updateDepartment
} from '@/services/department.services'

import Plus from '@/assets/icons/plus.svg'
import Search from '@/assets/icons/search.svg'
import Update from '@/assets/icons/edit.svg'
import Delete from '@/assets/icons/trash.svg'
import Previous from '@/assets/icons/previous.svg'
import Next from '@/assets/icons/next.svg'

const DepartmentsPage = () => {
  const [departments, setDepartments] = useState<IDepartment[]>([])
  const [availableUsers, setAvailableUsers] = useState<IUserInDepartment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<IDepartment | null>(null)
  const [deletingDept, setDeletingDept] = useState<IDepartment | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [deptData, userData] = await Promise.all([fetchDepartments(), fetchUsersForDepartment()])

      if (Array.isArray(deptData)) {
        setDepartments(deptData)
      } else {
        setDepartments(deptData as unknown as IDepartment[])
      }

      setAvailableUsers(userData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredData = useMemo(() => {
    return departments.filter(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [departments, searchTerm])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)

  const currentData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredData.slice(start, start + itemsPerPage)
  }, [filteredData, currentPage, itemsPerPage])

  const handleCreate = async (data: { name: string; user_ids: number[] }) => {
    setIsLoading(true)
    try {
      await createDepartment(data)
      await loadData()
      setIsAddOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (data: { name: string; user_ids: number[] }) => {
    if (!editingDept) return
    setIsLoading(true)
    try {
      await updateDepartment(editingDept.id, data)
      await loadData()
      setEditingDept(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingDept) return
    setIsLoading(true)
    try {
      await deleteDepartment(deletingDept.id)
      setDeletingDept(null)
      await loadData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete')
    } finally {
      setIsLoading(false)
    }
  }

  const getPageNumbers = () => {
    const pages = []
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 5)
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2)
      }
    }
    return pages
  }

  return (
    <div className="flex h-[calc(100vh-81px)] flex-col gap-6 overflow-auto bg-white p-6">
      <div className="dept-header-section">
        <div className="pl-2">
          <h3 className="mb-2 text-3xl leading-tight font-bold text-[#111827]">List of Department</h3>
          <p className="text-base text-[#637381]">Manage departments</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#003087] px-3.5 py-2.5 text-sm font-normal text-white shadow-sm transition-colors hover:bg-[#002569] md:w-auto"
        >
          <img src={Plus} alt="plus" className="h-[11px] w-[11px]" />
          <span>Create New Department</span>
        </button>
      </div>

      <div className="dept-search-section">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Enter to Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="h-15 w-full rounded-xl bg-white pr-10 pl-6 text-sm text-[#111827] transition-colors outline-none placeholder:text-[#637381] focus:border-[#003087] focus:ring-1 focus:ring-[#003087] md:pr-14"
          />

          <div className="absolute top-1/2 right-5 -translate-y-1/2 transform">
            <img src={Search} alt="search" className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="dept-table-wrapper">
        <div className="w-full border-b border-[#EEEEEE] bg-white pr-1.5">
          <table className="w-full min-w-full table-fixed border-collapse">
            <thead>
              <tr className="text-left">
                <th className="w-[15%] py-4 text-center text-sm font-semibold text-[#111827] md:w-[10%] md:text-lg">
                  ID
                </th>
                <th className="w-[60%] py-4 text-center text-sm font-semibold text-[#111827] md:w-[70%] md:text-lg">
                  Name
                </th>
                <th className="w-[25%] py-4 text-center text-sm font-semibold text-[#111827] md:w-[20%] md:text-lg">
                  Action
                </th>
              </tr>
            </thead>
          </table>
        </div>

        <div className="max-h-[370px] flex-1 overflow-y-auto [scrollbar-gutter:stable] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 [&::-webkit-scrollbar-track]:bg-transparent">
          <table className="w-full min-w-full table-fixed border-collapse">
            <tbody>
              {currentData.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 pr-30 text-center text-gray-500">
                    {isLoading ? 'Loading...' : 'No departments found.'}
                  </td>
                </tr>
              ) : (
                currentData.map(dept => (
                  <tr key={dept.id} className="dept-table-row">
                    <td className="w-[15%] text-center text-sm font-medium text-[#637381] md:w-[10%] md:text-base">
                      {dept.id}
                    </td>
                    <td className="w-[60%] truncate px-2 text-center text-sm font-medium text-[#637381] md:w-[70%] md:px-6 md:text-base">
                      {dept.name}
                    </td>
                    <td className="w-[25%] md:w-[20%]">
                      <div className="flex items-center justify-center gap-2 md:gap-2.5">
                        <button
                          onClick={() => setEditingDept(dept)}
                          className="group flex items-center justify-center transition-transform hover:scale-110"
                          title="Edit"
                        >
                          <img src={Update} alt="edit" className="h-[15px] w-[15px]" />
                        </button>

                        <button
                          onClick={() => setDeletingDept(dept)}
                          className="group flex items-center justify-center transition-transform hover:scale-110"
                          title="Delete"
                        >
                          <img src={Delete} alt="delete" className="h-[15px] w-[15px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dept-pagination-section">
        <div className="mr-6 hidden text-base font-medium text-[#202224] opacity-60 sm:block">
          Showing {filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <img src={Previous} alt="prev" className="h-3 w-3" />
          </button>

          <div className="flex items-center gap-2">
            {getPageNumbers().map(pageNum => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-normal transition-all md:text-base ${
                  pageNum === currentPage
                    ? 'border border-[#1677FF] bg-white text-[#1677FF] shadow-[0px_0px_4px_#1677FF]'
                    : 'text-[#637381] hover:bg-gray-200'
                }`}
              >
                {pageNum}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="flex h-6 w-6 items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50"
          >
            <img src={Next} alt="next" className="h-3 w-3" />
          </button>

          <div className="relative ml-2">
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-9 cursor-pointer appearance-none rounded-lg border border-[#CED4DA] bg-white pr-8 pl-3 text-sm text-[#637381] outline-none focus:border-[#1677FF]"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <CreateDepartmentModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreate}
        isLoading={isLoading}
        availableUsers={availableUsers}
      />

      <UpdateDepartmentModal
        isOpen={!!editingDept}
        initialData={editingDept}
        onClose={() => setEditingDept(null)}
        onSubmit={handleUpdate}
        isLoading={isLoading}
        availableUsers={availableUsers}
      />

      <DeleteDepartmentModal
        isOpen={!!deletingDept}
        departmentName={deletingDept?.name || ''}
        onClose={() => setDeletingDept(null)}
        onConfirm={handleDelete}
        isLoading={isLoading}
      />
    </div>
  )
}

export default DepartmentsPage
