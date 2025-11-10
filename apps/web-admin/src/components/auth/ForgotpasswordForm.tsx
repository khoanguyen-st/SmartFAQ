import { useState } from "react";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  error?: string | null;
}

const ForgotPasswordForm = ({ onSubmit, error }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(email);
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-lg sm:max-w-xl md:max-w-2xl transition-all">
      {/* Back to login link */}
      <a
        href="/login"
        className="text-base text-gray-500 hover:text-gray-700 flex items-center mb-6"
      >
        <span className="mr-2 text-lg">←</span> Back to login
      </a>

      {/* Title */}
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 text-center md:text-left">
        Forgot your password?
      </h2>

      <p className="text-gray-600 text-base md:text-lg mb-8 text-center md:text-left">
        Don’t worry! Just enter your email below and we’ll send you instructions
        to reset your password.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
          />
        </div>

        {error && (
          <p className="text-red-500 text-sm md:text-base">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-700 text-white py-3 rounded-xl text-lg font-semibold hover:bg-blue-800 transition-all duration-300"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
