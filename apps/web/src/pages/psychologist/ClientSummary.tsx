import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Cloud } from 'lucide-react';
import {
  NEED_IDS,
  NEEDS,
  SUMMARY_PERIODS,
  type PsyClientSummary,
  type SummaryPeriod,
} from '@psydog/shared';
import { NeedScales } from '@/components/NeedScales';
import { Actions, ErrorNote, Hint, Loading, Screen } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { formatDate, formatDay } from '@/lib/format';

export function PsyClientSummary() {
  const { id = '' } = useParams();
  const [days, setDays] = useState<SummaryPeriod>(7);
  const summary = useQuery({
    queryKey: ['p', 'summary', id, days],
    queryFn: () => api<PsyClientSummary>(`/p/clients/${id}/summary?days=${days}`),
  });

  const toList = (
    <Button asChild variant="ghost" size="block" className="text-muted-foreground">
      <Link to="/p/clients">К списку клиентов</Link>
    </Button>
  );

  if (summary.isPending) return <Loading />;
  if (!summary.data)
    return (
      <Screen>
        <ErrorNote>Не получилось открыть сводку.</ErrorNote>
        {toList}
      </Screen>
    );
  const s = summary.data;
  const tz = s.client.timezone;

  return (
    <Screen title={s.client.alias}>
      {!s.client.onboarded && <Hint>Клиент принял приглашение, знакомство ещё не завершено.</Hint>}

      <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as SummaryPeriod)}>
        <TabsList className="w-full">
          {SUMMARY_PERIODS.map((d) => (
            <TabsTrigger key={d} value={String(d)}>
              {d} дней
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Потребности сейчас</CardTitle>
        </CardHeader>
        <CardContent>
          <NeedScales scales={s.scales} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-1 text-base">
          <p>Чек-инов за период: {s.checkins}</p>
          <p>Практик за период: {s.completions.length}</p>
          {s.completions.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {NEED_IDS.filter((n) => s.completionsByNeed[n] > 0).map((n) => (
                <Badge key={n} variant="secondary" className="bg-background">
                  {NEEDS[n].short} · {s.completionsByNeed[n]}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {s.hardDays.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Трудные дни</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-base">
            {s.hardDays.map((d) => (
              <p key={d} className="flex items-center gap-2">
                <Cloud className="size-4 text-muted-foreground" aria-hidden />
                {formatDay(d)}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {s.completions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Выполненные практики</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-base">
            {s.completions.map((c) => (
              <p key={c.id} className="flex justify-between gap-2">
                <span>{c.title}</span>
                <span className="shrink-0 text-sm text-muted-foreground">
                  {formatDate(c.completedAt, tz)}
                </span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {s.sharedNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Заметки, которыми клиент поделился</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-base">
            {s.sharedNotes.map((n, i) => (
              <div key={n.completionId} className="flex flex-col gap-1">
                {i > 0 && <Separator className="mb-2" />}
                <p className="text-sm text-muted-foreground">
                  {n.title} · {formatDate(n.completedAt, tz)}
                </p>
                <p className="whitespace-pre-line">{n.note}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Назначено</CardTitle>
        </CardHeader>
        <CardContent className="text-base">
          {s.assignments.length === 0 ? (
            <Hint>Пока ничего не назначено.</Hint>
          ) : (
            <ul className="flex flex-col gap-1">
              {s.assignments.map((a) => (
                <li key={a.id}>{a.practice.title}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Actions>
        <Button asChild size="block">
          <Link to={`/p/clients/${id}/assign`}>Назначить практики</Link>
        </Button>
        {toList}
      </Actions>
    </Screen>
  );
}
