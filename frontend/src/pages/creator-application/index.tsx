import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, Clock3 } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { Card } from '@/components/ui/card';
import { ApplicationNavbar } from './_components/application-navbar';
import { WelcomePage } from './_components/welcome-page';
import { IdentityPage } from './_components/identity-page';
import { FinancialPage } from './_components/financial-page';
import { ProfilePage } from './_components/profile-page';
import { ReviewPage } from './_components/review-page';
import { ConfirmationPage } from './_components/confirmation-page';
import { ProgressIndicator } from './_components/progress-indicator';
import { useCreatorApplication } from '@/hooks/useCreatorApplication';
import type { ApplicationStep, CreatorApplicationData } from '@/types/creator';

function formatLongDate(value?: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function CreatorApplication() {
  const { data: session, isPending } = authClient.useSession();
  const { status, loading, initialized, createApplication, updateApplication } =
    useCreatorApplication();

  const [currentStep, setCurrentStep] = useState<ApplicationStep>('welcome');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [applicationData, setApplicationData] = useState<CreatorApplicationData>({
    identity: { idType: 'AADHAAR', idDocument: null, selfiePhoto: null },
    financial: { accountHolderName: '', accountNumber: '', ifscCode: '', panNumber: '' },
    profile: { profilePicture: null, categories: [], bio: '' },
    status: 'draft',
  });

  const isRejected = Boolean(status?.hasApplication && status.status === 'REJECTED');
  const canReapply = status?.canReapply ?? false;
  const reviewDateLabel = formatLongDate(status?.reviewedAt);
  const reapplyAvailableLabel = formatLongDate(status?.reapplyAvailableAt);
  const rejectionReason =
    status?.rejectionReason?.trim() ||
    'The review team did not leave a specific rejection reason.';

  const reapplyHint = useMemo(() => {
    if (!isRejected) {
      return null;
    }

    if (canReapply) {
      return 'Your cooldown is over. Update any details that need work and resubmit when you are ready.';
    }

    if (reapplyAvailableLabel && status?.reapplyCooldownDaysRemaining) {
      const unit = status.reapplyCooldownDaysRemaining === 1 ? 'day' : 'days';
      return `Re-apply on ${reapplyAvailableLabel}. ${status.reapplyCooldownDaysRemaining} ${unit} remaining.`;
    }

    if (reapplyAvailableLabel) {
      return `Re-apply on ${reapplyAvailableLabel}.`;
    }

    return 'Re-applications unlock 30 days after a rejection.';
  }, [canReapply, isRejected, reapplyAvailableLabel, status?.reapplyCooldownDaysRemaining]);

  useEffect(() => {
    if (status?.hasApplication && (status.status === 'PENDING' || status.status === 'UNDER_REVIEW')) {
      setIsSubmitted(true);
      return;
    }

    setIsSubmitted(false);
  }, [status]);

  if (isPending || !initialized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth/signin" replace />;
  }

  if (status?.hasApplication && status.status === 'APPROVED') {
    return <Navigate to="/creator-dashboard" replace />;
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black">
        <ApplicationNavbar />
        <div className="pt-20">
          <ConfirmationPage />
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <WelcomePage
            onNext={() => setCurrentStep('identity')}
            actionLabel={isRejected ? 'Update Application' : 'Start Application'}
            actionHint={reapplyHint}
            disabled={isRejected && !canReapply}
          />
        );
      case 'identity':
        return (
          <IdentityPage
            data={applicationData.identity}
            onNext={(data) => {
              setApplicationData((prev) => ({ ...prev, identity: data }));
              setCurrentStep('financial');
            }}
            onBack={() => setCurrentStep('welcome')}
          />
        );
      case 'financial':
        return (
          <FinancialPage
            data={applicationData.financial}
            onNext={(data) => {
              setApplicationData((prev) => ({ ...prev, financial: data }));
              setCurrentStep('profile');
            }}
            onBack={() => setCurrentStep('identity')}
          />
        );
      case 'profile':
        return (
          <ProfilePage
            data={applicationData.profile}
            onNext={(data) => {
              setApplicationData((prev) => ({ ...prev, profile: data }));
              setCurrentStep('review');
            }}
            onBack={() => setCurrentStep('financial')}
          />
        );
      case 'review':
        return (
          <ReviewPage
            data={applicationData}
            onEdit={(step) => setCurrentStep(step)}
            onSubmit={async () => {
              try {
                if (isRejected && !canReapply) {
                  throw new Error('Your 30-day re-apply cooldown is still active.');
                }

                if (
                  !applicationData.identity.idDocument ||
                  !applicationData.identity.selfiePhoto ||
                  !applicationData.profile.profilePicture
                ) {
                  throw new Error('Please upload all required files');
                }

                const apiData = {
                  identity: {
                    idType: applicationData.identity.idType,
                    idDocumentUrl: applicationData.identity.idDocument,
                    selfiePhotoUrl: applicationData.identity.selfiePhoto,
                  },
                  financial: applicationData.financial,
                  profile: {
                    profilePictureUrl: applicationData.profile.profilePicture,
                    categories: applicationData.profile.categories,
                    bio: applicationData.profile.bio,
                  },
                };

                if (status?.hasApplication) {
                  await updateApplication(apiData);
                } else {
                  await createApplication(apiData);
                }

                setIsSubmitted(true);
              } catch (error) {
                console.error('Failed to submit application:', error);
              }
            }}
            onBack={() => setCurrentStep('profile')}
            loading={loading}
            submitLabel={isRejected ? 'Resubmit Application' : 'Submit Application'}
          />
        );
      default:
        return (
          <WelcomePage
            onNext={() => setCurrentStep('identity')}
            actionLabel={isRejected ? 'Update Application' : 'Start Application'}
            actionHint={reapplyHint}
            disabled={isRejected && !canReapply}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <ApplicationNavbar />
      <div className="pt-20">
        {isRejected && (
          <div className="container mx-auto max-w-4xl px-4 pt-6">
            <Card className="border-red-500/20 bg-red-500/5 p-5 text-white">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 rounded-full bg-red-500/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-red-300" />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h2 className="text-lg font-semibold">Your last creator application was rejected</h2>
                      <p className="text-sm text-zinc-300">
                        Review the feedback below before you submit another application.
                      </p>
                    </div>
                    <div className="rounded-xl border border-red-500/15 bg-black/30 p-3">
                      <p className="text-xs uppercase tracking-[0.16em] text-red-300/80">Review Feedback</p>
                      <p className="mt-2 text-sm text-zinc-200">{rejectionReason}</p>
                    </div>
                  </div>
                </div>
                <div className="min-w-55 rounded-xl border border-zinc-800 bg-black/30 p-4">
                  <div className="flex items-center gap-2 text-sm text-zinc-300">
                    <Clock3 className="h-4 w-4 text-amber-300" />
                    <span>{canReapply ? 'Ready to reapply' : 'Cooldown active'}</span>
                  </div>
                  {reviewDateLabel && (
                    <p className="mt-3 text-xs text-zinc-500">Reviewed on {reviewDateLabel}</p>
                  )}
                  {reapplyAvailableLabel && (
                    <p className="mt-2 text-sm text-zinc-200">
                      Reapply available {canReapply ? 'since' : 'on'} {reapplyAvailableLabel}
                    </p>
                  )}
                  {!canReapply && status?.reapplyCooldownDaysRemaining ? (
                    <p className="mt-2 text-xs text-amber-300">
                      {status.reapplyCooldownDaysRemaining} day
                      {status.reapplyCooldownDaysRemaining === 1 ? '' : 's'} remaining
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-emerald-300">You can update and resubmit now.</p>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {currentStep !== 'welcome' && <ProgressIndicator currentStep={currentStep} />}
        {renderStep()}
      </div>
    </div>
  );
}
