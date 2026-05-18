import * as React from 'react';
import { cn } from '@/lib/utils';

function Avatar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}

function AvatarImage({ className, alt, src, ...props }: React.ComponentProps<'img'>) {
  if (!src) {
    return null;
  }

  return (
    <img
      className={cn('aspect-square h-full w-full object-cover', className)}
      alt={alt}
      src={src}
      {...props}
    />
  );
}

function AvatarFallback({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex h-full w-full items-center justify-center rounded-full bg-muted text-xs font-medium', className)}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback };
