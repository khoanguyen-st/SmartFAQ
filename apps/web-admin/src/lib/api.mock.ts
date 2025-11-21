import type { User, UserListResponse, UserQuery, CreateUserRequest } from '../../types/users'

// Simulate API delay
const delay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms))

const mockUsers: User[] = [
  {
    id: 1,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    department: 'Academic Affairs',
    status: 'Active'
  },
  {
    id: 2,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    department: 'Academic Affairs',
    status: 'Locked'
  },
  {
    id: 3,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    department: 'Student Affairs,\nAcademic Affairs',
    status: 'Active'
  },
  {
    id: 4,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    department: 'Information Technology',
    status: 'Active'
  },
  {
    id: 5,
    username: 'nguyenan123',
    email: 'nguyenan123@example.com',
    phoneNumber: '0224576981',
    role: 'Staff',
    department: 'Academic Affairs',
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
  async createUser(_: CreateUserRequest): Promise<User> {
    await delay(250)
    return mockUsers[0]
  },
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    await delay(250)
    const base = mockUsers.find(u => u.id === id) || mockUsers[0]
    return { ...base, ...data }
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
