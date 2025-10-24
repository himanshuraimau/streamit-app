import { Check } from 'lucide-react';
import type { ApplicationStep } from '@/types/creator';

interface ProgressIndicatorProps {
  currentStep: ApplicationStep;
}

const STEPS = [
  { key: 'welcome', label: 'Welcome', number: 1 },
  { key: 'identity', label: 'Identity', number: 2 },
  { key: 'financial', label: 'Financial', number: 3 },
  { key: 'profile', label: 'Profile', number: 4 },
  { key: 'review', label: 'Review', number: 5 },
] as const;

export function ProgressIndicator({ currentStep }: ProgressIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.key === currentStep);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === STEPS.length - 1;

          return (
            <div key={step.key} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                    isCompleted
                      ? 'bg-purple-500 border-purple-500'
                      : isCurrent
                      ? 'bg-purple-500/20 border-purple-500'
                      : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        isCurrent ? 'text-purple-300' : 'text-zinc-500'
                      }`}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent ? 'text-purple-300' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-all ${
                    isCompleted ? 'bg-purple-500' : 'bg-zinc-800'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
