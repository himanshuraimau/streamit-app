import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { RejectApplicationDialog } from './RejectApplicationDialog';
import { streamersApi } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import { RiCheckLine, RiCloseLine, RiUserLine, RiBankLine, RiFileTextLine } from '@remixicon/react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ApplicationDetailSheetProps {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationDetailSheet({
  applicationId,
  open,
  onOpenChange,
}: ApplicationDetailSheetProps) {
  const queryClient = useQueryClient();
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const { data: application, isLoading } = useQuery({
    queryKey: queryKeys.streamers.application(applicationId || ''),
    queryFn: () => streamersApi.getApplicationById(applicationId!),
    enabled: !!applicationId && open,
  });

  const approveMutation = useMutation({
    mutationFn: () => streamersApi.approveApplication(applicationId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
      toast.success('Application approved successfully');
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to approve application');
    },
  });

  const handleApprove = () => {
    if (applicationId) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    setRejectDialogOpen(true);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'default';
      case 'REJECTED':
        return 'destructive';
      case 'UNDER_REVIEW':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Application Details</SheetTitle>
            <SheetDescription>
              Review the complete creator application and take action
            </SheetDescription>
          </SheetHeader>

          {isLoading ? (
            <div className="space-y-4 py-6">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : application ? (
            <div className="space-y-6 py-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={getStatusVariant(application.status)}>
                  {application.status.replace('_', ' ')}
                </Badge>
              </div>

              <Separator />

              {/* Applicant Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <RiUserLine className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Applicant Information</h3>
                </div>
                <div className="grid gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <span className="col-span-2 text-sm font-medium">
                      {application.applicantName}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <span className="col-span-2 text-sm font-medium">{application.email}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-sm text-muted-foreground">Submitted:</span>
                    <span className="col-span-2 text-sm font-medium">
                      {format(new Date(application.submittedAt), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profile Information */}
              {application.profileInfo && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <RiFileTextLine className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Profile Information</h3>
                    </div>
                    <div className="grid gap-3">
                      {application.profileInfo.bio && (
                        <div className="grid gap-2">
                          <span className="text-sm text-muted-foreground">Bio:</span>
                          <p className="text-sm">{application.profileInfo.bio}</p>
                        </div>
                      )}
                      {application.profileInfo.socialLinks &&
                        Object.keys(application.profileInfo.socialLinks).length > 0 && (
                          <div className="grid gap-2">
                            <span className="text-sm text-muted-foreground">Social Links:</span>
                            <div className="space-y-1">
                              {Object.entries(application.profileInfo.socialLinks).map(
                                ([platform, url]) => (
                                  <div key={platform} className="text-sm">
                                    <span className="font-medium capitalize">{platform}:</span>{' '}
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      {url}
                                    </a>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Financial Details */}
              {application.financialDetails && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <RiBankLine className="h-5 w-5 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Financial Details</h3>
                    </div>
                    <div className="grid gap-3">
                      {application.financialDetails.bankName && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-sm text-muted-foreground">Bank Name:</span>
                          <span className="col-span-2 text-sm font-medium">
                            {application.financialDetails.bankName}
                          </span>
                        </div>
                      )}
                      {application.financialDetails.accountNumber && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-sm text-muted-foreground">Account Number:</span>
                          <span className="col-span-2 text-sm font-medium">
                            ****{application.financialDetails.accountNumber.slice(-4)}
                          </span>
                        </div>
                      )}
                      {application.financialDetails.routingNumber && (
                        <div className="grid grid-cols-3 gap-2">
                          <span className="text-sm text-muted-foreground">Routing Number:</span>
                          <span className="col-span-2 text-sm font-medium">
                            {application.financialDetails.routingNumber}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Identity Verification Documents */}
              {application.identityDocuments && application.identityDocuments.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Identity Verification Documents</h3>
                  <div className="grid gap-2">
                    {application.identityDocuments.map((doc, index) => (
                      <a
                        key={index}
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Document {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {application.status === 'REJECTED' && application.rejectionReason && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-destructive">Rejection Reason</h3>
                    <p className="text-sm">{application.rejectionReason}</p>
                  </div>
                </>
              )}
            </div>
          ) : null}

          {application && application.status === 'PENDING' && (
            <SheetFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={approveMutation.isPending}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={approveMutation.isPending}>
                <RiCheckLine className="mr-2 h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <RejectApplicationDialog
        applicationId={applicationId}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onSuccess={() => onOpenChange(false)}
      />
    </>
  );
}
