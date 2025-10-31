import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { authClient } from '@/lib/auth-client';
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

export default function CreatorApplication() {
    const { data: session, isPending } = authClient.useSession();
    const {
        status,
        loading,
        initialized,
        createApplication
    } = useCreatorApplication();

    const [currentStep, setCurrentStep] = useState<ApplicationStep>('welcome');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [applicationData, setApplicationData] = useState<CreatorApplicationData>({
        identity: { idType: 'AADHAAR', idDocument: null, selfiePhoto: null },
        financial: { accountHolderName: '', accountNumber: '', ifscCode: '', panNumber: '' },
        profile: { profilePicture: null, categories: [], bio: '' },
        status: 'draft',
    });

    // Check existing application status
    useEffect(() => {
        if (status?.hasApplication && status.status === 'APPROVED') {
            // Redirect approved users to creator dashboard - handled by redirect below
        } else if (status?.hasApplication && status.status === 'PENDING') {
            // Show confirmation page for pending applications
            setIsSubmitted(true);
        } else if (status?.hasApplication && status.status === 'REJECTED') {
            // Allow rejected users to reapply
        }
    }, [status]);

    // Show loading state while checking session or application
    if (isPending || !initialized) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    // Redirect to signin if not authenticated
    if (!session) {
        return <Navigate to="/auth/signin" replace />;
    }

    // Redirect approved creators to dashboard
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
                return <WelcomePage onNext={() => setCurrentStep('identity')} />;
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
                                // Validate that all required files are uploaded
                                if (!applicationData.identity.idDocument || !applicationData.identity.selfiePhoto || !applicationData.profile.profilePicture) {
                                    throw new Error('Please upload all required files');
                                }

                                // Convert frontend data to API format
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

                                await createApplication(apiData);
                                setIsSubmitted(true);
                            } catch (error) {
                                console.error('Failed to submit application:', error);
                                // Error is already handled by the hook with toast
                            }
                        }}
                        onBack={() => setCurrentStep('profile')}
                        loading={loading}
                    />
                );
            default:
                return <WelcomePage onNext={() => setCurrentStep('identity')} />;
        }
    };

    return (
        <div className="min-h-screen bg-black">
            <ApplicationNavbar />
            <div className="pt-20">
                {currentStep !== 'welcome' && <ProgressIndicator currentStep={currentStep} />}
                {renderStep()}
            </div>
        </div>
    );
}
