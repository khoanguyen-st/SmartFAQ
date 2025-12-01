import { useState, useEffect, useRef } from 'react'
import ForgotPasswordForm from '../components/auth/ForgotpasswordForm'
import logo from '../assets/icons/logo.svg'
import Forgotpassgif from '../assets/icons/forgot.gif'
import Forgotpassimg from '../assets/icons/Forgotpassimg.svg'
import { forgotPassword } from '../lib/api'

const ForgotPassword = () => {
  const [showStaticImage, setShowStaticImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    // Đợi GIF load và chạy xong
    const timer = setTimeout(() => {
      setShowStaticImage(true)
    }, 3000) // Điều chỉnh thời gian này theo độ dài thực tế của GIF (tính bằng milliseconds)

    return () => clearTimeout(timer)
  }, [])

  const handleForgotPassword = async (email: string) => {
    setError(null)
    setSuccess(null)
    try {
      const response = await forgotPassword(email)
      // Hiển thị success message thay vì redirect
      setSuccess(response.message || 'A password reset link has been sent to your registered email.')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send reset email. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="App Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold text-gray-800">Greenwich Smart FAQ</span>
        </div>
      </header>

      {/* Main layout */}
      <main className="flex flex-1 flex-col-reverse items-center justify-center gap-12 px-6 md:flex-row md:gap-20 md:px-20">
        {/* Left side: Form */}
        <div className="flex min-h-[600px] flex-1 justify-center">
          <ForgotPasswordForm onSubmit={handleForgotPassword} error={error} success={success} />
        </div>

        {/* Right side: Illustration */}
        <div className="flex min-h-[600px] flex-1 justify-center">
          {!showStaticImage ? (
            <img
              ref={imgRef}
              src={Forgotpassgif}
              alt="Forgot password illustration"
              className="w-72 object-contain sm:w-96 md:w-[500px] lg:w-[600px]"
            />
          ) : (
            <img
              src={Forgotpassimg}
              alt="Forgot password illustration"
              className="w-72 object-contain sm:w-96 md:w-[500px] lg:w-[600px]"
            />
          )}
        </div>
      </main>
    </div>
  )
}

export default ForgotPassword
