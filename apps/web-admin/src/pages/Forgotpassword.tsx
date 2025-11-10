import ForgotPasswordForm from "../components/auth/ForgotpasswordForm";
import logo from "../assets/icons/logo.svg";
import Forgotpassimg from "../assets/icons/Forgotpassimg.svg";

const ForgotPassword = () => {
  const handleForgotPassword = async (email: string) => {
    console.log("Email to reset request:", email);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      {/* Main layout */}
      <main className="flex flex-col-reverse md:flex-row items-center justify-center flex-1 px-6 md:px-20 gap-12 md:gap-20">
        {/* Left side: Form */}
        <div className="flex-1 flex justify-center">
          <ForgotPasswordForm onSubmit={handleForgotPassword} />
        </div>

        {/* Right side: Illustration */}
        <div className="flex-1 flex justify-center">
          <img
            src={Forgotpassimg}
            alt="Forgot password illustration"
            className="w-72 sm:w-96 md:w-[500px] lg:w-[600px] object-contain"
          />
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
