import { VALIDATION_RULES } from '@/constants/validation'

export const validateEmail = (email: string): string | null => {
  if (!VALIDATION_RULES.EMAIL.REGEX.test(email)) {
    return 'Invalid email address'
  }

  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return 'Password is required'

  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return `Password must be at least ${VALIDATION_RULES.PASSWORD.MIN_LENGTH} characters`
  }

  const hasUppercase = VALIDATION_RULES.PASSWORD.REGEX.UPPERCASE.test(password)
  const hasLowercase = VALIDATION_RULES.PASSWORD.REGEX.LOWERCASE.test(password)
  const hasNumber = VALIDATION_RULES.PASSWORD.REGEX.NUMBER.test(password)
  const hasSpecialChar = VALIDATION_RULES.PASSWORD.REGEX.SPECIAL_CHAR.test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return 'Password must contain uppercase, lowercase, number, and special character'
  }

  return null
}

export const validateUsername = (username: string): string | null => {
  if (!username) return 'Username is required'
  if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) {
    return `Username must be at least ${VALIDATION_RULES.USERNAME.MIN_LENGTH} characters`
  }
  return null
}

export const STATUS_OPTIONS = [
  { value: 'Active', label: 'Active' },
  { value: 'Locked', label: 'Locked' }
] as const

export const validateDepartments = (departments?: string[]): string | null => {
  if (!departments || departments.length === 0) {
    return 'Please select at least one department'
  }
  return null
}
