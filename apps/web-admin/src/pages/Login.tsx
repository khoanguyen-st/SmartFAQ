import React, { useState } from "react";
import LoginForm from "../components/auth/LoginForm";
import loginImage from "../assets/icons/login-image.png";
import logo from "../assets/icons/logo.svg";

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (email: string, password: string) => {
    if (password === "123456") {
      setError("Incorrect password!");
      return;
    }
    console.log("Login attempt:", email, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-800 flex items-center justify-center">
            <img
              src={logo}
              alt="App Logo"
              className="w-5 h-5 object-contain"
            />
          </div>
          <span className="text-xl font-bold text-gray-800">
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
              Please enter your credentials to continue.
            </p>
            <LoginForm onSubmit={handleLogin} error={error} />
          </div>

          <div className="flex justify-center items-center order-first md:order-last">
            <img
              src={loginImage}
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
