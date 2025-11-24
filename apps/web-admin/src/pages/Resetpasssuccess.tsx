import { useNavigate } from "react-router-dom";
import logo from "../assets/icons/logo.svg";
import successGif from "../assets/icons/success.gif";

const ResetPasswordSuccess = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-center space-x-3">
            <img src={logo} alt="App Logo" className="w-10 h-10 object-contain" />          
          <span className="text-2xl font-bold text-gray-800">
            Greenwich Smart FAQ
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-2xl">
            <div className="w-full overflow-hidden rounded-xl">
              <img
                src={successGif}
                alt="Reset password success illustration"
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800">
              Reset password successfully.
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 max-w-xl mx-auto">
              Your password has been successfully reset. Please log in again.
            </p>
          </div>
        <div className="flex justify-center">
          <button
            onClick={handleBackToLogin}
            className="px-8 py-3 bg-[#003087] text-white font-semibold rounded-full transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            Back to login
          </button>
          </div>
      </main>
    </div>
  );
};

export default ResetPasswordSuccess;
