import i18n from './i18n'
import { VALIDATION_RULES } from '@/constants/validation'

export const validateEmail = (email: string): string | null => {
  if (!VALIDATION_RULES.EMAIL.REGEX.test(email)) {
    return i18n.t('user.validation.emailInvalid')
  }

  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return i18n.t('user.validation.passwordRequired')

  if (password.length < VALIDATION_RULES.PASSWORD.MIN_LENGTH) {
    return i18n.t('user.validation.passwordRequirements')
  }

  const hasUppercase = VALIDATION_RULES.PASSWORD.REGEX.UPPERCASE.test(password)
  const hasLowercase = VALIDATION_RULES.PASSWORD.REGEX.LOWERCASE.test(password)
  const hasNumber = VALIDATION_RULES.PASSWORD.REGEX.NUMBER.test(password)
  const hasSpecialChar = VALIDATION_RULES.PASSWORD.REGEX.SPECIAL_CHAR.test(password)

  if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
    return i18n.t('user.validation.passwordRequirements')
  }

  return null
}

export const validateUsername = (username: string): string | null => {
  if (!username) return i18n.t('user.validation.usernameRequired')
  if (username.length < VALIDATION_RULES.USERNAME.MIN_LENGTH) return i18n.t('user.validation.usernameMinLength')
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
