import { API_BASE_URL } from '@/lib/api'

export interface IDepartment {
  id: number
  name: string
  description?: string
  memberCount?: number // Số lượng nhân viên (để hiển thị UI nếu cần)
  createdAt?: string
}

// GET: Lấy danh sách phòng ban
export const fetchDepartments = async (): Promise<IDepartment[]> => {
  const res = await fetch(`${API_BASE_URL}/api/departments`)
  if (!res.ok) throw new Error('Failed to fetch departments')
  return res.json()
}

// POST: Tạo phòng ban mới
export const createDepartment = async (data: { name: string; description?: string }): Promise<IDepartment> => {
  const res = await fetch(`${API_BASE_URL}/api/departments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to create department')
  }
  return res.json()
}

// PUT: Cập nhật phòng ban
export const updateDepartment = async (
  id: number,
  data: { name: string; description?: string }
): Promise<IDepartment> => {
  const res = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || 'Failed to update department')
  }
  return res.json()
}

// DELETE: Xóa phòng ban
export const deleteDepartment = async (id: number): Promise<void> => {
  const res = await fetch(`${API_BASE_URL}/api/departments/${id}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    // Xử lý lỗi nghiệp vụ: Cannot delete department with assigned staff
    throw new Error(errorData.error || 'Failed to delete department')
  }
}
