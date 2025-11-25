import type { User, UserListResponse, UserQuery, CreateUserRequest } from '@/types/users'

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

const mockUsers: User[] = [
  {
    id: 1,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    departments: ['Academic Affairs'],
    status: 'Active'
  },
  {
    id: 2,
    username: 'tranbinh456',
    email: 'tranbinh456@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    departments: ['Academic Affairs'],
    status: 'Locked'
  },
  {
    id: 3,
    username: 'lechi789',
    email: 'lechi789@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    departments: ['Student Affairs', 'Academic Affairs'],
    status: 'Active'
  },
  {
    id: 4,
    username: 'phamdung012',
    email: 'phamdung012@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    departments: ['Information Technology'],
    status: 'Active'
  },
  {
    id: 5,
    username: 'hoangeminh345',
    email: 'hoangeminh345@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    departments: ['Academic Affairs'],
    status: 'Active'
  }
]

const MOCK_TOTAL = 50

export const mockApi = {
  async listUsers(params: UserQuery = {}): Promise<UserListResponse> {
    await delay(300)
    return {
      data: mockUsers,
      metadata: {
        total: MOCK_TOTAL,
        currentPage: params.page ?? 1,
        pageSize: params.pageSize ?? 10
      }
    }
  },
  async createUser(request: CreateUserRequest): Promise<User> {
    await delay(250)

    const duplicateUsername = mockUsers.find(u => u.username === request.username)
    if (duplicateUsername) {
      throw new Error('Username or email already exists.')
    }

    const duplicateEmail = mockUsers.find(u => u.email === request.email)
    if (duplicateEmail) {
      throw new Error('Username or email already exists.')
    }

    if (!request.departments || request.departments.length === 0) {
      throw new Error('At least one department must be assigned.')
    }

    const newUser: User = {
      id: mockUsers.length + 1,
      username: request.username,
      email: request.email,
      phoneNumber: request.phoneNumber,
      role: request.role || 'Staff',
      departments: request.departments,
      campus: request.campus,
      status: request.status || 'Active'
    }

    mockUsers.push(newUser)
    return newUser
  },
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    await delay(250)
    const base = mockUsers.find(u => u.id === id)
    if (!base) {
      throw new Error('User not found')
    }

    if (data.email && data.email !== base.email) {
      const duplicateEmail = mockUsers.find(u => u.email === data.email && u.id !== id)
      if (duplicateEmail) {
        throw new Error('Username or email already exists.')
      }
    }

    if (data.departments !== undefined && data.departments.length === 0) {
      throw new Error('At least one department must be assigned.')
    }

    const updated = { ...base, ...data }
    const index = mockUsers.findIndex(u => u.id === id)
    if (index !== -1) {
      mockUsers[index] = updated
    }
    return updated
  },
  async lockUser(id: number): Promise<void> {
    await delay(150)
    const u = mockUsers.find(x => x.id === id)
    if (u) u.status = 'Locked'
  },
  async unlockUser(id: number): Promise<void> {
    await delay(150)
    const u = mockUsers.find(x => x.id === id)
    if (u) u.status = 'Active'
  },
  async resetUserPassword(_: number): Promise<void> {
    await delay(200)
  }
}
