import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { ArrowLeft } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { monetizationApi } from '@/lib/api/monetization.api';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateValue } from '@/lib/monetization';
import { toast } from 'sonner';

const discountCodeSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(50, 'Code must not exceed 50 characters'),
    discountType: z.enum(['PERCENTAGE', 'FIXED']),
    discountValue: z.number().int().positive('Discount value must be positive'),
    maxRedemptions: z.number().int().positive().nullable(),
    isOneTimeUse: z.boolean(),
    minPurchaseAmount: z.number().int().positive().nullable(),
    expiresAt: z.string(),
    isActive: z.boolean(),
    description: z.string().max(500, 'Description must not exceed 500 characters'),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Percentage discount cannot exceed 100',
        path: ['discountValue'],
      });
    }
  });

type DiscountCodeFormValues = z.infer<typeof discountCodeSchema>;

export function DiscountCodeEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditMode = !!id;

  const form = useForm<DiscountCodeFormValues>({
    resolver: zodResolver(discountCodeSchema),
    defaultValues: {
      code: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      maxRedemptions: null,
      isOneTimeUse: false,
      minPurchaseAmount: null,
      expiresAt: '',
      isActive: true,
      description: '',
    },
  });

  const { data: existingCode } = useQuery({
    queryKey: id ? queryKeys.monetization.discounts.detail(id) : ['monetization', 'discounts', 'new'],
    queryFn: () => monetizationApi.getDiscountCodeById(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (!existingCode) return;

    form.reset({
      code: existingCode.code,
      discountType: existingCode.discountType,
      discountValue: existingCode.discountValue,
      maxRedemptions: existingCode.maxRedemptions,
      isOneTimeUse: existingCode.isOneTimeUse,
      minPurchaseAmount: existingCode.minPurchaseAmount,
      expiresAt: formatDateValue(existingCode.expiresAt),
      isActive: existingCode.isActive,
      description: existingCode.description || '',
    });
  }, [existingCode, form]);

  const createMutation = useMutation({
    mutationFn: (values: DiscountCodeFormValues) =>
      monetizationApi.createDiscountCode({
        ...values,
        code: values.code.trim().toUpperCase(),
        expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59.999Z`).toISOString() : null,
        description: values.description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.discounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.overview() });
      toast.success('Discount code created successfully');
      navigate('/monetization/discounts');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create discount code');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: DiscountCodeFormValues) =>
      monetizationApi.updateDiscountCode(id!, {
        ...values,
        code: values.code.trim().toUpperCase(),
        expiresAt: values.expiresAt ? new Date(`${values.expiresAt}T23:59:59.999Z`).toISOString() : null,
        description: values.description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.discounts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.monetization.overview() });
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.monetization.discounts.detail(id) });
      }
      toast.success('Discount code updated successfully');
      navigate('/monetization/discounts');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update discount code');
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: DiscountCodeFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(values);
      return;
    }

    createMutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/monetization/discounts')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {isEditMode ? 'Edit Discount Code' : 'Create Discount Code'}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? 'Update the promotional code rules and lifecycle settings.'
              : 'Create a new promotional code for admin-managed purchase campaigns.'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Configuration</CardTitle>
              <CardDescription>Set the code string and the bonus logic.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="WELCOME50" {...field} />
                    </FormControl>
                    <FormDescription>Stored as uppercase in the backend.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage bonus</SelectItem>
                        <SelectItem value="FIXED">Fixed value bonus</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="discountValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Value</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value}
                        onChange={(event) => field.onChange(Number(event.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Use a percentage for percentage bonuses, or paise for fixed bonuses.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="Used for festival sale landing page"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Rules</CardTitle>
              <CardDescription>Control redemption limits and eligibility.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="maxRedemptions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Redemptions</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Leave empty for unlimited"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? null : Number(event.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minPurchaseAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Purchase (paise)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Optional minimum purchase"
                        value={field.value ?? ''}
                        onChange={(event) =>
                          field.onChange(
                            event.target.value === '' ? null : Number(event.target.value)
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiresAt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="isOneTimeUse"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>One-time per user</FormLabel>
                        <FormDescription>
                          Prevents the same user from redeeming the code twice.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Inactive codes remain visible in admin but cannot be redeemed.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/monetization/discounts')}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditMode
                  ? 'Update Discount Code'
                  : 'Create Discount Code'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default DiscountCodeEditorPage;
