import * as realApi from './api'
import { mockApi } from './api.mock'

// Toggle this to switch between mock and real API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API === 'true'

export const api = USE_MOCK_API
  ? mockApi
  : {
      fetchUsers: realApi.fetchUsers,
      createUser: realApi.createUser,
      updateUser: realApi.updateUser,
      lockUser: realApi.lockUser,
      unlockUser: realApi.unlockUser,
      resetUserPassword: realApi.resetUserPassword
    }

// Re-export types
export type { User, CreateUserRequest, UpdateUserRequest } from './api'
