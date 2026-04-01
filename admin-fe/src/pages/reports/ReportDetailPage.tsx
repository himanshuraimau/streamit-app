import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ResolveReportDialog } from '@/components/reports/ResolveReportDialog';
import { reportsApi } from '@/lib/api/reports.api';
import { ArrowLeft, CheckCircle, FileText, User } from 'lucide-react';

export function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => navigate('/reports')} className="mt-4">
          Back to Reports
        </Button>
      </div>
    );
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'default';
      case 'UNDER_REVIEW':
        return 'secondary';
      case 'RESOLVED':
        return 'outline';
      case 'DISMISSED':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/reports')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Report Details</h1>
            <p className="text-muted-foreground">
              Submitted on {new Date(report.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
        {report.status !== 'RESOLVED' && report.status !== 'DISMISSED' && (
          <Button onClick={() => setResolveDialogOpen(true)}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolve Report
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Reporter Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{report.reporterName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">@{report.reporterUsername}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Previous Reports</p>
              {report.reporterHistory.length > 0 ? (
                <div className="space-y-2">
                  {report.reporterHistory.slice(0, 5).map((item) => (
                    <div key={item.id} className="text-sm p-2 bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{item.reasonCategory}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous reports</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Reported User Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{report.reportedUserName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">@{report.reportedUserUsername}</p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground mb-2">Reports Against User</p>
              {report.reportedUserHistory.length > 0 ? (
                <div className="space-y-2">
                  {report.reportedUserHistory.slice(0, 5).map((item) => (
                    <div key={item.id} className="text-sm p-2 bg-muted rounded">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{item.reasonCategory}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous reports</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <Badge variant="outline" className="mt-1">
                {report.reasonCategory}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Priority</p>
              <Badge variant={getPriorityVariant(report.priority)} className="mt-1">
                {report.priority.toUpperCase()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <Badge variant={getStatusVariant(report.status)} className="mt-1">
                {report.status.replace('_', ' ')}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Report Count</p>
              <Badge variant="secondary" className="mt-1">
                {report.reportCount}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Description</p>
            <p className="text-sm whitespace-pre-wrap p-4 bg-muted rounded-md">
              {report.description}
            </p>
          </div>

          {report.contentPreview && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Reported Content</p>
                <div className="p-4 bg-muted rounded-md">
                  <Badge variant="outline" className="mb-2">
                    {report.contentPreview.type}
                  </Badge>
                  {report.contentPreview.content && (
                    <p className="text-sm mt-2">{report.contentPreview.content}</p>
                  )}
                  {report.contentPreview.mediaUrls && report.contentPreview.mediaUrls.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {report.contentPreview.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Content ${index + 1}`}
                          className="rounded-md max-h-48 object-cover"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {report.status === 'RESOLVED' && report.resolutionAction && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolution</p>
                <div className="p-4 bg-muted rounded-md space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge>{report.resolutionAction.replace('_', ' ')}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {report.resolvedAt && new Date(report.resolvedAt).toLocaleString()}
                    </span>
                  </div>
                  {report.resolutionNotes && (
                    <p className="text-sm mt-2">{report.resolutionNotes}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <ResolveReportDialog
        reportId={report.id}
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
      />
    </div>
  );
}

export default ReportDetailPage;
