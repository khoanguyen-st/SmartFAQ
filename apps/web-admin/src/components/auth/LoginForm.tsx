import React, { useState } from "react";
import { Link } from "react-router-dom";

import eyeIcon from "../../assets/icons/eye.svg";
import userIcon from "../../assets/icons/email.svg"; 
import eyeOffIcon from "../../assets/icons/eye-off.svg";
import  ChevronDown  from "../../assets/icons/chevron-down.svg";

interface LoginFormProps {
  onSubmit: (email: string, password: string, campus_id: 'DN' | 'HCM' | 'HN' | 'CT') => Promise<void>;
  error: string | null;
}


const LoginForm = ({ onSubmit, error }: LoginFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [campus_id, setCampus_id] = useState<'DN' | 'HCM' | 'HN' | 'CT'>('HCM');   

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campus_id) {
      return;
    }
    setIsLoading(true);
    try {
      await onSubmit(email, password, campus_id);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
      <label htmlFor="campus" className="block text-sm font-medium text-gray-700 mb-1">
        Campus
      </label>

      <div className="relative">
        <select
          id="campus"
          value={campus_id}
          onChange={(e) => setCampus_id(e.target.value as 'DN' | 'HCM' | 'HN' | 'CT')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg 
                    focus:ring-2 focus:ring-blue-600 focus:border-blue-600 
                    outline-none appearance-none pr-10"   
          required
        >
          <option value="HCM">Hồ Chí Minh</option>
          <option value="DN">Đà Nẵng</option>
          <option value="HN">Hà Nội</option>
          <option value="CT">Cần Thơ</option>
        </select>

        <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
              <img
              src={ChevronDown}
              alt="chevron-down"
              className="w-5 h-5"
      />
      </span>
         </div>
      </div>


      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Email *
        </label>
        <div className="relative">
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none pr-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <span className="absolute inset-y-0 right-3 flex items-center text-gray-400">
            <img src={userIcon} alt="Email" className="w-5 h-5" />
          </span>
        </div>
      </div>

      

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Password *
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none pr-12"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-700"
          >
            <img
              src={showPassword ? eyeOffIcon : eyeIcon}
              alt="Toggle password"
              className="w-5 h-5"
            />
            
          </button>
        </div>

        <div className="flex justify-end mt-1">
          <Link
            to="/forgotpassword"
            className="text-sm text-blue-600 hover:text-blue-800 transition"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
      )}
    <div className="flex justify-center">
      <button
        type="submit"
        disabled={isLoading}
        className="w-50 py-2 bg-[#003087] text-white font-semibold hover:bg-blue-900 rounded-[50px] transition"
      >
        {isLoading ? "Logging in..." : "Login"}
      </button>
      </div>
    </form>
  );
};

export default LoginForm;
