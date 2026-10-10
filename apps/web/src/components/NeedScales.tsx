import { NEED_IDS, NEEDS, type Need, type NeedScales as Scales } from '@psydog/shared';
import { Progress } from '@/components/ui/progress';

/** Мягкие цвета шкал — без красного. */
export const NEED_COLORS: Record<Need, string> = {
  SAFETY: '#9cc5e8',
  AUTONOMY: '#a8d5a2',
  EXPRESSION: '#f2c48d',
  PLAY: '#e6b0d8',
  LIMITS: '#b8b4e8',
};

export function ScaleBar({ need, value }: { need: Need; value: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm">
        <span>{NEEDS[need].short}</span>
        {value === 0 && <span className="text-muted-foreground">ждёт заботы</span>}
      </div>
      <Progress
        value={value}
        indicatorColor={NEED_COLORS[need]}
        aria-label={NEEDS[need].short}
        className="h-2.5 bg-background"
      />
    </div>
  );
}

export function NeedScales({ scales }: { scales: Scales }) {
  return (
    <div className="flex flex-col gap-3">
      {NEED_IDS.map((n) => (
        <ScaleBar key={n} need={n} value={scales[n]} />
      ))}
    </div>
  );
}
