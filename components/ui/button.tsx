import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
  asChild?: boolean;
  isLoading?: boolean;
};

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  isLoading = false,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 disabled:pointer-events-none disabled:opacity-50',
        variant === 'default' && 'bg-blue-600 text-white shadow hover:bg-blue-700 dark:bg-blue-500 dark:text-slate-950 dark:hover:bg-blue-400',
        variant === 'outline' && 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-slate-50',
        size === 'sm' && 'h-8 px-3 text-xs',
        size === 'default' && 'h-10 px-4 py-2',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </Comp>
  );
}

export { Button };
