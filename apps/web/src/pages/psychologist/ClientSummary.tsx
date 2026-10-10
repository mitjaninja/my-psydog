import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  NEED_IDS,
  NEEDS,
  SUMMARY_PERIODS,
  type PsyClientSummary,
  type SummaryPeriod,
} from '@psydog/shared';
import { NeedScales } from '../../components/NeedScales';
import { Card, ErrorNote, Hint, Loading, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { formatDate, formatDay } from '../../lib/format';

export function PsyClientSummary() {
  const { id = '' } = useParams();
  const [days, setDays] = useState<SummaryPeriod>(7);
  const summary = useQuery({
    queryKey: ['p', 'summary', id, days],
    queryFn: () => api<PsyClientSummary>(`/p/clients/${id}/summary?days=${days}`),
  });

  if (summary.isPending) return <Loading />;
  if (!summary.data)
    return (
      <Screen>
        <ErrorNote>Не получилось открыть сводку.</ErrorNote>
        <Link to="/p/clients" className="text-hint">
          К списку клиентов
        </Link>
      </Screen>
    );
  const s = summary.data;

  return (
    <Screen title={s.client.alias}>
      {!s.client.onboarded && <Hint>Клиент принял приглашение, знакомство ещё не завершено.</Hint>}

      <div className="flex gap-2" role="tablist">
        {SUMMARY_PERIODS.map((d) => (
          <button
            key={d}
            role="tab"
            aria-selected={days === d}
            onClick={() => setDays(d)}
            className={`flex-1 rounded-2xl py-2 ${days === d ? 'bg-button text-button-text' : 'bg-secondary-bg'}`}
          >
            {d} дней
          </button>
        ))}
      </div>

      <Card>
        <p className="mb-3 font-medium">Потребности сейчас</p>
        <NeedScales scales={s.scales} />
      </Card>

      <Card className="flex flex-col gap-1">
        <p>Чек-инов за период: {s.checkins}</p>
        <p>Практик за период: {s.completions.length}</p>
        {s.completions.length > 0 && (
          <p className="text-sm text-hint">
            {NEED_IDS.filter((n) => s.completionsByNeed[n] > 0)
              .map((n) => `${NEEDS[n].short} — ${s.completionsByNeed[n]}`)
              .join(' · ')}
          </p>
        )}
      </Card>

      {s.hardDays.length > 0 && (
        <Card>
          <p className="mb-1 font-medium">Трудные дни</p>
          <ul className="flex flex-col gap-1">
            {s.hardDays.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span aria-hidden className="text-hint">
                  ☁
                </span>
                {formatDay(d)}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s.completions.length > 0 && (
        <Card>
          <p className="mb-1 font-medium">Выполненные практики</p>
          <ul className="flex flex-col gap-1">
            {s.completions.map((c) => (
              <li key={c.id} className="flex justify-between gap-2">
                <span>{c.title}</span>
                <span className="shrink-0 text-sm text-hint">
                  {formatDate(c.completedAt, s.client.timezone)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {s.sharedNotes.length > 0 && (
        <Card>
          <p className="mb-2 font-medium">Заметки, которыми клиент поделился</p>
          <ul className="flex flex-col gap-3">
            {s.sharedNotes.map((n) => (
              <li key={n.completionId}>
                <p className="text-sm text-hint">
                  {n.title} · {formatDate(n.completedAt, s.client.timezone)}
                </p>
                <p className="whitespace-pre-line">{n.note}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <p className="mb-1 font-medium">Назначено</p>
        {s.assignments.length === 0 ? (
          <Hint>Пока ничего не назначено.</Hint>
        ) : (
          <ul className="flex flex-col gap-1">
            {s.assignments.map((a) => (
              <li key={a.id}>{a.practice.title}</li>
            ))}
          </ul>
        )}
      </Card>

      <Link
        to={`/p/clients/${id}/assign`}
        className="rounded-2xl bg-button px-4 py-3 text-center text-button-text"
      >
        Назначить практики
      </Link>
      <Link to="/p/clients" className="text-center text-hint">
        К списку клиентов
      </Link>
    </Screen>
  );
}
