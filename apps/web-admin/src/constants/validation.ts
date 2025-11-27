// Validation constants
export const VALIDATION_RULES = {
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    REGEX: {
      UPPERCASE: /[A-Z]/,
      LOWERCASE: /[a-z]/,
      NUMBER: /\d/,
      SPECIAL_CHAR: /[!@#$%^&*(),.?":{}|<>]/
    }
  },
  USERNAME: {
    MIN_LENGTH: 3
  }
} as const
