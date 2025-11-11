import type {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  User,
} from '../types/user'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE_URL}/admin/metrics`)
  if (!res.ok) throw new Error('Failed to load metrics')
  return res.json()
}

// User Management API
export async function fetchUsers(): Promise<User[]> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Failed to create user" }));
      throw new Error(error.error || `Server error: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Please check if the backend server is running.`);
    }
    throw error;
  }
}

export async function updateUser(userId: number, data: UpdateUserRequest): Promise<UpdateUserResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Failed to update user" }));
      throw new Error(error.error || `Server error: ${res.status}`);
    }
    
    return res.json();
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(`Cannot connect to API at ${API_BASE_URL}. Please check if the backend server is running.`);
    }
    throw error;
  }
}

export async function deleteUser(userId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete user");
  }
}
