import { User, CreateUserRequest, UpdateUserRequest } from './api'

// Mock data - matching the design
const MOCK_USERS: User[] = [
  {
    id: 1,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    role: 'Admin',
    status: 'Active',
    phoneNumber: '0224576981',
    address: 'Academic Affairs',
    image: null,
    created_at: '2024-01-15T08:30:00Z'
  },
  {
    id: 2,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    role: 'Admin',
    status: 'Locked',
    phoneNumber: '0224576981',
    address: 'Academic Affairs',
    image: null,
    created_at: '2024-02-20T10:15:00Z'
  },
  {
    id: 3,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    role: 'Admin',
    status: 'Active',
    phoneNumber: '0224576981',
    address: 'Student Affairs, Academic Affairs',
    image: null,
    created_at: '2024-03-10T14:45:00Z'
  },
  {
    id: 4,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    role: 'Admin',
    status: 'Active',
    phoneNumber: '0224576981',
    address: 'Information Technology',
    image: null,
    created_at: '2024-04-05T09:20:00Z'
  },
  {
    id: 5,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    role: 'Admin',
    status: 'Active',
    phoneNumber: '0224576981',
    address: 'Academic Affairs',
    image: null,
    created_at: '2024-05-12T11:30:00Z'
  }
]

let mockUsers = [...MOCK_USERS]
let nextId = 6

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

// Mock API functions
export const mockApi = {
  async fetchUsers(): Promise<User[]> {
    await delay()
    return [...mockUsers]
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    await delay()

    // Check if email already exists
    if (mockUsers.some(u => u.email === data.email)) {
      throw new Error('Email already exists')
    }

    // Generate username from email
    const username = data.email.split('@')[0]

    const newUser: User = {
      id: nextId++,
      username,
      email: data.email,
      role: data.role || 'Admin',
      status: data.status || 'Active',
      phoneNumber: data.phoneNumber || null,
      address: data.address || null,
      image: data.image || null,
      created_at: new Date().toISOString()
    }

    mockUsers.push(newUser)
    return newUser
  },

  async updateUser(userId: number, data: UpdateUserRequest): Promise<User> {
    await delay()

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    // Check if email already exists (excluding current user)
    if (data.email && mockUsers.some(u => u.id !== userId && u.email === data.email)) {
      throw new Error('Email already exists')
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...data
    }

    return mockUsers[userIndex]
  },

  async lockUser(userId: number): Promise<User> {
    await delay()

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    mockUsers[userIndex].status = 'Locked'
    return mockUsers[userIndex]
  },

  async unlockUser(userId: number): Promise<User> {
    await delay()

    const userIndex = mockUsers.findIndex(u => u.id === userId)
    if (userIndex === -1) {
      throw new Error('User not found')
    }

    mockUsers[userIndex].status = 'Active'
    return mockUsers[userIndex]
  },

  async resetUserPassword(userId: number): Promise<{ message: string }> {
    await delay()

    const user = mockUsers.find(u => u.id === userId)
    if (!user) {
      throw new Error('User not found')
    }

    return {
      message: `Password reset email sent to ${user.email}`
    }
  },

  // Reset mock data to initial state
  resetMockData() {
    mockUsers = [...MOCK_USERS]
    nextId = 6
  }
}
