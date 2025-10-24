import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Upload, FileText, Camera, ChevronLeft } from 'lucide-react';
import type { IdentityData } from '@/types/creator';

const identitySchema = z.object({
  idType: z.enum(['aadhaar', 'passport', 'drivers-license']),
  idDocument: z.instanceof(File).nullable().refine((file) => file !== null, 'ID document is required'),
  selfiePhoto: z.instanceof(File).nullable().refine((file) => file !== null, 'Selfie photo is required'),
});

interface IdentityPageProps {
  data: IdentityData;
  onNext: (data: IdentityData) => void;
  onBack: () => void;
}

export function IdentityPage({ data, onNext, onBack }: IdentityPageProps) {
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);

  const form = useForm<IdentityData>({
    resolver: zodResolver(identitySchema),
    defaultValues: data,
  });

  const handleFileChange = (file: File | null, type: 'id' | 'selfie') => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'id') {
          setIdPreview(reader.result as string);
        } else {
          setSelfiePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

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
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="passport">Passport</option>
                      <option value="drivers-license">Driver's License</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="idDocument"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-white">Government ID Document</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        {...field}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          onChange(file);
                          handleFileChange(file, 'id');
                        }}
                        className="bg-zinc-800 border-zinc-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      />
                      {idPreview && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-zinc-800">
                          <img src={idPreview} alt="ID Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {!idPreview && (
                        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
                          <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                          <p className="text-zinc-400 text-sm">Upload a clear photo of your ID document</p>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="selfiePhoto"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel className="text-white">Selfie Photo</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        {...field}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          onChange(file);
                          handleFileChange(file, 'selfie');
                        }}
                        className="bg-zinc-800 border-zinc-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                      />
                      {selfiePreview && (
                        <div className="relative w-full h-48 rounded-lg overflow-hidden bg-zinc-800">
                          <img src={selfiePreview} alt="Selfie Preview" className="w-full h-full object-contain" />
                        </div>
                      )}
                      {!selfiePreview && (
                        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
                          <Camera className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                          <p className="text-zinc-400 text-sm">Upload a clear selfie photo</p>
                        </div>
                      )}
                    </div>
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
