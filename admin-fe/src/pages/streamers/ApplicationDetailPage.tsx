import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloseLine,
  RiMailLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiAlertLine,
} from '@remixicon/react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { streamersApi } from '@/lib/api/streamers.api';
import { complianceApi } from '@/lib/api/compliance.api';
import { reportsApi, type Report } from '@/lib/api/reports.api';
import { usersApi } from '@/lib/api/users.api';
import { queryKeys } from '@/lib/queryKeys';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { RejectApplicationDialog } from '@/components/streamers/RejectApplicationDialog';

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Invalid date';
  }

  return format(parsed, 'MMM d, yyyy HH:mm');
};

const maskAccount = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  const last4 = value.slice(-4);
  return `****${last4}`;
};

const maskPan = (value?: string | null) => {
  if (!value) {
    return 'Not available';
  }

  if (value.length <= 4) {
    return '****';
  }

  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
};

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'UNDER_REVIEW':
      return 'secondary';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    response?: {
      data?: {
        message?: string;
        error?: string;
      };
    };
  };

  return apiError.response?.data?.message || apiError.response?.data?.error || fallback;
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAdminAuthStore();

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const canReview = user?.role === 'super_admin' || user?.role === 'moderator';

  const applicationQuery = useQuery({
    queryKey: queryKeys.streamers.application(id || ''),
    queryFn: () => streamersApi.getApplicationById(id || ''),
    enabled: !!id,
  });

  const userId = applicationQuery.data?.userId;

  const userQuery = useQuery({
    queryKey: queryKeys.users.detail(userId || ''),
    queryFn: () => usersApi.getById(userId || ''),
    enabled: !!userId,
  });

  const reportsQuery = useQuery({
    queryKey: queryKeys.reports.list({ page: 1, pageSize: 5, reportedUserId: userId || '' }),
    queryFn: () =>
      reportsApi.list({
        page: 1,
        pageSize: 5,
        reportedUserId: userId || undefined,
      }),
    enabled: !!userId,
  });

  const applicationAuditQuery = useQuery({
    queryKey: ['compliance', 'audit-log', 'application', id],
    queryFn: () =>
      complianceApi.getAuditLog({
        page: 1,
        pageSize: 30,
        targetType: 'application',
        targetId: id,
      }),
    enabled: !!id,
  });

  const userAuditQuery = useQuery({
    queryKey: ['compliance', 'audit-log', 'user', userId],
    queryFn: () =>
      complianceApi.getAuditLog({
        page: 1,
        pageSize: 20,
        targetType: 'user',
        targetId: userId,
      }),
    enabled: !!userId,
  });

  const approveMutation = useMutation({
    mutationFn: () => streamersApi.approveApplication(id || ''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.application(id || '') });
      queryClient.invalidateQueries({ queryKey: ['compliance', 'audit-log', 'application', id] });
      toast.success('Application approved successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to approve application'));
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (value: string) =>
      streamersApi.addApplicationNote(id || '', {
        note: value,
      }),
    onSuccess: () => {
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'audit-log', 'application', id] });
      toast.success('Note added successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to add note'));
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: () =>
      streamersApi.sendApplicationEmail(id || '', {
        subject: emailSubject,
        message: emailMessage,
      }),
    onSuccess: () => {
      setEmailDialogOpen(false);
      setEmailSubject('');
      setEmailMessage('');
      queryClient.invalidateQueries({ queryKey: ['compliance', 'audit-log', 'application', id] });
      toast.success('Email sent successfully');
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to send email'));
    },
  });

  const applicationNotes = useMemo(() => {
    const logs = applicationAuditQuery.data?.data || [];

    return logs.filter(
      (entry) =>
        entry.action === 'application_note' &&
        entry.metadata &&
        typeof entry.metadata.note === 'string' &&
        entry.metadata.note.trim().length > 0
    );
  }, [applicationAuditQuery.data]);

  const applicationTimeline = useMemo(() => {
    const timeline: Array<{
      title: string;
      detail?: string;
      timestamp?: string | null;
      variant?: 'default' | 'warning' | 'danger';
    }> = [];

    if (applicationQuery.data?.submittedAt) {
      timeline.push({
        title: 'Application submitted',
        timestamp: applicationQuery.data.submittedAt,
      });
    }

    if (applicationQuery.data?.reviewedAt) {
      timeline.push({
        title: `Application ${applicationQuery.data.status.toLowerCase()}`,
        detail: applicationQuery.data.rejectionReason || undefined,
        timestamp: applicationQuery.data.reviewedAt,
        variant: applicationQuery.data.status === 'REJECTED' ? 'danger' : 'default',
      });
    }

    for (const auditEntry of applicationAuditQuery.data?.data || []) {
      timeline.push({
        title: auditEntry.action.replace(/_/g, ' '),
        detail:
          (auditEntry.metadata?.reason as string | undefined) ||
          (auditEntry.metadata?.message as string | undefined) ||
          (auditEntry.metadata?.note as string | undefined),
        timestamp: auditEntry.createdAt,
        variant: auditEntry.action.includes('reject') ? 'danger' : 'default',
      });
    }

    return timeline.sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    });
  }, [applicationQuery.data, applicationAuditQuery.data]);

  if (!id) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Application not found</h1>
        <Button onClick={() => navigate('/streamers/applications')}>Back to applications</Button>
      </div>
    );
  }

  if (applicationQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-110 lg:col-span-2" />
          <Skeleton className="h-110" />
        </div>
      </div>
    );
  }

  if (!applicationQuery.data) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Application not found</h1>
        <p className="text-muted-foreground">The requested creator application could not be loaded.</p>
        <Button onClick={() => navigate('/streamers/applications')}>Back to applications</Button>
      </div>
    );
  }

  const application = applicationQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => navigate('/streamers/applications')}
          >
            <RiArrowLeftLine className="mr-2 h-4 w-4" />
            Back to Applications
          </Button>
          <h1 className="text-3xl font-bold">Creator Application Review</h1>
          <p className="text-muted-foreground">Review applicant data, risk context, and take moderation actions.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={getStatusVariant(application.status)}>
            {application.status.replace(/_/g, ' ')}
          </Badge>
          <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
            <RiMailLine className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          {canReview && application.status === 'PENDING' && (
            <>
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(true)}
                disabled={approveMutation.isPending}
              >
                <RiCloseLine className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
                <RiCheckLine className="mr-2 h-4 w-4" />
                {approveMutation.isPending ? 'Approving...' : 'Approve'}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Applicant</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{application.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="font-medium">@{application.user.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{application.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">{formatDateTime(application.submittedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reviewed</p>
                <p className="font-medium">{formatDateTime(application.reviewedAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Reviewed By</p>
                <p className="font-medium">
                  {application.reviewedByAdmin?.name || application.reviewedBy || 'Not reviewed'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Creator Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {application.profile?.profilePictureUrl ? (
                <img
                  src={application.profile.profilePictureUrl}
                  alt={application.user.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : null}

              <div>
                <p className="text-sm text-muted-foreground">Bio</p>
                <p className="whitespace-pre-wrap">{application.profile?.bio || 'No bio submitted'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {application.profile?.categories?.length ? (
                    application.profile.categories.map((category) => (
                      <Badge key={category} variant="outline">
                        {category}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No categories selected</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RiShieldCheckLine className="h-5 w-5" />
                  Identity Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">ID Type</p>
                  <p className="font-medium">{application.identity?.idType || 'Not submitted'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <Badge variant={application.identity?.isVerified ? 'default' : 'outline'}>
                    {application.identity?.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Verified At</p>
                  <p className="font-medium">{formatDateTime(application.identity?.verifiedAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Verified By</p>
                  <p className="font-medium">
                    {application.identity?.verifiedByAdmin?.name || application.identity?.verifiedBy || 'Not assigned'}
                  </p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <a
                    href={application.identity?.idDocumentUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Open ID Document
                  </a>
                  <a
                    href={application.identity?.selfiePhotoUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Open Selfie Photo
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RiShieldCheckLine className="h-5 w-5" />
                  Financial Verification
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Account Holder</p>
                  <p className="font-medium">{application.financial?.accountHolderName || 'Not submitted'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Bank Account</p>
                  <p className="font-medium">{maskAccount(application.financial?.accountNumber)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">IFSC</p>
                  <p className="font-medium">{application.financial?.ifscCode || 'Not submitted'}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">PAN</p>
                  <p className="font-medium">{maskPan(application.financial?.panNumber)}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Verification Status</p>
                  <Badge variant={application.financial?.isVerified ? 'default' : 'outline'}>
                    {application.financial?.isVerified ? 'Verified' : 'Pending'}
                  </Badge>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Verified At</p>
                  <p className="font-medium">{formatDateTime(application.financial?.verifiedAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Review Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {applicationTimeline.length === 0 ? (
                <p className="text-sm text-muted-foreground">No timeline events available.</p>
              ) : (
                applicationTimeline.map((event, index) => (
                  <div key={`${event.title}-${index}`} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-medium">{event.title}</p>
                      <Badge variant={event.variant === 'danger' ? 'destructive' : 'outline'}>
                        <RiTimeLine className="mr-1 h-3 w-3" />
                        {formatDateTime(event.timestamp)}
                      </Badge>
                    </div>
                    {event.detail ? (
                      <p className="mt-2 text-sm text-muted-foreground">{event.detail}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Risk Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Account State</p>
                <Badge variant={application.user.isSuspended ? 'destructive' : 'default'}>
                  {application.user.isSuspended ? 'Suspended' : 'Active'}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Suspension Reason</p>
                <p className="text-sm font-medium">{application.user.suspendedReason || 'None'}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Suspended At</p>
                <p className="text-sm font-medium">{formatDateTime(application.user.suspendedAt)}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Suspension Expires</p>
                <p className="text-sm font-medium">
                  {formatDateTime(application.user.suspensionExpiresAt)}
                </p>
              </div>

              <Separator />

              <p className="text-xs text-muted-foreground">
                Ban history entries: {userQuery.data?.banHistory?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prior Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {reportsQuery.isLoading ? (
                <Skeleton className="h-20" />
              ) : reportsQuery.data?.data?.length ? (
                reportsQuery.data.data.map((report: Report) => (
                  <div key={report.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{report.reasonCategory}</Badge>
                      <Badge variant={report.status === 'PENDING' ? 'destructive' : 'secondary'}>
                        {report.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(report.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No reports found for this applicant.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                placeholder="Add an internal note for the review team..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={4}
              />
              <Button
                type="button"
                variant="outline"
                disabled={addNoteMutation.isPending || note.trim().length < 5}
                onClick={() => addNoteMutation.mutate(note.trim())}
              >
                {addNoteMutation.isPending ? 'Saving...' : 'Add Note'}
              </Button>

              <Separator />

              {applicationNotes.length ? (
                applicationNotes.map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <p className="text-sm">{String(entry.metadata?.note || '')}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No notes added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Moderation Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userAuditQuery.isLoading ? (
                <Skeleton className="h-20" />
              ) : userAuditQuery.data?.data?.length ? (
                userAuditQuery.data.data.slice(0, 6).map((entry) => (
                  <div key={entry.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{entry.action.replace(/_/g, ' ')}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(entry.createdAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No user moderation events found.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RejectApplicationDialog
        applicationId={id}
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: queryKeys.streamers.all });
          queryClient.invalidateQueries({ queryKey: queryKeys.streamers.application(id) });
          queryClient.invalidateQueries({ queryKey: ['compliance', 'audit-log', 'application', id] });
          toast.success('Application rejected successfully');
        }}
      />

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiMailLine className="h-5 w-5" />
              Send Applicant Email
            </DialogTitle>
            <DialogDescription>
              Send a direct communication to the applicant about this application review.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Subject</p>
              <Input
                value={emailSubject}
                onChange={(event) => setEmailSubject(event.target.value)}
                placeholder="Application review update"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-muted-foreground">Message</p>
              <Textarea
                value={emailMessage}
                onChange={(event) => setEmailMessage(event.target.value)}
                rows={6}
                placeholder="Write your message to the applicant..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate()}
              disabled={
                sendEmailMutation.isPending ||
                emailSubject.trim().length < 3 ||
                emailMessage.trim().length < 10
              }
            >
              <RiMailLine className="mr-2 h-4 w-4" />
              {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {application.rejectionReason ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <RiAlertLine className="h-5 w-5" />
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{application.rejectionReason}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
