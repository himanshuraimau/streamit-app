import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { MediaUpload } from '@/components/ads/MediaUpload';
import { adsApi } from '@/lib/api/ads.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { RiArrowLeftLine, RiSaveLine } from '@remixicon/react';

const adFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  mediaUrl: z.string().url('Valid media URL is required'),
  targetRegion: z.array(z.string()).min(1, 'At least one region is required'),
  targetGender: z.enum(['male', 'female', 'all']).optional(),
  category: z.string().optional(),
  cpm: z.number().min(0.01, 'CPM must be at least $0.01').max(100, 'CPM must be less than $100'),
  frequencyCap: z.number().int().min(1, 'Frequency cap must be at least 1').max(100, 'Frequency cap must be less than 100'),
  isActive: z.boolean(),
});

type AdFormValues = z.infer<typeof adFormSchema>;

const regions = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'IN', label: 'India' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
];

const categories = [
  { value: 'gaming', label: 'Gaming' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'education', label: 'Education' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'technology', label: 'Technology' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

export function AdEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: '',
      mediaUrl: '',
      targetRegion: [],
      targetGender: 'all',
      category: '',
      cpm: 1.0,
      frequencyCap: 5,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: AdFormValues) => adsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
      toast.success('Ad campaign created successfully');
      navigate('/ads');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create ad campaign');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: AdFormValues) => adsApi.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ads.all });
      toast.success('Ad campaign updated successfully');
      navigate('/ads');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update ad campaign');
    },
  });

  const onSubmit = (data: AdFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ads')}>
          <RiArrowLeftLine className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Ad Campaign' : 'Create Ad Campaign'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode ? 'Update ad campaign details' : 'Create a new advertisement campaign'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Configure the basic details of your ad campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ad title" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive title for your ad campaign</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mediaUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creative Media</FormLabel>
                    <FormControl>
                      <MediaUpload
                        value={field.value}
                        onChange={field.onChange}
                        accept="image/*,video/*"
                        maxSize={10}
                      />
                    </FormControl>
                    <FormDescription>Upload an image or video for your ad</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Targeting</CardTitle>
              <CardDescription>Define who will see your ad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="targetRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Regions</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value[0] || ''}
                        onValueChange={(value) => {
                          const current = field.value || [];
                          if (current.includes(value)) {
                            field.onChange(current.filter((v) => v !== value));
                          } else {
                            field.onChange([...current, value]);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select regions">
                            {field.value.length > 0
                              ? `${field.value.length} region(s) selected`
                              : 'Select regions'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {regions.map((region) => (
                            <SelectItem key={region.value} value={region.value}>
                              {region.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Selected: {field.value.join(', ') || 'None'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetGender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Gender</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>Target specific content categories</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Delivery</CardTitle>
              <CardDescription>Configure pricing and delivery settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="cpm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPM (Cost Per Thousand Impressions)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Amount in USD per 1000 impressions</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="frequencyCap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency Cap</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum impressions per user per day
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this ad campaign to start serving ads
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/ads')}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <RiSaveLine className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : isEditMode ? 'Update Campaign' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
