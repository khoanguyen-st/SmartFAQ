import { useState, FC } from "react";
import eyeIcon from "../../assets/icons/eye.svg";
import eyeOffIcon from "../../assets/icons/eye-off.svg";

interface CreateNewPasswordFormProps {
  onSubmit: (password: string, confirmPassword: string) => Promise<void>;
  error?: string | null;
}

const PasswordField: FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  placeholder?: string;
}> = ({ id, label, value, onChange, show, onToggleShow, placeholder }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm md:text-base font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          minLength={8}
          required
          className="w-full border border-gray-300 rounded-xl h-12 px-4 pr-12 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-required="true"
        />

        <button
          type="button"
          onClick={onToggleShow}
          className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center text-gray-400 hover:text-gray-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <img src={show ? eyeOffIcon : eyeIcon} alt="" className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const CreateNewPasswordForm: FC<CreateNewPasswordFormProps> = ({ onSubmit, error }) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || confirmPassword.length < 8) return;
    if (password !== confirmPassword) return;
    setIsLoading(true);
    try {
      await onSubmit(password, confirmPassword);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
        input[type="password"]::-webkit-credentials-auto-fill-button {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
          position: absolute;
          right: 0;
        }
      `}</style>
      <div className="bg-white rounded-3xl shadow-xl p-9 w-full max-w-2xl sm:max-w-xl md:max-w-2xl transition-all">
      <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-3 text-center md:text-left">
        Create new password
      </h2>

      <p className="text-gray-600 text-sm md:text-base mb-8 text-center md:text-left">
        Your previous password has been reset. Please set a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <PasswordField
          id="new-password"
          label="New password *"
          value={password}
          onChange={setPassword}
          show={showPassword}
          onToggleShow={() => setShowPassword((s) => !s)}
          placeholder="Enter your new password"
        />

        <PasswordField
          id="confirm-password"
          label="Confirm new password *"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirmPassword}
          onToggleShow={() => setShowConfirmPassword((s) => !s)}
          placeholder="Confirm your new password"
        />

        {password && confirmPassword && password !== confirmPassword && (
          <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
        )}

        {error && <p className="text-red-500 text-sm md:text-base">{error}</p>}

        <div className="flex justify-center">
          <button
            type="submit"
            disabled={isLoading || password !== confirmPassword || password.length < 8}
            className={`min-w-[220px] md:min-w-[260px] px-6 py-3 bg-[#003087] text-white font-semibold rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed ${
              isLoading ? "opacity-80" : "hover:bg-blue-900"
            }`}
            aria-busy={isLoading}
          >
            {isLoading ? "Creating..." : "Submit"}
          </button>
        </div>
      </form>
    </div>
    </>
  );
};

export default CreateNewPasswordForm;