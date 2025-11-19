// Validation helpers for User Management

export const validateEmail = (email: string): string | null => {
  if (!email) return 'Email is required'
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email format. Please enter a valid email address.'
  }
  
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'
  
  if (password.length < 8) {
    return 'Password does not meet security requirements.'
  }
  
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
  
  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return 'Password does not meet security requirements.'
  }
  
  return null
}

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required'
  if (username.length < 3) return 'Username must be at least 3 characters'
  return null
}

export const validateDepartments = (departments: string[]): string | null => {
  if (!departments || departments.length === 0) {
    return 'At least one department must be assigned.'
  }
  return null
}

export const CAMPUS_OPTIONS = [
  { value: 'DN', label: 'Da Nang' },
  { value: 'HCM', label: 'Ho Chi Minh' },
  { value: 'HN', label: 'Ha Noi' },
  { value: 'CT', label: 'Can Tho' }
] as const

export const DEPARTMENT_OPTIONS = [
  'Student Affairs',
  'Academic Affairs',
  'Finance',
  'IT Support',
  'Admissions',
  'Library',
  'Human Resources'
]

export const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Locked', label: 'Locked' }
] as const
