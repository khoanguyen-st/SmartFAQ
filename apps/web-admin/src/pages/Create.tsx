import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateNewPasswordForm from "../components/auth/CreatenewpasswordForm";
import logo from "../assets/icons/logo.svg";
import Creategif from "../assets/icons/create.gif";
import { resetPassword } from "../lib/api";

const CreateNewPassword = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const handleCreateNewPassword = async (
    password: string,
    confirmPassword: string
  ) => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError(null);
    const resetToken = localStorage.getItem('reset_token');
    
    if (!resetToken) {
      setError("Reset token not found. Please request a new password reset.");
      return;
    }

    try {
      await resetPassword(resetToken, password);
      // Xóa reset_token sau khi reset thành công
      localStorage.removeItem('reset_token');
      navigate("/reset-password-success");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset password. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="p-6">
        <div className="flex items-center space-x-3">
            <img src={logo} alt="App Logo" className="w-10 h-10 object-contain" />          
          <span className="text-2xl font-bold text-gray-800">
            Greenwich Smart FAQ
          </span>
        </div>
      </header>

      <main className="flex flex-col-reverse md:flex-row items-center justify-center flex-1 px-6 md:px-20 gap-12 md:gap-20">
        {/* Left side: Form */}
        <div className="flex-1 flex justify-center">
          <CreateNewPasswordForm onSubmit={handleCreateNewPassword} error={error} />
        </div>

        <div className="flex-1 flex justify-center">
          <img
            src={Creategif}
            alt="Create new password illustration"
            className="w-72 sm:w-96 md:w-[500px] lg:w-[600px] object-contain"
          />
        </div>
      </main>
    </div>
  );
};

export default CreateNewPassword;
