export const USER_ACTION_LABELS = {
  EDIT: 'Edit',
  LOCK: 'Lock',
  UNLOCK: 'Unlock',
  RESET_PASSWORD: 'Reset Password',
  EDIT_USER: 'Edit user',
  LOCK_USER: 'Inactive',
  UNLOCK_USER: 'Active user'
} as const

export const USER_STATUS = {
  ACTIVE: 'Active',
  LOCKED: 'Locked'
} as const

export const UI_MESSAGES = {
  LOADING: 'Loading...',
  NO_USERS_FOUND: 'No users found'
} as const

export const USER_TABLE_HEADERS = {
  ID: 'ID',
  USERNAME: 'Username',
  EMAIL: 'Email',
  PHONE_NUMBER: 'Phone Number',
  ROLE: 'Role',
  DEPARTMENT: 'Department',
  STATUS: 'Status',
  ACTION: 'Action'
} as const

export const USER_CARD_LABELS = {
  EMAIL: 'Email:',
  PHONE: 'Phone:',
  ROLE: 'Role:',
  DEPARTMENT: 'Department:'
} as const

export const USER_ACTIONS = {
  LOCK: 'lock',
  UNLOCK: 'unlock',
  RESET_PASSWORD: 'resetPassword',
  EDIT: 'edit'
} as const

export type UserActionLabel = (typeof USER_ACTION_LABELS)[keyof typeof USER_ACTION_LABELS]
export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS]
export type UIMessage = (typeof UI_MESSAGES)[keyof typeof UI_MESSAGES]
export type UserTableHeader = (typeof USER_TABLE_HEADERS)[keyof typeof USER_TABLE_HEADERS]
export type UserCardLabel = (typeof USER_CARD_LABELS)[keyof typeof USER_CARD_LABELS]
export type UserActionType = (typeof USER_ACTIONS)[keyof typeof USER_ACTIONS]
