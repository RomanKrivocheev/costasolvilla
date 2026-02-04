'use client';

import { Toast } from '@/components/ui/toast';
import { useToastState } from '@/components/ui/use-toast';

export const Toaster = () => {
  const { toasts } = useToastState();
  return (
    <div className="fixed top-6 left-1/2 z-[100] flex w-[320px] -translate-x-1/2 flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} title={t.title} description={t.description} />
      ))}
    </div>
  );
};
