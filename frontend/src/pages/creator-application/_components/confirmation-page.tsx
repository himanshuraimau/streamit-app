import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, Clock, Mail, Home, BarChart3 } from 'lucide-react';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';

export function ConfirmationPage() {
  const { status } = useCreatorApplication();

  // If somehow an approved creator reaches this page, show different content
  if (status?.hasApplication && status.status === 'APPROVED') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
            <CheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">You're Already a Creator!</h1>
          <p className="text-zinc-400 text-lg">
            Your application has been approved. Access your creator dashboard to manage your content.
          </p>
        </div>

        <Card className="bg-green-500/10 border-green-500/20 p-8 mb-6">
          <div className="text-center">
            <h3 className="text-green-300 font-semibold mb-2">Congratulations!</h3>
            <p className="text-green-400/80 text-sm">
              You're now a verified StreamIt creator. Start streaming, engage with your audience, and grow your community.
            </p>
          </div>
        </Card>

        <div className="flex justify-center gap-4">
          <Link to="/creator-dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <BarChart3 className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to="/">
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/10 mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Application Submitted!</h1>
        <p className="text-zinc-400 text-lg">
          Thank you for applying to become a StreamIt creator
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-8 mb-6">
        <h2 className="text-xl font-semibold text-white mb-6">What happens next?</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Review Process</h3>
              <p className="text-zinc-400 text-sm">
                Our team will review your application within 2-3 business days. We'll verify your identity and
                ensure all information is accurate.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Email Notification</h3>
              <p className="text-zinc-400 text-sm">
                You'll receive an email notification once your application has been reviewed. Check your inbox
                regularly for updates.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Get Started</h3>
              <p className="text-zinc-400 text-sm">
                Once approved, you'll gain access to the Creator Dashboard and can start streaming immediately.
                Your profile will display the verified creator badge.
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-purple-500/10 border-purple-500/20 p-6 mb-8">
        <p className="text-sm text-purple-300 text-center">
          You can check your application status anytime in your account settings
        </p>
      </Card>

      <div className="flex justify-center">
        <Link to="/">
          <Button
            size="lg"
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
