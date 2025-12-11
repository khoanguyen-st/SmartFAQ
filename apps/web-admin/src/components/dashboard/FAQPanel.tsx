import { useEffect, useState } from 'react'
import { MessageSquare, TrendingUp, Loader2, AlertCircle } from 'lucide-react'
import { API_BASE_URL } from '../../lib/api'

interface FAQItem {
  id: string
  question: string
  category: string
  count: number
}

interface FAQPanelProps {
  refreshKey?: number
}

const FAQPanel = ({ refreshKey = 0 }: FAQPanelProps) => {
  const [faqs, setFaqs] = useState<FAQItem[]>([])
  const [trending, setTrending] = useState<FAQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'popular' | 'trending'>('popular')

  useEffect(() => {
    const fetchFAQs = async () => {
      setLoading(true)
      setError(null)

      try {
        const [faqsData, trendingData] = await Promise.all([
          fetch(`${API_BASE_URL}/api/chat/faqs?language=vi&limit=10`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/chat/faqs/trending?language=vi&limit=5&hours=24`).then(r => r.json())
        ])

        setFaqs(faqsData.faqs || [])
        setTrending(trendingData.faqs || [])
      } catch (err) {
        console.error('Failed to fetch FAQs:', err)
        setError(err instanceof Error ? err.message : 'Failed to load FAQ data')
      } finally {
        setLoading(false)
      }
    }

    fetchFAQs()
  }, [refreshKey])

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      tuition: 'bg-blue-100 text-blue-700',
      scholarship: 'bg-green-100 text-green-700',
      programs: 'bg-purple-100 text-purple-700',
      admission: 'bg-orange-100 text-orange-700',
      facilities: 'bg-pink-100 text-pink-700',
      trending: 'bg-red-100 text-red-700',
      general: 'bg-gray-100 text-gray-700'
    }
    return colors[category] || colors.general
  }

  const displayFaqs = activeTab === 'popular' ? faqs : trending

  return (
    <div className="rounded-2xl bg-white p-6 shadow-lg shadow-slate-900/10 border border-slate-100">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Frequently Asked Questions</h3>
          <p className="text-sm text-slate-600">
            {activeTab === 'popular' ? 'Most common questions (last 30 days)' : 'Trending questions (last 24 hours)'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 rounded-lg bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab('popular')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'popular' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Popular
          </button>
          <button
            onClick={() => setActiveTab('trending')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === 'trending' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            Trending
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <AlertCircle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-slate-600">{error}</p>
        </div>
      ) : displayFaqs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12">
          <MessageSquare className="h-8 w-8 text-slate-400" />
          <p className="text-sm text-slate-600">
            {activeTab === 'popular'
              ? 'No FAQ data yet. FAQs will appear as users ask questions.'
              : 'No trending questions in the last 24 hours.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayFaqs.map((faq, index) => (
            <div
              key={faq.id}
              className="group rounded-lg border border-slate-200 bg-slate-50 p-4 transition-all hover:border-blue-300 hover:bg-blue-50"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 group-hover:text-blue-900">{faq.question}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getCategoryColor(faq.category)}`}
                    >
                      {faq.category}
                    </span>
                    <span className="text-xs text-slate-500">Asked {faq.count} times</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer Stats */}
      {!loading && !error && displayFaqs.length > 0 && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
          <p className="text-sm text-slate-600">
            Showing {displayFaqs.length} {activeTab === 'popular' ? 'popular' : 'trending'} questions
          </p>
          <p className="text-xs text-slate-500">
            {activeTab === 'popular' ? 'Updated based on user queries' : 'Last 24 hours'}
          </p>
        </div>
      )}
    </div>
  )
}

export default FAQPanel
