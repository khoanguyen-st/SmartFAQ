import { fetchSystemSettings, SettingsUpdateRequest, SystemSettings, updateSystemSettings } from '@/lib/api'
import { AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff, Info, Loader2, Save } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

const GEMINI_MODELS = [
  { value: 'gemma-3-27b-it', label: 'Gemma 2 27B' },
  { value: 'gemma-3-9b-it', label: 'Gemma 2 9B' },
  { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
  { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
  { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }
]

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
        <Loader2 className="h-8 w-8 animate-spin text-[#003087]" />
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

  // Helper check for Google AI
  const isGoogleAI = settings.llm_model.includes('gemini') || settings.llm_model.includes('gemma')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* AI Model Selection Section */}
      <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-[#3575f9] to-[#003087] p-6 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 shrink-0 text-slate-100" />
                <h3 className="text-lg font-semibold text-slate-100">AI Model Selection</h3>
              </div>
              <p className="mb-4 mt-1 text-base text-slate-200">
                Choose between Google AI (Gemini/Gemma via API) or Local AI (self-hosted model)
              </p>
            </div>

            <div className="flex gap-3">
              {/* Google AI Button */}
              <button
                type="button"
                onClick={() => updateSetting('llm_model', GEMINI_MODELS[0].value)}
                className={`flex-1 rounded-xl border-2 p-4 text-left transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98] ${
                  isGoogleAI
                    ? 'border-blue-600 bg-white shadow-md ring-1 ring-blue-600/20'
                    : 'border-blue-400 bg-white/50 hover:border-blue-400'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                      isGoogleAI ? 'bg-emerald-600 shadow-[0_0_8px_#2563eb]' : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">Google AI</span>
                </div>
                <p className="text-xs text-slate-600">Gemini & Gemma models</p>
                <p className="mt-1 font-mono text-xs text-slate-500">
                  {GEMINI_MODELS.find(m => m.value === settings.llm_model)?.label || 'Select model'}
                </p>
              </button>

              {/* Local AI Button */}
              <button
                type="button"
                onClick={() => updateSetting('llm_model', 'llama-3.2-3b-instruct')}
                className={`flex-1 rounded-xl border-2 p-4 text-left transition-all duration-200 ease-in-out hover:scale-[1.02] active:scale-[0.98] ${
                  !isGoogleAI
                    ? 'border-blue-600 bg-white shadow-md ring-1 ring-blue-600/20'
                    : 'border-blue-200 bg-white/50 hover:border-blue-400'
                }`}
              >
                <div className="mb-1 flex items-center gap-2">
                  <div
                    className={`h-3 w-3 rounded-full transition-colors duration-300 ${
                      !isGoogleAI ? 'bg-emerald-600 shadow-[0_0_8px_#2563eb]' : 'bg-slate-300'
                    }`}
                  />
                  <span className="font-semibold text-slate-900">Local AI</span>
                </div>
                <p className="text-xs text-slate-600">Self-hosted AI model</p>
                <p className="mt-1 font-mono text-xs text-slate-500">llama-3.2-3b-instruct</p>
              </button>
            </div>

            {/* Transition Wrapper for Google AI Settings */}
            <div
              className={`grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isGoogleAI ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`flex flex-col gap-4 transition-all duration-500 ease-in-out ${
                    isGoogleAI ? 'translate-y-0 opacity-100 pt-4' : '-translate-y-4 opacity-0 pt-0'
                  }`}
                >
                  {/* Select Model */}
                  <div className="rounded-xl border-2 border-blue-400 bg-white p-4 shadow-xs">
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      Select Model <span className="ml-1 text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={settings.llm_model}
                        onChange={e => updateSetting('llm_model', e.target.value)}
                        className="w-full my-2 appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                      >
                        {GEMINI_MODELS.map(model => (
                          <option key={model.value} value={model.value}>
                            {model.label}
                          </option>
                        ))}
                      </select>
                      {/* Custom Arrow Icon */}
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-slate-600">
                      <strong>Tip:</strong> Gemini 1.5 Flash is recommended for most use cases.
                    </p>
                  </div>

                  {/* API Key Input */}
                  <div className="rounded-xl border-2 border-blue-400 bg-white p-4 shadow-xs">
                    <label className="mb-2 block text-sm font-medium text-slate-900">
                      Google API Key <span className="ml-1 text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={settings.google_api_key}
                      placeholder="Enter your Google API Key (AIza...)"
                      className="w-full my-2 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                      onChange={e => updateSetting('google_api_key', e.target.value)}
                    />
                    <p className="mt-2 text-xs text-slate-600">
                      <strong>Note:</strong> Get your key from{' '}
                      <a
                        href="https://makersuite.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-blue-600 underline decoration-blue-600/30 underline-offset-2 transition-colors hover:text-blue-700 hover:decoration-blue-700"
                      >
                        Google AI Studio
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-blue-100 bg-white p-4 transition-colors duration-300">
              <p className="flex items-center gap-2 text-xs text-blue-900">
                <strong>Current:</strong>
                <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-blue-900">
                  {settings.llm_model}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Settings by Category (Giữ nguyên logic grid-rows đã tốt của bạn) */}
      {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
        const categoryFields = SETTING_FIELDS.filter(f => f.category === categoryKey)
        const isExpanded = expandedCategory === categoryKey

        return (
          <div
            key={categoryKey}
            className="overflow-hidden rounded-2xl border-t border-slate-100 bg-white shadow-lg shadow-slate-900/10 transition-all duration-200 ease-in-out"
          >
            <button
              type="button"
              onClick={() => setExpandedCategory(isExpanded ? null : categoryKey)}
              className="flex w-full items-center justify-between bg-white p-6 transition-colors hover:bg-slate-100"
            >
              <h3 className="text-lg font-semibold text-slate-900">{categoryInfo.title}</h3>
              {/* Thêm transition rotate cho icon */}
              <span
                className={`text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              >
                <ChevronDown className="h-5 w-5" />
              </span>
            </button>

            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
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
                            <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-[#003087] peer-focus:ring-2 peer-focus:ring-[#004ddb] peer-focus:outline-none after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white rtl:peer-checked:after:-translate-x-full"></div>
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
                              placeholder="Enter value"
                              className="flex-1 rounded-xl border border-blue-400 px-3 py-2 font-mono text-sm focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/20 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="rounded-xl border border-slate-300 bg-white p-2 hover:bg-slate-50"
                              title={showApiKey ? 'Hide' : 'Show'}
                            >
                              {showApiKey ? (
                                <Eye className="h-4 w-4 text-slate-600" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-slate-600" />
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
                              className="h-2 flex-1 cursor-pointer appearance-none rounded-xl bg-gray-200 accent-[#003087]"
                            />
                            <input
                              type="number"
                              min={field.min}
                              max={field.max}
                              step={field.step}
                              value={settings[field.key] as number}
                              onChange={e => updateSetting(field.key, parseFloat(e.target.value))}
                              className="w-24 rounded-xl border border-blue-400 px-3 py-2 text-sm focus:border-[#004ad4] focus:ring-1 focus:ring-[#003087]/20 focus:outline-none"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>{field.helpText}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleReset}
          disabled={saving}
          className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-all duration-150 ease-in-out hover:scale-102 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[#003087] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-150 ease-in-out hover:scale-102 hover:bg-[#00369b] disabled:cursor-not-allowed disabled:opacity-50"
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