import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import {
  NEED_IDS,
  NEEDS,
  type AssignBody,
  type PracticeDto,
  type PsyClientSummary,
} from '@psydog/shared';
import { CheckboxRow } from '@/components/CheckboxRow';
import { ErrorNote, Hint, Loading, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export function PsyAssign() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const library = useQuery({
    queryKey: ['practices', 'all'],
    queryFn: () => api<PracticeDto[]>('/practices'),
  });
  const summary = useQuery({
    queryKey: ['p', 'summary', id, 7],
    queryFn: () => api<PsyClientSummary>(`/p/clients/${id}/summary?days=7`),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['p', 'summary', id] });

  const assign = useMutation({
    mutationFn: () => {
      const body: AssignBody = { practiceIds: [...selected] };
      return api(`/p/clients/${id}/assignments`, { method: 'POST', body: JSON.stringify(body) });
    },
    onSuccess: async () => {
      setSelected(new Set());
      await refresh();
    },
  });
  const unassign = useMutation({
    mutationFn: (assignmentId: string) =>
      api(`/p/assignments/${assignmentId}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  if (library.isPending || summary.isPending) return <Loading />;
  if (!library.data || !summary.data)
    return (
      <Screen>
        <ErrorNote />
      </Screen>
    );

  const assignedIds = new Set(summary.data.assignments.map((a) => a.practice.id));
  const toggle = (pid: string) => {
    const next = new Set(selected);
    if (next.has(pid)) next.delete(pid);
    else next.add(pid);
    setSelected(next);
  };

  return (
    <Screen title={`Практики для ${summary.data.client.alias}`}>
      {summary.data.assignments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Сейчас назначено</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-base">
            {summary.data.assignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-2">
                <span>{a.practice.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  disabled={unassign.isPending}
                  onClick={() => unassign.mutate(a.id)}
                >
                  <X />
                  Снять
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {NEED_IDS.map((need) => (
        <section key={need} className="flex flex-col gap-2">
          <h2 className="font-medium">{NEEDS[need].title}</h2>
          {library.data
            .filter((p) => p.need === need)
            .map((p) => (
              <CheckboxRow
                key={p.id}
                disabled={assignedIds.has(p.id)}
                checked={assignedIds.has(p.id) || selected.has(p.id)}
                onChange={() => toggle(p.id)}
                note={`${p.summary} · ${p.durationMin} мин`}
              >
                <span className="font-medium">{p.title}</span>
              </CheckboxRow>
            ))}
        </section>
      ))}

      <div className="sticky bottom-0 flex flex-col gap-2 bg-background py-3">
        <Button
          size="block"
          disabled={selected.size === 0 || assign.isPending}
          onClick={() => assign.mutate()}
        >
          {selected.size ? `Назначить (${selected.size})` : 'Выбери практики'}
        </Button>
        {assign.isError && <ErrorNote />}
        <Button asChild variant="ghost" size="block" className="text-muted-foreground">
          <Link to={`/p/clients/${id}`}>К сводке</Link>
        </Button>
      </div>
      <Hint>Назначенные практики клиент увидит на главном экране.</Hint>
    </Screen>
  );
}
