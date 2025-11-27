// import ForgotPasswordForm from "../components/auth/ForgotpasswordForm";
// import logo from "../assets/icons/logo.svg";
// import Forgotpassgif from "../assets/icons/forgot.gif";

// const ForgotPassword = () => {
//   const handleForgotPassword = async (email: string) => {
//     console.log("Email to reset request:", email);
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex flex-col">
//       {/* Header */}
//       <header className="p-6">
//         <div className="flex items-center space-x-3">
//             <img src={logo} alt="App Logo" className="w-10 h-10 object-contain" />
//           <span className="text-2xl font-bold text-gray-800">
//             Greenwich Smart FAQ
//           </span>
//         </div>
//       </header>

//       {/* Main layout */}
//       <main className="flex flex-col-reverse md:flex-row items-center justify-center flex-1 px-6 md:px-20 gap-12 md:gap-20">
//         {/* Left side: Form */}
//         <div className="flex-1 flex justify-center min-h-[600px]">
//           <ForgotPasswordForm onSubmit={handleForgotPassword} />
//         </div>

//         {/* Right side: Illustration */}
//         <div className="flex-1 flex justify-center min-h-[600px]">
//           <img
//             src={Forgotpassgif}
//             alt="Forgot password illustration"
//             className="w-72 sm:w-96 md:w-[500px] lg:w-[600px] object-contain"
//           />
//         </div>
//       </main>
//     </div>
//   );
// };

// export default ForgotPassword;

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import ForgotPasswordForm from '../components/auth/ForgotpasswordForm'
import logo from '../assets/icons/logo.svg'
import Forgotpassgif from '../assets/icons/forgot.gif'
import Forgotpassimg from '../assets/icons/Forgotpassimg.svg'
import { forgotPassword } from '../lib/api'

const ForgotPassword = () => {
  const [showStaticImage, setShowStaticImage] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Đợi GIF load và chạy xong
    const timer = setTimeout(() => {
      setShowStaticImage(true)
    }, 3000) // Điều chỉnh thời gian này theo độ dài thực tế của GIF (tính bằng milliseconds)

    return () => clearTimeout(timer)
  }, [])

  const handleForgotPassword = async (email: string) => {
    setError(null)
    try {
      const response = await forgotPassword(email)
      // Lưu reset_token vào localStorage để dùng ở trang reset password
      localStorage.setItem('reset_token', response.reset_token)
      // Redirect đến trang create new password
      navigate('/create-new-password')
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
          <ForgotPasswordForm onSubmit={handleForgotPassword} error={error} />
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
