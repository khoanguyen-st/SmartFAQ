import { useState } from 'react'
import userIcon from '../../assets/icons/email.svg'

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>
  error?: string | null
}

const ForgotPasswordForm = ({ onSubmit, error }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const inputId = 'forgot-password-email'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    try {
      setLoading(true)
      await onSubmit(email)
    } catch {
      // Error handling is done by parent component via error prop
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-3xl rounded-2xl bg-white px-24 py-20 shadow-xl transition-all">
      <a href="/login" className="mb-6 flex items-center text-base text-gray-500 hover:text-gray-700">
        <span className="mr-2 text-lg">←</span> Back to login
      </a>

      <h2
        id="forgot-password-title"
        className="mb-3 text-center text-3xl font-bold text-gray-800 md:text-left md:text-4xl"
      >
        Forgot your password?
      </h2>

      <p className="mb-8 text-center text-base text-gray-600 md:text-left md:text-lg">
        Don’t worry! Enter your email below to recover your password
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="forgot-password-title">
        {/* Label sits outside the relative wrapper so the icon centers to the input only */}
        <label htmlFor={inputId} className="mb-2 block text-base font-medium text-gray-700">
          Email address
        </label>
        <div className="relative">
          <input
            id={inputId}
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="h-12 w-full rounded-xl border border-gray-300 px-4 pr-12 text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
            required
            aria-required
            aria-invalid={!!error}
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
            <img src={userIcon} alt="email icon" className="h-5 w-5" />
          </span>
        </div>

        {error && <p className="text-sm text-red-500 md:text-base">{error}</p>}

        <div className="flex justify-center">
          <button
            type="submit"
            className={`rounded-full bg-[#003087] px-8 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
              loading ? 'opacity-80' : 'hover:bg-blue-900'
            }`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default ForgotPasswordForm
