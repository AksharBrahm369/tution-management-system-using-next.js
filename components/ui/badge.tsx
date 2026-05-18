import * as React from 'react';
import { cn } from '@/lib/utils';

function Badge({ className, variant = 'default', ...props }: React.ComponentProps<'span'> & { variant?: 'default' | 'secondary' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variant === 'secondary' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        variant === 'default' && 'bg-blue-600 text-white dark:bg-blue-500 dark:text-slate-950',
        className
      )}
      {...props}
    />
  );
}

export { Badge };
