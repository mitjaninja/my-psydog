import type { Mood } from '@psydog/shared';

// Заглушка — полноценный персонаж на шаге 6.
export function Character({ size = 160 }: { mood?: Mood; size?: number; waving?: boolean }) {
  return (
    <div
      aria-hidden
      className="mx-auto rounded-full"
      style={{ width: size, height: size, background: 'var(--character-body, #f6c89f)' }}
    />
  );
}
