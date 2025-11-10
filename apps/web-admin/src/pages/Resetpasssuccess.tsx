import { useNavigate } from "react-router-dom";
import logo from "../assets/icons/logo.svg";
import successIcon from "../assets/icons/success.svg";

const ResetPasswordSuccess = () => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-center md:justify-start">
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

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-3xl flex flex-col items-center space-y-8">
          <div className="w-full max-w-2xl">
            <div className="border border-blue-800 rounded-lg p-6 md:p-8 bg-white shadow-sm">
              <img
                src={successIcon}
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

          <button
            onClick={handleBackToLogin}
            className="bg-blue-800 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-blue-900 transition-all duration-300 shadow-lg mt-4"
          >
            Back to login
          </button>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordSuccess;
