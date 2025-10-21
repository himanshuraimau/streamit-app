import { Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Home from '@/pages/home';
import LoginOptions from '@/pages/auth/login-options';
import SignUp from '@/pages/auth/signup';
import SignIn from '@/pages/auth/signin';
import SignInOTP from '@/pages/auth/signin-otp';
import VerifyEmail from '@/pages/auth/verify-email';
import ForgotPassword from '@/pages/auth/forgot-password';
import ResetPassword from '@/pages/auth/reset-password';

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      
      {/* Auth routes */}
      <Route path="/auth/login-options" element={<LoginOptions />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signin-otp" element={<SignInOTP />} />
      <Route path="/auth/verify-email" element={<VerifyEmail />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;