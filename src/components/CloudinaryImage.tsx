'use client';

import { useState } from 'react';
import { CldImage } from 'next-cloudinary';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type CloudinaryImageProps = ComponentProps<typeof CldImage> & {
  shimmerClassName?: string;
};

export const CloudinaryImage = ({
  className,
  shimmerClassName,
  onLoad,
  ...props
}: CloudinaryImageProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <CldImage
        {...props}
        className={cn(
          'transition-opacity duration-500',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        )}
        onLoad={(event) => {
          setLoaded(true);
          onLoad?.(event);
        }}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit] bg-foreground/5 shimmer transition-opacity duration-500',
          loaded ? 'opacity-0' : 'opacity-100',
          shimmerClassName,
        )}
      />
    </>
  );
};
