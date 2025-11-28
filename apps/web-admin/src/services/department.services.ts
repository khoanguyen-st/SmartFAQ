import { API_BASE_URL } from '@/lib/api'

export interface IDepartment {
  id: number
  name: string
  description?: string
  memberCount?: number
  createdAt?: string
}

const ENDPOINT = `${API_BASE_URL}/api/departments`

export const fetchDepartments = async (): Promise<IDepartment[]> => {
  const res = await fetch(`${ENDPOINT}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch departments')
  }
  return res.json()
}

export const createDepartment = async (data: { name: string; description?: string }): Promise<IDepartment> => {
  const res = await fetch(`${ENDPOINT}/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to create department')
  }
  return res.json()
}

export const updateDepartment = async (
  id: number,
  data: { name: string; description?: string }
): Promise<IDepartment> => {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update department')
  }
  return res.json()
}

export const deleteDepartment = async (id: number): Promise<void> => {
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: 'DELETE'
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete department')
  }
}
