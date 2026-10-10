import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus } from 'lucide-react';
import type { PracticeDto } from '@psydog/shared';
import { CheckboxRow } from '@/components/CheckboxRow';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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
    <Card>
      <CardContent className="flex flex-col items-center gap-3">
        <span className="font-mono text-4xl tabular-nums" aria-live="polite">
          {mm}:{ss}
        </span>
        {left === 0 ? (
          <span className="text-center text-muted-foreground">
            Время вышло. Можно побыть так ещё, сколько захочется.
          </span>
        ) : (
          <Button
            size="block"
            variant={running ? 'secondary' : 'default'}
            onClick={() => setRunning(!running)}
          >
            {running ? <Pause /> : <Play />}
            {running ? 'Пауза' : left === total ? 'Запустить таймер' : 'Продолжить'}
          </Button>
        )}
      </CardContent>
    </Card>
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

      {practice.inputType === 'CHECKLIST' &&
        practice.steps.map((s, i) => (
          <CheckboxRow
            key={i}
            checked={checked[i] ?? false}
            onChange={(v) => setChecked(checked.map((c, j) => (j === i ? v : c)))}
          >
            {s}
          </CheckboxRow>
        ))}

      {practice.inputType === 'LIST' && (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <Input
              key={i}
              className="h-12 rounded-xl text-base"
              placeholder={`Пункт ${i + 1}`}
              value={item}
              onChange={(e) => setItems(items.map((v, j) => (j === i ? e.target.value : v)))}
            />
          ))}
          <Button
            variant="ghost"
            className="self-start text-muted-foreground"
            onClick={() => setItems([...items, ''])}
          >
            <Plus />
            ещё пункт
          </Button>
        </div>
      )}

      <Textarea
        className="min-h-28 rounded-xl text-base"
        placeholder={practice.inputType === 'TEXT' ? 'Напиши здесь…' : 'Заметка, если хочется'}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
    </div>
  );
}
