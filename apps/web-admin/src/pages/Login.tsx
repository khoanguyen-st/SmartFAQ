import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '../components/auth/LoginForm'
import logo from '../assets/icons/logo.svg'
import loginGif from '../assets/icons/login-once.gif'
import { login } from '../lib/api'

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleLogin = async (email: string, password: string, campus_id: 'DN' | 'HCM' | 'HN' | 'CT') => {
    setError(null)
    try {
      const response = await login({ email, password, campus_id })
      // Lưu token vào localStorage
      localStorage.setItem('access_token', response.access_token)
      // Redirect đến dashboard
      navigate('/dashboard')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(errorMessage)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <img src={logo} alt="App Logo" className="h-10 w-10 object-contain" />
          <span className="text-2xl font-bold text-gray-800">Greenwich Smart FAQ</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid w-full max-w-[1400px] grid-cols-1 items-center gap-12 md:grid-cols-2">
          <div className="mx-auto flex h-auto w-full max-w-[658px] flex-col justify-center rounded-xl bg-white p-8 shadow-2xl md:h-[610px] md:p-12">
            <h1 className="mb-2 text-center text-3xl font-bold text-gray-900 md:text-left">Welcome back!</h1>
            <p className="mb-8 text-center text-gray-600 md:text-left">Welcome back! Please enter your details.</p>
            <LoginForm onSubmit={handleLogin} error={error} />
          </div>

          <div className="order-first flex items-center justify-center md:order-last">
            <img
              src={loginGif}
              alt="Login Illustration"
              className="h-auto w-[80%] max-w-[600px] drop-shadow-2xl transition-all duration-300 md:w-[90%]"
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default LoginPage
