import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BadgeCheck, Video, DollarSign, TrendingUp, Shield, Clock } from 'lucide-react';

interface WelcomePageProps {
  onNext: () => void;
}

export function WelcomePage({ onNext }: WelcomePageProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">Become a StreamIt Creator</h1>
        <p className="text-zinc-400 text-lg">
          Join thousands of creators sharing their passion and earning from their content
        </p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Creator Benefits</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-purple-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Verified Creator Badge</h3>
              <p className="text-zinc-400 text-sm">Stand out with an official creator badge on your profile</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Video className="w-6 h-6 text-pink-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Live Streaming Access</h3>
              <p className="text-zinc-400 text-sm">Go live and connect with your audience in real-time</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Monetization Tools</h3>
              <p className="text-zinc-400 text-sm">Earn through subscriptions, tips, and sponsorships</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
            <div>
              <h3 className="text-white font-medium mb-1">Analytics Dashboard</h3>
              <p className="text-zinc-400 text-sm">Track your growth with detailed insights and metrics</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="bg-zinc-900 border-zinc-800 p-8 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6">Application Requirements</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Identity Verification</p>
              <p className="text-zinc-400 text-sm">Government-issued ID and selfie photo for verification</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Financial Details</p>
              <p className="text-zinc-400 text-sm">Bank account and PAN card for payment processing</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-white font-medium">Review Process</p>
              <p className="text-zinc-400 text-sm">Applications are typically reviewed within 2-3 business days</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={onNext}
          size="lg"
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-12"
        >
          Start Application
        </Button>
      </div>
    </div>
  );
}
