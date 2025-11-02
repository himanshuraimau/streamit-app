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
import CreatorApplication from '@/pages/creator-application';

// Creator Dashboard Pages
import CreatorDashboard from '@/pages/creator-dashboard';
import Overview from '@/pages/creator-dashboard/overview';
import Streams from '@/pages/creator-dashboard/streams';
import Keys from '@/pages/creator-dashboard/keys';
import Chat from '@/pages/creator-dashboard/chat';
import Community from '@/pages/creator-dashboard/community';
import ContentUpload from '@/pages/creator-dashboard/content-upload';
import Posts from '@/pages/creator-dashboard/posts';

// Content Pages
import ContentPage from '@/pages/content/index';

// Search Page
import SearchPage from '@/pages/search';

// Creator & Stream Pages
import WatchStream from '@/pages/watch';
import CreatorPage from '@/pages/creator';

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

      {/* Creator routes */}
      <Route path="/creator-application" element={<CreatorApplication />} />

      {/* Creator Dashboard routes */}
      <Route path="/creator-dashboard" element={<CreatorDashboard />}>
        <Route index element={<Navigate to="/creator-dashboard/overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="streams" element={<Streams />} />
        <Route path="keys" element={<Keys />} />
        <Route path="chat" element={<Chat />} />
        <Route path="community" element={<Community />} />
        <Route path="content-upload" element={<ContentUpload />} />
        <Route path="posts" element={<Posts />} />
      </Route>

      {/* Content routes */}
      <Route path="/content" element={<ContentPage />} />

      {/* Search route */}
      <Route path="/search" element={<SearchPage />} />

      {/* Creator profile routes (YouTube-style) - these must be last due to catch-all nature */}
      <Route path="/:username/live" element={<WatchStream />} />
      <Route path="/:username/videos" element={<CreatorPage />} />
      <Route path="/:username/about" element={<CreatorPage />} />
      <Route path="/:username/community" element={<CreatorPage />} />
      <Route path="/:username" element={<CreatorPage />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;