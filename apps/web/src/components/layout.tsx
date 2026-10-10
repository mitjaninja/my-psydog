import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function Screen({
  children,
  title,
  className,
}: {
  children: ReactNode;
  title?: ReactNode;
  className?: string;
}) {
  return (
    <main className={cn('mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-6', className)}>
      {title && <h1 className="text-2xl leading-tight font-semibold">{title}</h1>}
      {children}
    </main>
  );
}

export function Hint({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>;
}

export function Loading() {
  return (
    <Screen>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="mx-auto size-40 rounded-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-40 w-full" />
    </Screen>
  );
}

export function ErrorNote({
  children = 'Что-то пошло не так. Попробуй ещё раз чуть позже.',
}: {
  children?: ReactNode;
}) {
  return <Hint>{children}</Hint>;
}

/** Нижняя зона экрана с основными действиями. */
export function Actions({ children }: { children: ReactNode }) {
  return <div className="mt-auto flex flex-col gap-2 pt-4">{children}</div>;
}
