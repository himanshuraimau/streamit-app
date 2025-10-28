import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronLeft, Edit2, FileText, CreditCard, User, CheckCircle } from 'lucide-react';
import type { CreatorApplicationData, ApplicationStep } from '@/types/creator';

interface ReviewPageProps {
  data: CreatorApplicationData;
  onEdit: (step: ApplicationStep) => void;
  onSubmit: () => void;
  onBack: () => void;
  loading?: boolean;
}

const ID_TYPE_LABELS = {
  aadhaar: 'Aadhaar Card',
  passport: 'Passport',
  'drivers-license': "Driver's License",
};

export function ReviewPage({ data, onEdit, onSubmit, onBack, loading = false }: ReviewPageProps) {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Review & Submit</h1>
        <p className="text-zinc-400">Please review your information before submitting</p>
      </div>

      <div className="space-y-6">
        {/* Identity Section */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Identity Verification</h3>
                <p className="text-sm text-zinc-400">Government ID and selfie</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit('identity')}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">ID Type:</span>
              <span className="text-white">{ID_TYPE_LABELS[data.identity.idType]}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">ID Document:</span>
              <span className={`flex items-center gap-1 ${data.identity.idDocument ? 'text-green-400' : 'text-red-400'}`}>
                <CheckCircle className="w-4 h-4" />
                {data.identity.idDocument ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Selfie Photo:</span>
              <span className={`flex items-center gap-1 ${data.identity.selfiePhoto ? 'text-green-400' : 'text-red-400'}`}>
                <CheckCircle className="w-4 h-4" />
                {data.identity.selfiePhoto ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
          </div>
        </Card>

        {/* Financial Section */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Financial Details</h3>
                <p className="text-sm text-zinc-400">Bank account and PAN</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit('financial')}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-zinc-400">Account Holder:</span>
              <span className="text-white">{data.financial.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Account Number:</span>
              <span className="text-white">
                {'*'.repeat(data.financial.accountNumber.length - 4)}
                {data.financial.accountNumber.slice(-4)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">IFSC Code:</span>
              <span className="text-white">{data.financial.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">PAN Number:</span>
              <span className="text-white">
                {data.financial.panNumber.slice(0, 2)}{'*'.repeat(6)}{data.financial.panNumber.slice(-2)}
              </span>
            </div>
          </div>
        </Card>

        {/* Profile Section */}
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                <User className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Profile Setup</h3>
                <p className="text-sm text-zinc-400">Picture, categories, and bio</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit('profile')}
              className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">Profile Picture:</span>
              <span className={`flex items-center gap-1 ${data.profile.profilePicture ? 'text-green-400' : 'text-red-400'}`}>
                <CheckCircle className="w-4 h-4" />
                {data.profile.profilePicture ? 'Uploaded' : 'Not uploaded'}
              </span>
            </div>
            <div>
              <span className="text-zinc-400 block mb-2">Categories:</span>
              <div className="flex flex-wrap gap-2">
                {data.profile.categories.map((category) => (
                  <span
                    key={category}
                    className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 text-xs capitalize"
                  >
                    {category}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <span className="text-zinc-400 block mb-2">Bio:</span>
              <p className="text-white text-sm leading-relaxed">{data.profile.bio}</p>
            </div>
          </div>
        </Card>

        {/* Terms Notice */}
        <Card className="bg-blue-500/10 border-blue-500/20 p-6">
          <p className="text-sm text-blue-300">
            By submitting this application, you agree to StreamIt's Creator Terms of Service and confirm that all
            information provided is accurate and truthful.
          </p>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={onBack}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </div>
    </div>
  );
}
