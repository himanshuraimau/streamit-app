import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { streamersApi, type LiveStream } from '@/lib/api/streamers.api';
import { queryKeys } from '@/lib/queryKeys';
import {
  RiMoreLine,
  RiStopCircleLine,
  RiVolumeMuteLine,
  RiChatOffLine,
  RiAlertLine,
  RiUserForbidLine,
} from '@remixicon/react';
import { toast } from 'sonner';

const killStreamSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

const warnStreamerSchema = z.object({
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

const suspendStreamerSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters'),
});

type KillStreamFormData = z.infer<typeof killStreamSchema>;
type WarnStreamerFormData = z.infer<typeof warnStreamerSchema>;
type SuspendStreamerFormData = z.infer<typeof suspendStreamerSchema>;

interface StreamActionMenuProps {
  stream: LiveStream;
}

export function StreamActionMenu({ stream }: StreamActionMenuProps) {
  const queryClient = useQueryClient();

  // Dialog states
  const [killDialogOpen, setKillDialogOpen] = useState(false);
  const [warnDialogOpen, setWarnDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [muteConfirmOpen, setMuteConfirmOpen] = useState(false);
  const [disableChatConfirmOpen, setDisableChatConfirmOpen] = useState(false);

  // Forms
  const killForm = useForm<KillStreamFormData>({
    resolver: zodResolver(killStreamSchema),
    defaultValues: { reason: '' },
  });

  const warnForm = useForm<WarnStreamerFormData>({
    resolver: zodResolver(warnStreamerSchema),
    defaultValues: { message: '' },
  });

  const suspendForm = useForm<SuspendStreamerFormData>({
    resolver: zodResolver(suspendStreamerSchema),
    defaultValues: { reason: '' },
  });

  // Mutations
  const killStreamMutation = useMutation({
    mutationFn: (data: KillStreamFormData) => streamersApi.killStream(stream.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.live() });
      toast.success('Stream terminated successfully');
      setKillDialogOpen(false);
      killForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to kill stream');
    },
  });

  const muteMutation = useMutation({
    mutationFn: () => streamersApi.muteStreamer(stream.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.live() });
      toast.success('Streamer muted successfully');
      setMuteConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to mute streamer');
    },
  });

  const disableChatMutation = useMutation({
    mutationFn: () => streamersApi.disableStreamChat(stream.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.live() });
      toast.success('Stream chat disabled successfully');
      setDisableChatConfirmOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to disable chat');
    },
  });

  const warnMutation = useMutation({
    mutationFn: (data: WarnStreamerFormData) => streamersApi.warnStreamer(stream.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.live() });
      toast.success('Warning sent to streamer');
      setWarnDialogOpen(false);
      warnForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send warning');
    },
  });

  const suspendMutation = useMutation({
    mutationFn: (data: SuspendStreamerFormData) => streamersApi.suspendStreamer(stream.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streamers.live() });
      toast.success('Streamer suspended successfully');
      setSuspendDialogOpen(false);
      suspendForm.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to suspend streamer');
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <RiMoreLine className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setKillDialogOpen(true)}
          >
            <RiStopCircleLine className="mr-2 h-4 w-4" />
            Kill Stream
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setMuteConfirmOpen(true)}>
            <RiVolumeMuteLine className="mr-2 h-4 w-4" />
            Mute
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDisableChatConfirmOpen(true)}>
            <RiChatOffLine className="mr-2 h-4 w-4" />
            Disable Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setWarnDialogOpen(true)}>
            <RiAlertLine className="mr-2 h-4 w-4" />
            Warn
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onClick={() => setSuspendDialogOpen(true)}
          >
            <RiUserForbidLine className="mr-2 h-4 w-4" />
            Suspend
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Kill Stream Dialog */}
      <Dialog open={killDialogOpen} onOpenChange={setKillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiStopCircleLine className="h-5 w-5 text-destructive" />
              Kill Stream
            </DialogTitle>
            <DialogDescription>
              This will immediately terminate the stream for {stream.streamerName}. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <Form {...killForm}>
            <form
              onSubmit={killForm.handleSubmit((data) => killStreamMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={killForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this stream is being terminated..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKillDialogOpen(false)}
                  disabled={killStreamMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={killStreamMutation.isPending}
                >
                  {killStreamMutation.isPending ? 'Terminating...' : 'Kill Stream'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Warn Streamer Dialog */}
      <Dialog open={warnDialogOpen} onOpenChange={setWarnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiAlertLine className="h-5 w-5 text-yellow-500" />
              Warn Streamer
            </DialogTitle>
            <DialogDescription>
              Send a warning message to {stream.streamerName}. They will receive a notification.
            </DialogDescription>
          </DialogHeader>

          <Form {...warnForm}>
            <form
              onSubmit={warnForm.handleSubmit((data) => warnMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={warnForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warning Message *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter the warning message..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWarnDialogOpen(false)}
                  disabled={warnMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={warnMutation.isPending}>
                  {warnMutation.isPending ? 'Sending...' : 'Send Warning'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Suspend Streamer Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiUserForbidLine className="h-5 w-5 text-destructive" />
              Suspend Streamer
            </DialogTitle>
            <DialogDescription>
              This will freeze {stream.streamerName}'s account and terminate their active stream.
            </DialogDescription>
          </DialogHeader>

          <Form {...suspendForm}>
            <form
              onSubmit={suspendForm.handleSubmit((data) => suspendMutation.mutate(data))}
              className="space-y-4"
            >
              <FormField
                control={suspendForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Suspension Reason *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Explain why this streamer is being suspended..."
                        {...field}
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSuspendDialogOpen(false)}
                  disabled={suspendMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={suspendMutation.isPending}
                >
                  {suspendMutation.isPending ? 'Suspending...' : 'Suspend Streamer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Mute Confirmation */}
      <ConfirmDialog
        open={muteConfirmOpen}
        onOpenChange={setMuteConfirmOpen}
        title="Mute Streamer"
        description={`Are you sure you want to mute ${stream.streamerName}? Their audio will be disabled in the LiveKit room.`}
        confirmText="Mute"
        onConfirm={() => muteMutation.mutate()}
      />

      {/* Disable Chat Confirmation */}
      <ConfirmDialog
        open={disableChatConfirmOpen}
        onOpenChange={setDisableChatConfirmOpen}
        title="Disable Stream Chat"
        description={`Are you sure you want to disable chat for ${stream.streamerName}'s stream? Viewers will not be able to send messages.`}
        confirmText="Disable Chat"
        onConfirm={() => disableChatMutation.mutate()}
      />
    </>
  );
}
