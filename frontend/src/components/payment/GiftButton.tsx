import { useState } from 'react';
import { Gift as GiftIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GiftPicker } from './GiftPicker';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface GiftButtonProps {
  receiverId: string;
  receiverName: string;
  streamId?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
  onSuccess?: () => void;
}

export function GiftButton({
  receiverId,
  receiverName,
  streamId,
  variant = 'ghost',
  size = 'default',
  showLabel = false,
  className,
  onSuccess,
}: GiftButtonProps) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              onClick={() => setShowPicker(true)}
              className={className}
            >
              <GiftIcon className="w-5 h-5 text-purple-500" />
              {showLabel && <span className="ml-2">Send Gift</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Send a gift</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <GiftPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        receiverId={receiverId}
        receiverName={receiverName}
        streamId={streamId}
        onSuccess={onSuccess}
      />
    </>
  );
}
