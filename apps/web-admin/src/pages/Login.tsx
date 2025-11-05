import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import loginImage from "../assets/icons/login-image.png";
import logo from "../assets/icons/logo.svg";

// Định nghĩa kiểu cho props của LoginForm nếu chưa có

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    if (password === "123456") {
      setError("Mật khẩu không đúng!");
      return;
    }
    console.log("Đăng nhập:", email, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-800">
            <img
              src={logo}
              alt="Logo"
              className="w-5 h-4.5 object-contain"
            />
          </div>
          <span className="text-xl font-bold text-gray-800">
            Greenwich Smart FAQ
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="grid max-w-6xl w-full grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Form */}
          <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back!
            </h1>
            <p className="text-gray-600 mb-8">
              Welcome back! Please enter your details.
            </p>
            <LoginForm onSubmit={handleLogin} error={error} />
          </div>

          {/* Image */}
          <div className="hidden md:flex justify-center items-center">
            <img
              src={loginImage}
              alt="Login illustration"
              className="w-4/5 h-auto object-contain"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
