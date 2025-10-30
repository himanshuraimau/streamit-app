import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FileUpload } from '@/components/ui/file-upload';
import { ChevronLeft } from 'lucide-react';
import type { IdentityData } from '@/types/creator';

const identitySchema = z.object({
  idType: z.enum(['AADHAAR', 'PASSPORT', 'DRIVERS_LICENSE']),
  idDocument: z.string().min(1, 'ID document is required').nullable(),
  selfiePhoto: z.string().min(1, 'Selfie photo is required').nullable(),
});

interface IdentityPageProps {
  data: IdentityData;
  onNext: (data: IdentityData) => void;
  onBack: () => void;
}

export function IdentityPage({ data, onNext, onBack }: IdentityPageProps) {
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [selfiePhotoUrl, setSelfiePhotoUrl] = useState<string | null>(null);

  const form = useForm<IdentityData>({
    resolver: zodResolver(identitySchema),
    defaultValues: {
      ...data,
      idDocument: idDocumentUrl,
      selfiePhoto: selfiePhotoUrl,
    },
  });

  const onSubmit = (values: IdentityData) => {
    onNext(values);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Identity Verification</h1>
        <p className="text-zinc-400">Upload your government ID and a selfie for verification</p>
      </div>

      <Card className="bg-zinc-900 border-zinc-800 p-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="idType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">ID Type</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="AADHAAR">Aadhaar Card</option>
                      <option value="PASSPORT">Passport</option>
                      <option value="DRIVERS_LICENSE">Driver's License</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idDocument"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Government ID Document</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image/*,.pdf"
                      purpose="ID_DOCUMENT"
                      placeholder="Upload a clear photo of your ID document"
                      onUploadComplete={(url) => {
                        setIdDocumentUrl(url);
                        field.onChange(url);
                      }}
                      onUploadError={(error) => {
                        console.error('ID document upload error:', error);
                      }}
                      currentFile={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selfiePhoto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Selfie Photo</FormLabel>
                  <FormControl>
                    <FileUpload
                      accept="image/*"
                      purpose="SELFIE_PHOTO"
                      placeholder="Upload a clear selfie photo"
                      onUploadComplete={(url) => {
                        setSelfiePhotoUrl(url);
                        field.onChange(url);
                      }}
                      onUploadError={(error) => {
                        console.error('Selfie upload error:', error);
                      }}
                      currentFile={field.value}
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
