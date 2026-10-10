import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  NEED_IDS,
  NEEDS,
  type AssignBody,
  type PracticeDto,
  type PsyClientSummary,
} from '@psydog/shared';
import { Button, Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';

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
          <p className="mb-2 font-medium">Сейчас назначено</p>
          <ul className="flex flex-col gap-2">
            {summary.data.assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>{a.practice.title}</span>
                <button
                  className="shrink-0 text-sm text-hint"
                  disabled={unassign.isPending}
                  onClick={() => unassign.mutate(a.id)}
                >
                  Снять
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {NEED_IDS.map((need) => (
        <section key={need} className="flex flex-col gap-2">
          <h2 className="font-medium">{NEEDS[need].title}</h2>
          {library.data
            .filter((p) => p.need === need)
            .map((p) => (
              <label key={p.id} className="flex items-start gap-3 rounded-2xl bg-secondary-bg p-3">
                <input
                  type="checkbox"
                  className="mt-1 size-5 shrink-0 accent-[var(--button)]"
                  disabled={assignedIds.has(p.id)}
                  checked={assignedIds.has(p.id) || selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                />
                <span>
                  <span className="font-medium">{p.title}</span>
                  <span className="block text-sm text-hint">
                    {p.summary} · {p.durationMin} мин
                  </span>
                </span>
              </label>
            ))}
        </section>
      ))}

      <div className="sticky bottom-0 flex flex-col gap-2 bg-bg py-3">
        <Button disabled={selected.size === 0 || assign.isPending} onClick={() => assign.mutate()}>
          {selected.size ? `Назначить (${selected.size})` : 'Выбери практики'}
        </Button>
        {assign.isError && <ErrorNote />}
        <Link to={`/p/clients/${id}`} className="text-center text-hint">
          К сводке
        </Link>
      </div>
      <Hint>Назначенные практики клиент увидит на главном экране.</Hint>
    </Screen>
  );
}
