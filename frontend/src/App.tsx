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

// Live & Social Pages
import LivePage from '@/pages/live';
import FollowingPage from '@/pages/following';
import CreatorsPage from '@/pages/creators';

// Creator & Stream Pages
import WatchStream from '@/pages/watch';
import CreatorPage from '@/pages/creator';

// Payment Pages
import CoinShop from '@/pages/CoinShop';
import CoinSuccess from '@/pages/CoinSuccess';
import PurchaseHistory from '@/pages/PurchaseHistory';
import { GiftsSent } from '@/pages/GiftsSent';
import { GiftsReceived } from '@/pages/GiftsReceived';
import MyCodes from '@/pages/MyCodes';

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

      {/* Live & Social routes */}
      <Route path="/live" element={<LivePage />} />
      <Route path="/following" element={<FollowingPage />} />
      <Route path="/creators" element={<CreatorsPage />} />

      {/* Coin/Payment routes */}
      <Route path="/coins/shop" element={<CoinShop />} />
      <Route path="/coins/success" element={<CoinSuccess />} />
      <Route path="/coins/history" element={<PurchaseHistory />} />
      <Route path="/coins/my-codes" element={<MyCodes />} />
      
      {/* Gift routes */}
      <Route path="/gifts/sent" element={<GiftsSent />} />
      <Route path="/gifts/received" element={<GiftsReceived />} />

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