import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CreateNewPasswordForm from '../components/auth/CreatenewpasswordForm'
import logo from '../assets/icons/logo.svg'
import Creategif from '../assets/icons/create.gif'
import { resetPassword, verifyResetToken } from '../lib/api'

const CreateNewPassword = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(true)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get('token')
      if (!token) {
        setError('Reset token not found. Please request a new password reset.')
        setIsValidating(false)
        return
      }
      try {
        const result = await verifyResetToken(token)
        if (result.valid) {
          setResetToken(token)
          setIsValid(true)
          localStorage.setItem('reset_token', token)
        } else {
          setError('Invalid or expired reset token. Please request a new password reset.')
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Invalid or expired reset token. Please request a new password reset.'
        setError(errorMessage)
        setTimeout(() => {
          navigate('/forgotpassword')
        }, 3000)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [searchParams, navigate])

  const handleCreateNewPassword = async (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!resetToken) {
      setError('Reset token not found. Please request a new password reset.')
      return
    }

    setError(null)

    try {
      await resetPassword(resetToken, password)
      localStorage.removeItem('reset_token')
      navigate('/reset-password-success')
    } catch (err) {
      // Kiểm tra nếu lỗi là 401 (InvalidTokenError) - token đã dùng hoặc hết hạn
      const errorWithStatus = err as Error & { status?: number }
      if (errorWithStatus.status === 401) {
        // Token invalid/expired/used - hiển thị "Invalid Reset Link" page
        setIsValid(false)
        setError('Invalid or expired reset token. Please request a new password reset.')
        return
      }
      // Các lỗi khác (400 - weak password, same password) hiển thị trên form
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. Please try again.'
      setError(errorMessage)
    }
  }

  // Hiển thị loading khi đang validate token
  if (isValidating) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-lg text-gray-600">Validating reset token...</div>
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        </div>
      </div>
    )
  }

  // Hiển thị error nếu token không hợp lệ (chỉ khi !isValid, không phải lỗi validation)
  if (!isValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-white p-8 shadow-md">
          <div className="mb-4 text-center">
            <div className="mb-2 text-xl font-bold text-red-600">Invalid Reset Link</div>
            <div className="text-gray-600">{error || 'This reset link is invalid or has expired.'}</div>
          </div>
          <button
            onClick={() => navigate('/forgotpassword')}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    )
  }

  // Chỉ hiển thị form nếu token hợp lệ
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="App Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold text-gray-800">Greenwich Smart FAQ</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col-reverse items-center justify-center gap-12 px-6 md:flex-row md:gap-20 md:px-20">
        <div className="flex flex-1 justify-center">
          <CreateNewPasswordForm onSubmit={handleCreateNewPassword} error={error} />
        </div>

        <div className="flex flex-1 justify-center">
          <img
            src={Creategif}
            alt="Create new password illustration"
            className="w-72 object-contain sm:w-96 md:w-[500px] lg:w-[600px]"
            style={{ transform: `rotateY(180deg)` }}
          />
        </div>
      </main>
    </div>
  )
}

export default CreateNewPassword
