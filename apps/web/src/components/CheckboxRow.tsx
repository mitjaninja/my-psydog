import { useId, type ReactNode } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Чекбокс с подписью и необязательным пояснением — вся строка кликабельна. */
export function CheckboxRow(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  note?: ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl bg-card p-4 has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-ring',
        props.className,
      )}
    >
      <Checkbox
        id={id}
        className="mt-0.5 size-5"
        checked={props.checked}
        disabled={props.disabled}
        onCheckedChange={(v) => props.onChange(v === true)}
      />
      <Label
        htmlFor={id}
        className="flex flex-col items-start gap-1 text-base leading-snug font-normal"
      >
        <span>{props.children}</span>
        {props.note && <span className="text-sm text-muted-foreground">{props.note}</span>}
      </Label>
    </div>
  );
}
