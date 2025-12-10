import { fetchSystemSettings, SettingsUpdateRequest, SystemSettings, updateSystemSettings } from '@/lib/api'
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

interface SettingField {
  key: keyof SystemSettings
  label: string
  type: 'number' | 'boolean' | 'text' | 'password'
  min?: number
  max?: number
  step?: number
  description: string
  helpText: string
  category: 'llm' | 'retrieval' | 'hybrid'
}

const SETTING_FIELDS: SettingField[] = [
  // LLM Settings
  {
    key: 'google_api_key',
    label: 'Google API Key',
    type: 'password',
    description: 'API key for Google Gemini',
    helpText: 'Your Google API key for accessing Gemini AI models. Get one from https://aistudio.google.com/app/apikey',
    category: 'llm'
  },
  {
    key: 'llm_temperature',
    label: 'AI Creativity',
    type: 'number',
    min: 0,
    max: 2,
    step: 0.1,
    description: 'Controls how creative the AI responses are',
    helpText:
      'Lower values (0-0.3) = More focused and consistent. Higher values (0.7-2.0) = More creative but less predictable.',
    category: 'llm'
  },
  {
    key: 'llm_max_tokens',
    label: 'Maximum Response Length',
    type: 'number',
    min: 128,
    max: 8192,
    step: 128,
    description: 'Maximum number of words in AI responses',
    helpText: 'Controls how long the answers can be. 512 tokens ≈ 380 words. Longer responses cost more.',
    category: 'llm'
  },

  // Retrieval Settings
  {
    key: 'confidence_threshold',
    label: 'Answer Confidence Threshold',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.05,
    description: 'Minimum confidence level to show an answer',
    helpText:
      'If AI confidence is below this threshold, a fallback message is shown instead. Higher = stricter (fewer answers, but more accurate).',
    category: 'retrieval'
  },
  {
    key: 'top_k_retrieval',
    label: 'Documents to Consider',
    type: 'number',
    min: 1,
    max: 20,
    step: 1,
    description: 'How many documents to search through',
    helpText:
      'The system will look through this many documents to find the best answer. More documents = better context but slower.',
    category: 'retrieval'
  },
  {
    key: 'max_context_chars',
    label: 'Maximum Context Size',
    type: 'number',
    min: 1000,
    max: 32000,
    step: 1000,
    description: 'Maximum amount of text to give to the AI',
    helpText: 'Controls how much information the AI can read before answering. 8000 characters ≈ 1500 words.',
    category: 'retrieval'
  },

  // Hybrid Search Settings
  {
    key: 'hybrid_enabled',
    label: 'Smart Search (Hybrid)',
    type: 'boolean',
    description: 'Use both keyword and AI-powered search',
    helpText:
      'When enabled, the system uses both traditional keyword search and AI semantic search for better results.',
    category: 'hybrid'
  },
  {
    key: 'hybrid_k_vec',
    label: 'AI Search Results',
    type: 'number',
    min: 5,
    max: 50,
    step: 5,
    description: 'Number of AI semantic search results',
    helpText: 'How many results to get from AI-powered similarity search. Only applies when Smart Search is enabled.',
    category: 'hybrid'
  },
  {
    key: 'hybrid_k_lex',
    label: 'Keyword Search Results',
    type: 'number',
    min: 5,
    max: 50,
    step: 5,
    description: 'Number of keyword search results',
    helpText: 'How many results to get from traditional keyword matching. Only applies when Smart Search is enabled.',
    category: 'hybrid'
  }
]

const SettingsForm = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [expandedCategory, setExpandedCategory] = useState<string | null>('llm')
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchSystemSettings()
      setSettings(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!settings) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      const updateData: SettingsUpdateRequest = {
        llm_model: settings.llm_model,
        google_api_key: settings.google_api_key,
        llm_temperature: settings.llm_temperature,
        llm_max_tokens: settings.llm_max_tokens,
        confidence_threshold: settings.confidence_threshold,
        top_k_retrieval: settings.top_k_retrieval,
        max_context_chars: settings.max_context_chars,
        hybrid_enabled: settings.hybrid_enabled,
        hybrid_k_vec: settings.hybrid_k_vec,
        hybrid_k_lex: settings.hybrid_k_lex
      }

      const response = await updateSystemSettings(updateData)
      setSettings(response.updated_settings)
      setSuccess(response.message)

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    loadSettings()
    setSuccess(null)
    setError(null)
  }

  const updateSetting = (key: keyof SystemSettings, value: unknown) => {
    if (!settings) return
    setSettings({ ...settings, [key]: value })
    setSuccess(null)
    setError(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-white p-12 shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-lg">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <p>Failed to load settings. Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  const categories = {
    llm: { title: 'AI Model Settings' },
    retrieval: { title: 'Search & Retrieval' },
    hybrid: { title: 'Advanced Search' }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* AI Model Selection */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />
          <div className="flex-1">
            <h3 className="mb-2 font-semibold text-slate-900">AI Model Selection</h3>
            <p className="mb-4 text-xs text-slate-600">
              Choose between Google Gemini (cloud-based) or Local AI (self-hosted) model
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => updateSetting('llm_model', 'gemini-2.5-flash')}
                className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                  settings.llm_model.includes('gemini')
                    ? 'border-indigo-600 bg-white shadow-md'
                    : 'border-indigo-200 bg-white/50 hover:border-indigo-400'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      settings.llm_model.includes('gemini') ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">Google Gemini</span>
                </div>
                <p className="text-xs text-slate-600">Cloud-based AI model</p>
                <p className="mt-1 font-mono text-xs text-slate-500">gemini-2.5-flash</p>
              </button>

              <button
                type="button"
                onClick={() => updateSetting('llm_model', 'llama-3.2-3b-instruct')}
                className={`flex-1 rounded-lg border-2 p-4 text-left transition-all ${
                  settings.llm_model.includes('llama') || settings.llm_model.includes('local')
                    ? 'border-indigo-600 bg-white shadow-md'
                    : 'border-indigo-200 bg-white/50 hover:border-indigo-400'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full ${
                      settings.llm_model.includes('llama') || settings.llm_model.includes('local')
                        ? 'bg-indigo-600'
                        : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">Local AI</span>
                </div>
                <p className="text-xs text-slate-600">Self-hosted AI model</p>
                <p className="mt-1 font-mono text-xs text-slate-500">llama-3.2-3b-instruct</p>
              </button>
            </div>

            {/* Google API Key Input - Only shown when Gemini is selected */}
            {settings.llm_model.includes('gemini') && (
              <div className="mt-4 rounded-lg border-2 border-indigo-200 bg-white p-4">
                <label className="mb-2 block text-sm font-medium text-slate-900">
                  Google API Key
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={settings.google_api_key}
                  placeholder="Enter your Google API Key (AIza...)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
                  onChange={e => updateSetting('google_api_key', e.target.value)}
                />
                <p className="mt-2 text-xs text-slate-600">
                  <strong>Note:</strong> Your API key is required to use Google Gemini. Get your key from{' '}
                  <a
                    href="https://makersuite.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 underline hover:text-indigo-700"
                  >
                    Google AI Studio
                  </a>
                </p>
              </div>
            )}

            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Current:</strong> <span className="font-mono">{settings.llm_model}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings by Category */}
      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const categoryFields = SETTING_FIELDS.filter(f => f.category === categoryKey)
        const isExpanded = expandedCategory === categoryKey

        return (
          <div key={categoryKey} className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-slate-900/10">
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
              className="flex w-full items-center justify-between p-6 transition-colors hover:bg-slate-50"
            >
              <h3 className="text-lg font-semibold text-slate-900">{categoryInfo.title}</h3>
              <span className="text-slate-400">{isExpanded ? '−' : '+'}</span>
            </button>

            {isExpanded && (
              <div className="space-y-6 border-t border-slate-100 p-6">
                {categoryFields.map(field => (
                  <div key={field.key} className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      {field.label}
                      <span className="text-xs font-normal text-slate-500">({field.description})</span>
                    </label>

                    <div className="flex items-start gap-3">
                      {field.type === 'boolean' ? (
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={settings[field.key] as boolean}
                            onChange={e => updateSetting(field.key, e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-indigo-600 peer-focus:ring-4 peer-focus:ring-indigo-300 peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
                          <span className="ms-3 text-sm font-medium text-gray-900">
                            {settings[field.key] ? 'Enabled' : 'Disabled'}
                          </span>
                        </label>
                      ) : field.type === 'password' ? (
                        <div className="flex flex-1 items-center gap-2">
                          <input
                            type={showApiKey ? 'text' : 'password'}
                            value={settings[field.key] as string}
                            onChange={e => updateSetting(field.key, e.target.value)}
                            placeholder="Enter your Google API key"
                            className="flex-1 rounded-lg border border-indigo-200 px-3 py-2 font-mono text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="rounded-lg border border-slate-300 bg-white p-2 hover:bg-slate-50"
                            title={showApiKey ? 'Hide API key' : 'Show API key'}
                          >
                            {showApiKey ? (
                              <EyeOff className="h-4 w-4 text-slate-600" />
                            ) : (
                              <Eye className="h-4 w-4 text-slate-600" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-1 items-center gap-3">
                          <input
                            type="range"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={settings[field.key] as number}
                            onChange={e => updateSetting(field.key, parseFloat(e.target.value))}
                            className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-indigo-600"
                          />
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={settings[field.key] as number}
                            onChange={e => updateSetting(field.key, parseFloat(e.target.value))}
                            className="w-24 rounded-lg border border-indigo-200 px-3 py-2 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <p>{field.helpText}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Settings
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default SettingsForm
