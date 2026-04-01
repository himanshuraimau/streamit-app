import { type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card role="status" aria-live="polite">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4" aria-hidden="true">
          {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mb-6 max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} variant="outline" aria-label={action.label}>
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
