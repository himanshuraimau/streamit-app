import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { settingsApi, type SystemSetting } from '@/lib/api/settings.api';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const settingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
    })
  ),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settingsData, isLoading } = useQuery({
    queryKey: queryKeys.settings.all,
    queryFn: () => settingsApi.getSettings(),
    staleTime: 1000 * 60 * 5, // 5 minutes for static settings data
  });

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (data: SettingsFormData) => settingsApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update settings');
    },
  });

  const onSubmit = (data: SettingsFormData) => {
    updateSettingsMutation.mutate(data);
  };

  const renderSettingField = (setting: SystemSetting, category: string) => {
    const fieldName = `settings.${category}.${setting.key}`;

    if (typeof setting.value === 'boolean') {
      return (
        <FormField
          key={setting.key}
          control={form.control}
          name={fieldName as any}
          defaultValue={setting.value}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{setting.key}</FormLabel>
                {setting.description && (
                  <FormDescription>{setting.description}</FormDescription>
                )}
              </div>
              <FormControl>
                <Switch
                  checked={field.value as boolean}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />
      );
    }

    if (typeof setting.value === 'number') {
      return (
        <FormField
          key={setting.key}
          control={form.control}
          name={fieldName as any}
          defaultValue={setting.value}
          render={({ field }) => (
            <FormItem>
              <FormLabel>{setting.key}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              {setting.description && (
                <FormDescription>{setting.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      );
    }

    // String or JSON
    const isJson = setting.key.toLowerCase().includes('json') || 
                   setting.key.toLowerCase().includes('config');

    return (
      <FormField
        key={setting.key}
        control={form.control}
        name={fieldName as any}
        defaultValue={setting.value}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{setting.key}</FormLabel>
            <FormControl>
              {isJson ? (
                <Textarea
                  className="font-mono text-sm"
                  rows={4}
                  {...field}
                  value={field.value as string}
                />
              ) : (
                <Input {...field} value={field.value as string} />
              )}
            </FormControl>
            {setting.description && (
              <FormDescription>{setting.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Platform Settings</h1>
          <p className="text-muted-foreground">Configure system-wide settings</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure system-wide settings and parameters
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General Settings */}
          {settingsData?.general && settingsData.general.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic platform configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsData.general.map((setting) =>
                  renderSettingField(setting, 'general')
                )}
              </CardContent>
            </Card>
          )}

          {/* Moderation Settings */}
          {settingsData?.moderation && settingsData.moderation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Moderation Settings</CardTitle>
                <CardDescription>
                  Content moderation and flagging thresholds
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsData.moderation.map((setting) =>
                  renderSettingField(setting, 'moderation')
                )}
              </CardContent>
            </Card>
          )}

          {/* Monetization Settings */}
          {settingsData?.monetization && settingsData.monetization.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monetization Settings</CardTitle>
                <CardDescription>
                  Financial operations and withdrawal limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsData.monetization.map((setting) =>
                  renderSettingField(setting, 'monetization')
                )}
              </CardContent>
            </Card>
          )}

          {/* Streaming Settings */}
          {settingsData?.streaming && settingsData.streaming.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Streaming Settings</CardTitle>
                <CardDescription>
                  Live streaming configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsData.streaming.map((setting) =>
                  renderSettingField(setting, 'streaming')
                )}
              </CardContent>
            </Card>
          )}

          {/* Compliance Settings */}
          {settingsData?.compliance && settingsData.compliance.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Compliance Settings</CardTitle>
                <CardDescription>
                  Legal and compliance parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsData.compliance.map((setting) =>
                  renderSettingField(setting, 'compliance')
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={updateSettingsMutation.isPending}>
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default SettingsPage;
