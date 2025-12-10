import { useNavigate } from 'react-router-dom'
import logo from '../assets/icons/logo.svg'
import successGif from '../assets/icons/success-once.gif'

const ResetPasswordSuccess = () => {
  const navigate = useNavigate()

  const handleBackToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="App Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold text-gray-800">Greenwich Smart FAQ</span>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          <div className="w-full overflow-hidden rounded-xl">
            <img src={successGif} alt="Reset password success illustration" className="h-auto w-full object-contain" />
          </div>
        </div>

        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800 md:text-4xl lg:text-5xl">Reset password successfully.</h1>
          <p className="mx-auto max-w-xl text-base text-gray-600 md:text-lg lg:text-xl">
            Your password has been successfully reset. Please log in again.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={handleBackToLogin}
            className="rounded-full bg-[#003087] px-8 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            Back to login
          </button>
        </div>
      </main>
    </div>
  )
}

export default ResetPasswordSuccess
