import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import logo from "../assets/icons/logo.svg";
import loginGif from "../assets/icons/login.gif";
import { login } from "../lib/api";

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string, campus_id: 'DN' | 'HCM' | 'HN' | 'CT') => {
    setError(null);
    try {
      const response = await login({ email, password, campus_id });
      // Lưu token vào localStorage
      localStorage.setItem('access_token', response.access_token);
      // Redirect đến dashboard
      navigate('/dashboard');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="p-6">
        <div className="flex items-center space-x-3">
            <img src={logo} alt="App Logo" className="w-10 h-10 object-contain" />          
          <span className="text-2xl font-bold text-gray-800">
            Greenwich Smart FAQ
          </span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[1400px] grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="bg-white w-full max-w-[658px] h-auto md:h-[610px] p-8 md:p-12 rounded-xl shadow-2xl mx-auto flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">
              Welcome back!
            </h1>
            <p className="text-gray-600 mb-8 text-center md:text-left">
              Welcome back! Please enter your details.
            </p>
            <LoginForm onSubmit={handleLogin} error={error} />
          </div>

          <div className="flex justify-center items-center order-first md:order-last">
            <img
              src={loginGif}
              alt="Login Illustration"
              className="w-[80%] md:w-[90%] max-w-[600px] h-auto drop-shadow-2xl transition-all duration-300"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
