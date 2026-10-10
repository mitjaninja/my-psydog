import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NEEDS, type CompletionBody, type CompletionResponse } from '@psydog/shared';
import { CheckboxRow } from '@/components/CheckboxRow';
import { PracticeInput } from '@/components/PracticeInput';
import { Actions, ErrorNote, Loading, Screen } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { usePractice } from '@/lib/client';

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

  const back = (
    <Button asChild variant="ghost" size="block" className="text-muted-foreground">
      <Link to="/home">Вернуться к малышу</Link>
    </Button>
  );

  if (practice.isPending) return <Loading />;
  if (!practice.data)
    return (
      <Screen>
        <ErrorNote>Не нашли такую практику.</ErrorNote>
        {back}
      </Screen>
    );
  const p = practice.data;

  return (
    <Screen title={p.title}>
      <div className="flex gap-2">
        <Badge variant="secondary">{NEEDS[p.need].short}</Badge>
        <Badge variant="outline">{p.durationMin} мин</Badge>
      </div>
      <p className="text-base">{p.summary}</p>
      {p.inputType !== 'CHECKLIST' && (
        <Card className="text-base">
          <CardContent>
            <ol className="flex list-decimal flex-col gap-2 pl-5">
              {p.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
      <PracticeInput practice={p} onChange={onNote} />
      <CheckboxRow
        checked={shareNote}
        onChange={setShareNote}
        className="bg-transparent p-0 has-[[data-state=checked]]:ring-0"
      >
        Показать заметку психологу
      </CheckboxRow>
      <Actions>
        <Button size="block" disabled={done.isPending} onClick={() => done.mutate()}>
          Готово
        </Button>
        {done.isError && <ErrorNote />}
        {back}
      </Actions>
    </Screen>
  );
}
