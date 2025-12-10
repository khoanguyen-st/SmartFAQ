import { useEffect, useState, useRef } from 'react'
import { API_BASE_URL } from '@/lib/api'

interface FAQItem {
  id: string
  question: string
  category: string
  count: number
}

interface FAQSuggestionsProps {
  onQuestionClick: (question: string) => void
  language?: string
}

// Cache FAQs globally to avoid re-fetching
const faqCache: Map<string, { faqs: FAQItem[]; timestamp: number }> = new Map()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const FAQSuggestions = ({ onQuestionClick, language = 'vi' }: FAQSuggestionsProps) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [_isLoading, setIsLoading] = useState(true)
  const isFetchingRef = useRef(false)

  useEffect(() => {
    const fetchFAQs = async () => {
      // Prevent duplicate calls
      if (isFetchingRef.current) return

      // Check cache first
      const cacheKey = `faqs_${language}`
      const cached = faqCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setFaqs(cached.faqs)
        setIsLoading(false)
        return
      }

      isFetchingRef.current = true

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat/faqs/suggestions?language=${language}&limit=5`)
        const data = await response.json()
        const faqList = data.faqs || []

        // Update cache
        faqCache.set(cacheKey, { faqs: faqList, timestamp: Date.now() })
        setFaqs(faqList)
      } finally {
        setIsLoading(false)
        isFetchingRef.current = false
      }
    }

    fetchFAQs()
  }, [language])

  return (
    <div className="px-4 py-3">
      <div className="space-y-2">
        {faqs.map(faq => (
          <button
            key={faq.id}
            onClick={() => onQuestionClick(faq.question)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-left text-sm text-slate-700 transition-all hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-900 active:scale-98"
          >
            {faq.question}
          </button>
        ))}
      </div>
    </div>
  )
}

export default FAQSuggestions
