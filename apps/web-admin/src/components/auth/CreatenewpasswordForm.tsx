import { useState } from "react";
import eyeIcon from "../../assets/icons/eye.svg";

interface CreateNewPasswordFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
  error?: string | null;
}

const CreateNewPasswordForm = ({
  onSubmit,
  error,
}: CreateNewPasswordFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return;
    }
    
    setIsLoading(true);
    try {
      await onSubmit(password, confirmPassword);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl transition-all">

      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 text-center md:text-left">
        Create New Password
      </h2>

      <p className="text-gray-600 text-base md:text-lg mb-8 text-center md:text-left">
       Your previous password has been reseted. Please set a new password for your account.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            New Password *
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your new password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <img src={eyeIcon} alt="Toggle password" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Confirm Password *
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600 pr-12"
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-3 flex items-center justify-center text-gray-400 hover:text-gray-700"
            >
              <img src={eyeIcon} alt="Toggle password" className="w-5 h-5" />
            </button>
          </div>
          {password && confirmPassword && password !== confirmPassword && (
            <p className="text-red-500 text-sm mt-1">
              Passwords do not match
            </p>
          )}
        </div>

        {error && (
          <p className="text-red-500 text-sm md:text-base">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading || password !== confirmPassword}
          className="w-full bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold hover:bg-blue-800 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? "Creating..." : "Create New Password"}
        </button>
      </form>
    </div>
  );
};

export default CreateNewPasswordForm;
