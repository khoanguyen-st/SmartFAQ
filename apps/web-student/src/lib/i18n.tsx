import { ReactNode, createContext, useContext, useMemo, useState } from 'react'

const translations = {
  en: {
    welcome: 'Welcome to Greenwich SmartFAQ',
    prompt: 'Ask me anything about Greenwich University',
    feedback: 'Was this helpful?',
    getHelp: 'Get Help from Student Affairs Department',
    copy: 'Copy',
    copied: 'Copied!',
    helpful: 'Helpful',
    notHelpful: 'Not helpful',
    errorFetch: 'Unable to synchronize chat history.',
    errorSend: 'Failed to send message. Please try again.',
    errorConnect: 'Cannot connect to chat service.'
  },
  vi: {
    welcome: 'Chào mừng đến với Greenwich SmartFAQ',
    prompt: 'Hãy hỏi bất cứ điều gì về Greenwich University',
    feedback: 'Câu trả lời có hữu ích không?',
    getHelp: 'Liên hệ Phòng Công tác Sinh viên',
    copy: 'Sao chép',
    copied: 'Đã sao chép!',
    helpful: 'Hữu ích',
    notHelpful: 'Không hữu ích',
    errorFetch: 'Không thể đồng bộ lịch sử chat.',
    errorSend: 'Gửi tin nhắn thất bại. Vui lòng thử lại.',
    errorConnect: 'Không thể kết nối đến dịch vụ chat.'
  }
}

type Language = keyof typeof translations
type TranslationKey = keyof (typeof translations)['en']

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined)

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Language>('en')

  const value = useMemo(() => {
    return {
      lang,
      setLang,
      t: (key: TranslationKey) => translations[lang][key]
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

export const availableLanguages: Language[] = ['en', 'vi']
