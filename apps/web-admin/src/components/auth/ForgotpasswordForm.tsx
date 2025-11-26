import { useState } from "react";
import userIcon from "../../assets/icons/email.svg";

interface ForgotPasswordFormProps {
  onSubmit: (email: string) => Promise<void>;
  error?: string | null;
}

const ForgotPasswordForm = ({ onSubmit, error }: ForgotPasswordFormProps) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const inputId = "forgot-password-email";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setLoading(true);
      await onSubmit(email);
    } catch {
      // Error is handled by parent component via error prop
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl px-24 py-20 w-full max-w-3xl transition-all">
      <a
        href="/login"
        className="text-base text-gray-500 hover:text-gray-700 flex items-center mb-6"
      >
        <span className="mr-2 text-lg">←</span> Back to login
      </a>

      <h2
        id="forgot-password-title"
        className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 text-center md:text-left"
      >
        Forgot your password?
      </h2>

      <p className="text-gray-600 text-base md:text-lg mb-8 text-center md:text-left">
       Don’t worry! Enter your email below to recover your password 
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" aria-labelledby="forgot-password-title">
        {/* Label sits outside the relative wrapper so the icon centers to the input only */}
        <label htmlFor={inputId} className="block text-base font-medium text-gray-700 mb-2">
          Email address
        </label>
        <div className="relative">
          <input
            id={inputId}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            className="w-full border border-gray-300 rounded-xl h-12 px-4 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
            required
            aria-required
            aria-invalid={!!error}
          />
          <span className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2">
            <img src={userIcon} alt="email icon" className="w-5 h-5" />
          </span>
        </div>

        {error && <p className="text-red-500 text-sm md:text-base">{error}</p>}

        <div className="flex justify-center">
          <button
            type="submit"
            className={`px-8 py-3 bg-[#003087] text-white font-semibold rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed ${
              loading ? "opacity-80" : "hover:bg-blue-900"
            }`}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
