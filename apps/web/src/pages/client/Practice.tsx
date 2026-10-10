import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEEDS, type CompletionBody, type CompletionResponse } from '@psydog/shared';
import { PracticeInput } from '../../components/PracticeInput';
import { Button, Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { usePractice } from '../../lib/client';

export function Practice() {
  const { id = '' } = useParams();
  const practice = usePractice(id);
  const [note, setNote] = useState('');
  const [shareNote, setShareNote] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const onNote = useCallback((n: string) => setNote(n), []);

  const done = useMutation({
    mutationFn: () => {
      const body: CompletionBody = { practiceId: id, note: note || undefined, shareNote };
      return api<CompletionResponse>('/client/completions', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: async (res) => {
      await qc.invalidateQueries({ queryKey: ['client'] });
      if (res.showCrisis) navigate('/crisis', { replace: true });
      else navigate('/done', { replace: true, state: res });
    },
  });

  if (practice.isPending) return <Loading />;
  if (!practice.data)
    return (
      <Screen>
        <ErrorNote>Не нашли такую практику.</ErrorNote>
        <Link to="/home" className="text-hint">
          Вернуться к малышу
        </Link>
      </Screen>
    );
  const p = practice.data;

  return (
    <Screen title={p.title}>
      <Hint>
        {NEEDS[p.need].short} · {p.durationMin} мин
      </Hint>
      <p>{p.summary}</p>
      {p.inputType !== 'CHECKLIST' && (
        <Card>
          <ol className="flex list-decimal flex-col gap-2 pl-5">
            {p.steps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </Card>
      )}
      <PracticeInput practice={p} onChange={onNote} />
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          className="size-5 accent-[var(--button)]"
          checked={shareNote}
          onChange={(e) => setShareNote(e.target.checked)}
        />
        Показать заметку психологу
      </label>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <Button disabled={done.isPending} onClick={() => done.mutate()}>
          Готово
        </Button>
        {done.isError && <ErrorNote />}
        <Link to="/home" className="text-center text-hint">
          Вернуться к малышу
        </Link>
      </div>
    </Screen>
  );
}
