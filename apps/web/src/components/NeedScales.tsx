import { NEED_IDS, NEEDS, type Need, type NeedScales as Scales } from '@psydog/shared';

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
    <div>
      <div className="flex justify-between text-sm">
        <span>{NEEDS[need].short}</span>
        {value === 0 && <span className="text-hint">ждёт заботы</span>}
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${value}%`, background: NEED_COLORS[need] }}
        />
      </div>
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
