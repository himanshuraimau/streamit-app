import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { complianceApi } from '@/lib/api/compliance.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

const geoBlockSchema = z.object({
  region: z.string().min(2, 'Region is required').max(2, 'Must be a 2-letter ISO country code'),
  contentId: z.string().optional(),
  reason: z.string().optional(),
});

type GeoBlockFormData = z.infer<typeof geoBlockSchema>;

// Common ISO country codes
const COUNTRY_CODES = [
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'CA', name: 'Canada' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'CN', name: 'China' },
  { code: 'JP', name: 'Japan' },
  { code: 'BR', name: 'Brazil' },
  { code: 'RU', name: 'Russia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'KR', name: 'South Korea' },
];

export function GeoBlockForm() {
  const queryClient = useQueryClient();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingData, setPendingData] = useState<GeoBlockFormData | null>(null);

  const form = useForm<GeoBlockFormData>({
    resolver: zodResolver(geoBlockSchema),
    defaultValues: {
      region: '',
      contentId: '',
      reason: '',
    },
  });

  const createGeoBlockMutation = useMutation({
    mutationFn: (data: GeoBlockFormData) => complianceApi.createGeoBlock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.compliance.all });
      toast.success('Geo-block created successfully');
      form.reset();
      setConfirmDialogOpen(false);
      setPendingData(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create geo-block');
      setConfirmDialogOpen(false);
    },
  });

  const onSubmit = (data: GeoBlockFormData) => {
    setPendingData(data);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (pendingData) {
      createGeoBlockMutation.mutate(pendingData);
    }
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="region"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Region (ISO Country Code)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COUNTRY_CODES.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.code} - {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the country where content should be blocked
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Content ID (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter content ID to block specific content"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Leave empty to block all content in the region
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Legal Reason (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the legal reason for this geo-block"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Document the legal basis for this restriction
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={createGeoBlockMutation.isPending}>
            {createGeoBlockMutation.isPending ? 'Creating...' : 'Create Geo-Block'}
          </Button>
        </form>
      </Form>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Geo-Block</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this geo-block? This will prevent access to{' '}
              {pendingData?.contentId ? 'the specified content' : 'all content'} from{' '}
              {pendingData?.region}.
              <br />
              <br />
              This action will be logged in the audit trail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
