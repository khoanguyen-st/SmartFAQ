import i18n from './i18n'

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(email)) {
    return i18n.t('user.validation.emailInvalid')
  }

  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return i18n.t('user.validation.passwordRequired')

  if (password.length < 8) {
    return i18n.t('user.validation.passwordRequirements')
  }

  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return i18n.t('user.validation.passwordRequirements')
  }

  return null
}

export const validateUsername = (username: string): string | null => {
  if (!username) return i18n.t('user.validation.usernameRequired')
  if (username.length < 3) return i18n.t('user.validation.usernameMinLength')
  return null
}

export const STATUS_OPTIONS = [
  { value: 'Active', label: i18n.t('user.status.active') },
  { value: 'Locked', label: i18n.t('user.status.locked') }
] as const

export const validateDepartments = (departments?: string[]): string | null => {
  if (!departments || departments.length === 0) {
    return i18n.t('user.validation.departmentRequired')
  }
  return null
}
