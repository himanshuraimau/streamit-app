import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ChevronLeft, User, Check } from 'lucide-react';
import type { ProfileData, ContentCategory } from '@/types/creator';

const profileSchema = z.object({
    profilePicture: z.instanceof(File).nullable().refine((file) => file !== null, 'Profile picture is required'),
    categories: z.array(z.enum(['education', 'entertainment', 'lifestyle', 'gaming', 'music', 'sports', 'technology', 'cooking', 'art', 'fitness'])).min(1, 'Select at least one category').max(3, 'Maximum 3 categories allowed'),
    bio: z.string().min(50, 'Bio must be at least 50 characters').max(500, 'Bio must not exceed 500 characters'),
}) satisfies z.ZodType<ProfileData>;

const CATEGORIES: { value: ContentCategory; label: string }[] = [
    { value: 'education', label: 'Education' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'music', label: 'Music' },
    { value: 'sports', label: 'Sports' },
    { value: 'technology', label: 'Technology' },
    { value: 'cooking', label: 'Cooking' },
    { value: 'art', label: 'Art' },
    { value: 'fitness', label: 'Fitness' },
];

interface ProfilePageProps {
    data: ProfileData;
    onNext: (data: ProfileData) => void;
    onBack: () => void;
}

export function ProfilePage({ data, onNext, onBack }: ProfilePageProps) {
    const [preview, setPreview] = useState<string | null>(null);

    const form = useForm<ProfileData>({
        resolver: zodResolver(profileSchema),
        defaultValues: data,
    });

    const selectedCategories = form.watch('categories');
    const bio = form.watch('bio');

    const toggleCategory = (category: ContentCategory) => {
        const current = selectedCategories;
        if (current.includes(category)) {
            form.setValue('categories', current.filter((c) => c !== category));
        } else if (current.length < 3) {
            form.setValue('categories', [...current, category]);
        }
    };

    const handleFileChange = (file: File | null) => {
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (values: ProfileData) => {
        onNext(values);
    };

    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Profile Setup</h1>
                <p className="text-zinc-400">Complete your creator profile</p>
            </div>

            <Card className="bg-zinc-900 border-zinc-800 p-8">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <FormField
                            control={form.control}
                            name="profilePicture"
                            render={({ field: { onChange, value, ...field } }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Profile Picture</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-6">
                                            <div className="w-24 h-24 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center">
                                                {preview ? (
                                                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-12 h-12 text-zinc-600" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <Input
                                                    {...field}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0] || null;
                                                        onChange(file);
                                                        handleFileChange(file);
                                                    }}
                                                    className="bg-zinc-800 border-zinc-700 text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                                                />
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categories"
                            render={() => (
                                <FormItem>
                                    <FormLabel className="text-white">Content Categories (Select up to 3)</FormLabel>
                                    <FormControl>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {CATEGORIES.map((category) => {
                                                const isSelected = selectedCategories.includes(category.value);
                                                return (
                                                    <button
                                                        key={category.value}
                                                        type="button"
                                                        onClick={() => toggleCategory(category.value)}
                                                        className={`relative px-4 py-3 rounded-lg border-2 transition-all ${isSelected
                                                            ? 'border-purple-500 bg-purple-500/10 text-purple-300'
                                                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600'
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <Check className="absolute top-2 right-2 w-4 h-4 text-purple-400" />
                                                        )}
                                                        <span className="text-sm font-medium">{category.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="bio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-white">Bio</FormLabel>
                                    <FormControl>
                                        <div className="space-y-2">
                                            <textarea
                                                {...field}
                                                placeholder="Tell your audience about yourself and your content..."
                                                rows={5}
                                                className="w-full rounded-md bg-zinc-800 border-zinc-700 text-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder:text-zinc-500 resize-none"
                                            />
                                            <div className="flex justify-between text-sm">
                                                <span className="text-zinc-500">Minimum 50 characters</span>
                                                <span className={bio.length > 500 ? 'text-red-400' : 'text-zinc-500'}>
                                                    {bio.length}/500
                                                </span>
                                            </div>
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
