import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Выбираемая карточка (настроение, потребность). */
export function ChoiceCard(props: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.selected}
      onClick={props.onClick}
      className={cn(
        'rounded-xl bg-card p-3 text-card-foreground transition-shadow outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        props.selected && 'bg-accent ring-2 ring-primary',
        props.className,
      )}
    >
      {props.children}
    </button>
  );
}
