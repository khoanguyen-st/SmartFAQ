import { API_BASE_URL } from '@/lib/api'

export interface IUserInDepartment {
  id: number
  username: string
  email: string
  role: string
}

export interface IDepartment {
  id: number
  name: string
  users: IUserInDepartment[]
}

const ENDPOINT = `${API_BASE_URL}/api/departments`

export const fetchDepartments = async (): Promise<IDepartment[]> => {
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(`${ENDPOINT}/`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch departments')
  }
  return res.json()
}

export const fetchUsersForDepartment = async (): Promise<IUserInDepartment[]> => {
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(`${ENDPOINT}/users`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to fetch users')
  }
  return res.json()
}

export const createDepartment = async (data: { name: string; user_ids?: number[] }): Promise<IDepartment> => {
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(`${ENDPOINT}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
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
  data: { name: string; user_ids?: number[] }
): Promise<IDepartment> => {
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify(data)
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to update department')
  }
  return res.json()
}

export const deleteDepartment = async (id: number): Promise<void> => {
  const accessToken = localStorage.getItem('access_token')
  const res = await fetch(`${ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    }
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || 'Failed to delete department')
  }
}
