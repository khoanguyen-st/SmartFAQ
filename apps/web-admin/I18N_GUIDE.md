# Internationalization (i18n) Integration

## Overview
The web-admin application now supports multiple languages (Vietnamese and English) using `react-i18next`.

## Setup

### Dependencies
- `i18next`: Core i18n framework
- `react-i18next`: React bindings for i18next

### Configuration
- **Config file**: `src/lib/i18n.ts`
- **Default language**: Vietnamese (vi)
- **Fallback language**: English (en)
- **Translation files**: `src/locales/en.json` and `src/locales/vi.json`

## Translation Files

### Structure
Translation files are organized by feature/domain:

```json
{
  "common": {
    "loading": "...",
    "save": "...",
    "cancel": "..."
  },
  "user": {
    "pageTitle": "...",
    "table": { ... },
    "form": { ... },
    "dialog": { ... },
    "validation": { ... }
  },
  "campus": { ... },
  "department": { ... },
  "role": { ... }
}
```

### Translation Keys

#### Common Actions
- `common.loading`, `common.save`, `common.cancel`, `common.edit`, `common.delete`
- `common.create`, `common.update`, `common.search`, `common.filter`

#### User Management
- Page: `user.pageTitle`, `user.pageDescription`, `user.createNewAccount`
- Table: `user.table.id`, `user.table.username`, `user.table.email`, etc.
- Form: `user.form.username`, `user.form.email`, `user.form.campus`, etc.
- Dialogs: `user.dialog.createTitle`, `user.dialog.editTitle`, etc.
- Validation: `user.validation.usernameRequired`, `user.validation.emailInvalid`, etc.
- Actions: `user.editUser`, `user.lockUser`, `user.unlockUser`, `user.resetPassword`

#### Options
- Campus: `campus.hanoi`, `campus.danang`, `campus.hochiminh`
- Department: `department.academic`, `department.student`, `department.it`
- Role: `role.admin`, `role.staff`, `role.manager`

## Usage

### In Components

```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  
  return (
    <div>
      <h1>{t('user.pageTitle')}</h1>
      <button>{t('common.save')}</button>
    </div>
  )
}
```

### In Validation Functions

```tsx
import i18n from './i18n'

export const validateEmail = (email: string): string | null => {
  if (!emailRegex.test(email)) {
    return i18n.t('user.validation.emailInvalid')
  }
  return null
}
```

### With Dynamic Options

```tsx
import { getCampusOptions } from '@/constants/options'

const { t } = useTranslation()

getCampusOptions().map(option => (
  <option key={option} value={t(option)}>
    {t(option)}
  </option>
))
```

## Language Switching

A `LanguageSwitcher` component is available:

```tsx
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

<LanguageSwitcher />
```

This button toggles between Vietnamese (VI) and English (EN).

## File Structure

```
src/
├── lib/
│   ├── i18n.ts                    # i18n configuration
│   └── validation.ts              # Validation with translated messages
├── locales/
│   ├── en.json                    # English translations
│   └── vi.json                    # Vietnamese translations
├── constants/
│   ├── options.ts                 # Translatable option keys
│   └── user.ts                    # User-related constants (deprecated)
├── components/
│   ├── LanguageSwitcher.tsx       # Language toggle component
│   └── users/
│       ├── CreateUserDialog.tsx   # Uses translations
│       ├── EditUserDialog.tsx     # Uses translations
│       ├── UserTable.tsx          # Uses translations
│       ├── UserCardList.tsx       # Uses translations
│       ├── UserActions.tsx        # Uses translations
│       └── SearchAndFilter.tsx    # Uses translations
└── pages/
    └── Users.tsx                  # Uses translations

```

## Adding New Translations

### 1. Add to Translation Files

Add the new key to both `en.json` and `vi.json`:

```json
// en.json
{
  "feature": {
    "newKey": "English text"
  }
}

// vi.json
{
  "feature": {
    "newKey": "Vietnamese text"
  }
}
```

### 2. Use in Components

```tsx
const { t } = useTranslation()
<div>{t('feature.newKey')}</div>
```

## Best Practices

1. **Namespace by feature**: Group related translations under feature keys (e.g., `user.*`, `common.*`)
2. **Consistent naming**: Use camelCase for keys
3. **Avoid hardcoded text**: Always use translation keys for user-facing text
4. **Default language**: Vietnamese is the primary language, English is fallback
5. **Type safety**: TypeScript will help catch missing translations during build

## Testing

1. Start dev server: `yarn workspace @smartfaq/web-admin dev`
2. Open browser: `http://localhost:5174`
3. Click the language switcher (🇻🇳 VI / 🇬🇧 EN) to toggle languages
4. Verify all text changes between Vietnamese and English

## Notes

- User status values (`Active`, `Locked`) in the database remain in English
- Only the display text is translated
- Form data (campus, department values) are stored in the selected language
- The `constants/user.ts` file is now deprecated; use translation keys directly
