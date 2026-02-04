import { cn } from '@/lib/utils';

export const Toast = ({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) => {
  return (
    <div className="pointer-events-auto w-full rounded-lg border border-primary/30 bg-gradient-to-r from-primary to-secondary p-4 shadow-lg text-primary-foreground">
      {title ? (
        <div className="text-sm font-semibold text-center">{title}</div>
      ) : null}
      {description ? (
        <div
          className={cn(
            'text-sm text-primary-foreground/90 text-center font-semibold',
            title ? 'mt-1' : '',
          )}
        >
          {description}
        </div>
      ) : null}
    </div>
  );
};
