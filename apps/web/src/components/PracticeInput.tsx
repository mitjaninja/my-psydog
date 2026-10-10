import { useEffect, useRef, useState } from 'react';
import type { PracticeDto } from '@psydog/shared';
import { Button } from './ui';

const textareaClass =
  'w-full rounded-2xl bg-secondary-bg px-4 py-3 text-base text-text outline-none placeholder:text-hint';

function Timer({ minutes }: { minutes: number }) {
  const total = minutes * 60;
  const [left, setLeft] = useState(total);
  const [running, setRunning] = useState(false);
  const ref = useRef<number>(undefined);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(ref.current);
  }, [running]);

  useEffect(() => {
    if (left === 0) setRunning(false);
  }, [left]);

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-secondary-bg p-4">
      <span className="font-mono text-4xl tabular-nums" aria-live="polite">
        {mm}:{ss}
      </span>
      {left === 0 ? (
        <span className="text-hint">Время вышло. Можно побыть так ещё, сколько захочется.</span>
      ) : (
        <Button variant={running ? 'secondary' : 'primary'} onClick={() => setRunning(!running)}>
          {running ? 'Пауза' : left === total ? 'Запустить таймер' : 'Продолжить'}
        </Button>
      )}
    </div>
  );
}

/** Поле ввода по inputType. Отдаёт итоговый текст заметки через onChange. */
export function PracticeInput({
  practice,
  onChange,
}: {
  practice: PracticeDto;
  onChange: (note: string) => void;
}) {
  const [text, setText] = useState('');
  const [items, setItems] = useState<string[]>(['']);
  const [checked, setChecked] = useState<boolean[]>(practice.steps.map(() => false));

  useEffect(() => {
    const parts: string[] = [];
    if (practice.inputType === 'LIST') {
      const filled = items.map((i) => i.trim()).filter(Boolean);
      if (filled.length) parts.push(filled.map((i) => `• ${i}`).join('\n'));
    }
    if (practice.inputType === 'CHECKLIST') {
      const done = practice.steps.filter((_, i) => checked[i]);
      if (done.length) parts.push(done.map((s) => `✓ ${s}`).join('\n'));
    }
    if (text.trim()) parts.push(text.trim());
    onChange(parts.join('\n\n'));
  }, [text, items, checked, practice, onChange]);

  return (
    <div className="flex flex-col gap-3">
      {practice.inputType === 'TIMER' && <Timer minutes={practice.durationMin} />}

      {practice.inputType === 'CHECKLIST' && (
        <div className="flex flex-col gap-2">
          {practice.steps.map((s, i) => (
            <label key={i} className="flex items-start gap-3 rounded-2xl bg-secondary-bg p-3">
              <input
                type="checkbox"
                className="mt-1 size-5 shrink-0 accent-[var(--button)]"
                checked={checked[i]}
                onChange={(e) =>
                  setChecked(checked.map((c, j) => (j === i ? e.target.checked : c)))
                }
              />
              <span>{s}</span>
            </label>
          ))}
        </div>
      )}

      {practice.inputType === 'LIST' && (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <input
              key={i}
              className={textareaClass}
              placeholder={`Пункт ${i + 1}`}
              value={item}
              onChange={(e) => setItems(items.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <button className="text-left text-hint" onClick={() => setItems([...items, ''])}>
            + ещё пункт
          </button>
        </div>
      )}

      <textarea
        className={`${textareaClass} min-h-28`}
        placeholder={practice.inputType === 'TEXT' ? 'Напиши здесь…' : 'Заметка, если хочется'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
