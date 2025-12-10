import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

export function TruncatedText({ text, maxLength = 150, className = '' }: TruncatedTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.slice(0, maxLength) + '...'
    : text;
  
  if (!shouldTruncate) {
    return (
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
        {text}
      </p>
    );
  }

  return (
    <div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${className}`}>
        {displayText}
      </p>
      <Button
        variant="link"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-auto p-0 text-xs text-blue-400 hover:text-blue-300 mt-1"
      >
        {isExpanded ? 'Show less' : 'Read more'}
      </Button>
    </div>
  );
}