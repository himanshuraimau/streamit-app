import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { complianceApi } from '@/lib/api/compliance.api';
import { toast } from 'sonner';
import { RiDownloadLine, RiLoader4Line } from '@remixicon/react';

export function DataExportButton() {
  const [userId, setUserId] = useState('');

  const exportMutation = useMutation({
    mutationFn: (userId: string) => complianceApi.exportUserData(userId),
    onSuccess: (blob, userId) => {
      // Create a download link for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `user-data-export-${userId}-${new Date().toISOString()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('User data exported successfully');
      setUserId('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to export user data');
    },
  });

  const handleExport = () => {
    if (!userId.trim()) {
      toast.error('Please enter a user ID');
      return;
    }
    exportMutation.mutate(userId.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="userId">User ID</Label>
        <Input
          id="userId"
          placeholder="Enter user ID to export data"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          disabled={exportMutation.isPending}
        />
        <p className="text-sm text-muted-foreground">
          Export all personal data associated with a user account for GDPR compliance
        </p>
      </div>

      <Button
        onClick={handleExport}
        disabled={exportMutation.isPending || !userId.trim()}
      >
        {exportMutation.isPending ? (
          <>
            <RiLoader4Line className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <RiDownloadLine className="mr-2 h-4 w-4" />
            Export User Data
          </>
        )}
      </Button>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> This action will be logged in the audit trail. The exported data
          includes all user profile information, posts, comments, transactions, and streams.
        </p>
      </div>
    </div>
  );
}
