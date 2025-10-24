import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Building2 } from 'lucide-react';
import type { FinancialData } from '@/types/creator';

const financialSchema = z.object({
  accountHolderName: z.string().min(2, 'Account holder name is required'),
  accountNumber: z.string().min(9, 'Valid account number is required').max(18),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format'),
});

interface FinancialPageProps {
  data: FinancialData;
  onNext: (data: FinancialData) => void;
  onBack: () => void;
}

export function FinancialPage({ data, onNext, onBack }: FinancialPageProps) {
  const form = useForm<FinancialData>({
    resolver: zodResolver(financialSchema),
    defaultValues: data,
  });

  const onSubmit = (values: FinancialData) => {
    onNext(values);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Financial Details</h1>
        <p className="text-zinc-400">Provide your bank account and PAN details for payments</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center gap-3 mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Building2 className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <p className="text-sm text-blue-300">
                Your financial information is encrypted and securely stored
              </p>
            </div>

            <FormField
              control={form.control}
              name="accountHolderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Account Holder Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter name as per bank account"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Bank Account Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter account number"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                      maxLength={18}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ifscCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">IFSC Code</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., SBIN0001234"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase"
                      maxLength={11}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="panNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">PAN Card Number</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., ABCDE1234F"
                      className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 uppercase"
                      maxLength={10}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Continue
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
