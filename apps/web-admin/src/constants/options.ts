export const CAMPUS_KEYS = {
  HANOI: 'campus.hanoi',
  DANANG: 'campus.danang',
  HOCHIMINH: 'campus.hochiminh'
} as const

export const DEPARTMENT_KEYS = {
  ACADEMIC: 'department.academic',
  STUDENT: 'department.student',
  IT: 'department.it'
} as const

export const CAMPUS_VALUES = {
  'campus.hanoi': 'Hà Nội Campus',
  'campus.danang': 'Đà Nẵng Campus',
  'campus.hochiminh': 'Hồ Chí Minh Campus'
} as const

export const DEPARTMENT_VALUES = {
  'department.academic': 'Academic Affairs',
  'department.student': 'Student Affairs',
  'department.it': 'Information Technology'
} as const

export const getCampusOptions = () => [CAMPUS_KEYS.HANOI, CAMPUS_KEYS.DANANG, CAMPUS_KEYS.HOCHIMINH]

export const getDepartmentOptions = () => [DEPARTMENT_KEYS.ACADEMIC, DEPARTMENT_KEYS.STUDENT, DEPARTMENT_KEYS.IT]
