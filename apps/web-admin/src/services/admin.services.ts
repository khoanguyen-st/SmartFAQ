import type { User, CreateUserRequest } from '@/types/users';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {})
    }
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchUsers(): Promise<User[]> {
  const data = await apiClient<{ items: User[] }>('/api/admin/');
  return data.items;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const res = await apiClient<User>('/api/admin/', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res;
}

export async function updateUser(userId: string, data: Partial<User>): Promise<User> {
  const res = await apiClient<User>(`/api/admin/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  return res;
}

export async function resetUserPassword(userId: string): Promise<{ message: string }> {
  return apiClient<{ message: string }>(`/api/admin/${userId}/reset-password`, {
    method: 'POST'
  });
}

export async function lockUser(userId: string): Promise<User> {
  return apiClient<User>(`/api/admin/${userId}/lock`, {
    method: 'PATCH'
  });
}

export async function unlockUser(userId: string): Promise<User> {
  return apiClient<User>(`/api/admin/${userId}/unlock`, {
    method: 'PATCH'
  });
}