import { useState, FC } from 'react'
import eyeIcon from '../../assets/icons/eye.svg'
import eyeOffIcon from '../../assets/icons/eye-off.svg'

interface CreateNewPasswordFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>
  error?: string | null
}

const PasswordField: FC<{
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggleShow: () => void
  placeholder?: string
}> = ({ id, label, value, onChange, show, onToggleShow, placeholder }) => {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-700 md:text-base">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          minLength={8}
          required
          className="h-12 w-full rounded-xl border border-gray-300 px-4 pr-12 text-base focus:ring-2 focus:ring-blue-600 focus:outline-none"
          aria-required="true"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-gray-400 hover:text-gray-700"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          <img src={show ? eyeOffIcon : eyeIcon} alt="" className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

const CreateNewPasswordForm: FC<CreateNewPasswordFormProps> = ({ onSubmit, error }) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8 || confirmPassword.length < 8) return
    if (password !== confirmPassword) return
    setIsLoading(true)
    try {
      await onSubmit(password, confirmPassword)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          position: absolute;
          right: 0;
        }
      `}</style>
      <div className="w-full max-w-2xl rounded-3xl bg-white p-9 shadow-xl transition-all sm:max-w-xl md:max-w-2xl">
        <h2 className="mb-3 text-center text-3xl font-bold text-gray-800 md:text-left md:text-4xl">
          Create new password
        </h2>

        <p className="mb-8 text-center text-sm text-gray-600 md:text-left md:text-base">
          Your previous password has been reset. Please set a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <PasswordField
            id="new-password"
            label="New password *"
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggleShow={() => setShowPassword(s => !s)}
            placeholder="Enter your new password"
          />

          <PasswordField
            id="confirm-password"
            label="Confirm new password *"
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(s => !s)}
            placeholder="Confirm your new password"
          />

          {password && confirmPassword && password !== confirmPassword && (
            <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
          )}

          {error && <p className="text-sm text-red-500 md:text-base">{error}</p>}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 8}
              className={`min-w-[220px] rounded-full bg-[#003087] px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 md:min-w-[260px] ${
                isLoading ? 'opacity-80' : 'hover:bg-blue-900'
              }`}
              aria-busy={isLoading}
            >
              {isLoading ? 'Creating...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

export default CreateNewPasswordForm
