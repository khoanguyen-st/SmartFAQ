import { ReactNode, createContext, useContext, useMemo, useState } from 'react'

const translations = {
  en: {
    // Sidebar Navigation
    dashboard: 'Dashboard',
    users: 'Users',
    logs: 'Logs',
    settings: 'Settings',
    uploadedDocuments: 'Uploaded Documents',
    viewChat: 'View Chat',

    // Common
    close: 'Close',
    open: 'Open',
    cancel: 'Cancel',
    delete: 'Delete',
    menu: 'menu',
    closeSidebar: 'Close sidebar',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',

    // Upload Card
    uploadNewDocument: 'Upload new document',
    addPdfFiles: 'Add PDF files',

    // Delete Confirmation Modal
    deleteDocument: 'Delete Document?',
    deleteConfirmMessage: 'You are about to delete 1 document named: "{documentTitle}".',
    deleteWarning: 'This action cannot be undone. Do you want to continue?'
  },
  vi: {
    // Sidebar Navigation
    dashboard: 'Trang chủ',
    users: 'Người dùng',
    logs: 'Nhật ký',
    settings: 'Cài đặt',
    uploadedDocuments: 'Tài liệu đã tải lên',
    viewChat: 'Xem trò chuyện',

    // Common
    close: 'Đóng',
    open: 'Mở',
    cancel: 'Hủy',
    delete: 'Xóa',
    menu: 'menu',
    closeSidebar: 'Đóng thanh bên',
    openMenu: 'Mở menu',
    closeMenu: 'Đóng menu',

    // Upload Card
    uploadNewDocument: 'Tải lên tài liệu mới',
    addPdfFiles: 'Thêm file PDF',

    // Delete Confirmation Modal
    deleteDocument: 'Xóa tài liệu?',
    deleteConfirmMessage: 'Bạn sắp xóa 1 tài liệu có tên: "{documentTitle}".',
    deleteWarning: 'Hành động này không thể hoàn tác. Bạn có muốn tiếp tục?'
  }
}

type Language = keyof typeof translations
type TranslationKey = keyof (typeof translations)['en']

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, params?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('en')

  const value = useMemo(() => {
    return {
      lang,
      setLang,
      t: (key: TranslationKey, params?: Record<string, string>) => {
        let text = translations[lang][key]
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            text = text.replace(`{${key}}`, value)
          })
        }
        return text
      }
    } satisfies I18nContextValue
  }, [lang])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
