import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_CHARACTER_NAME,
  MOOD_IDS,
  NEED_IDS,
  NEEDS,
  type CheckinBody,
  type CheckinResponse,
  type Mood,
  type Need,
  type PracticeDto,
} from '@psydog/shared';
import { Character } from '@/components/Character';
import { CheckboxRow } from '@/components/CheckboxRow';
import { ChoiceCard } from '@/components/ChoiceCard';
import { Actions, ErrorNote, Hint, Screen } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useClientHome } from '@/lib/client';

const MOOD_LABELS: Record<Mood, string> = {
  CALM: 'Спокоен',
  JOYFUL: 'Радуется',
  HIDING: 'Хочет спрятаться',
  SCARED: 'Испуган, критик громкий',
};

function PracticeCard({ p }: { p: PracticeDto }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{p.title}</CardTitle>
        <CardDescription className="text-base text-card-foreground">{p.summary}</CardDescription>
        <div className="mt-1 flex gap-2">
          <Badge variant="secondary">{NEEDS[p.need].short}</Badge>
          <Badge variant="outline">{p.durationMin} мин</Badge>
        </div>
      </CardHeader>
    </Card>
  );
}

function Alternatives(props: { current: string; need: Need | null; comforting: boolean }) {
  const { current, need, comforting } = props;
  const list = useQuery({
    queryKey: ['practices', need, comforting],
    queryFn: () =>
      api<PracticeDto[]>(`/practices?${comforting ? 'comforting=1' : need ? `need=${need}` : ''}`),
  });
  const others = list.data?.filter((p) => p.id !== current) ?? [];
  return (
    <div className="flex flex-col gap-2">
      {others.map((p) => (
        <Link key={p.id} to={`/practice/${p.id}`}>
          <Card size="sm">
            <CardHeader>
              <CardTitle>{p.title}</CardTitle>
              <CardDescription>{p.summary}</CardDescription>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export function Checkin() {
  const home = useClientHome();
  const name = home.data?.characterName ?? DEFAULT_CHARACTER_NAME;
  const [step, setStep] = useState<1 | 2>(1);
  const [mood, setMood] = useState<Mood | null>(null);
  const [lowNeed, setLowNeed] = useState<Need | null>(null);
  const [isHardDay, setHardDay] = useState(false);
  const [showOthers, setShowOthers] = useState(false);
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: () => {
      const body: CheckinBody = { mood: mood!, lowNeed, isHardDay };
      return api<CheckinResponse>('/client/checkin', {
        method: 'POST',
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client', 'home'] }),
  });

  const back = (
    <Button asChild variant="ghost" size="block" className="text-muted-foreground">
      <Link to="/home">Вернуться к малышу</Link>
    </Button>
  );

  if (submit.data) {
    const p = submit.data.suggestedPractice;
    const comforting = isHardDay || mood === 'HIDING' || mood === 'SCARED';
    return (
      <Screen title={comforting ? 'Давай немного позаботимся' : 'Вот что можно сделать сегодня'}>
        {p ? (
          <>
            <PracticeCard p={p} />
            <Button asChild size="block">
              <Link to={`/practice/${p.id}`}>Начать</Link>
            </Button>
            {showOthers ? (
              <Alternatives current={p.id} need={lowNeed} comforting={comforting} />
            ) : (
              <Button variant="link" onClick={() => setShowOthers(true)}>
                Выбрать другую
              </Button>
            )}
          </>
        ) : (
          <Hint>Пока нечего предложить — загляни чуть позже.</Hint>
        )}
        <Actions>{back}</Actions>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen title={`Как ${name} сегодня?`}>
        <div className="grid grid-cols-2 gap-3">
          {MOOD_IDS.map((m) => (
            <ChoiceCard key={m} selected={mood === m} onClick={() => setMood(m)}>
              <Character mood={m} size={96} />
              <span className="text-sm">{MOOD_LABELS[m]}</span>
            </ChoiceCard>
          ))}
        </div>
        <CheckboxRow checked={isHardDay} onChange={setHardDay}>
          Сегодня тяжело
        </CheckboxRow>
        <Actions>
          <Button size="block" disabled={!mood} onClick={() => setStep(2)}>
            Дальше
          </Button>
          {back}
        </Actions>
      </Screen>
    );
  }

  return (
    <Screen title={`Чего ${name} сегодня не хватает?`}>
      <div className="flex flex-col gap-2">
        {NEED_IDS.map((n) => (
          <ChoiceCard
            key={n}
            selected={lowNeed === n}
            onClick={() => setLowNeed(lowNeed === n ? null : n)}
            className="p-4 text-left"
          >
            <span className="font-medium">{NEEDS[n].title}</span>
            <span className="block text-sm text-muted-foreground">{NEEDS[n].about}</span>
          </ChoiceCard>
        ))}
      </div>
      <Hint>Можно не выбирать — тогда предложим что-нибудь на твой вкус.</Hint>
      <Actions>
        <Button size="block" disabled={submit.isPending} onClick={() => submit.mutate()}>
          Готово
        </Button>
        {submit.isError && <ErrorNote />}
        <Button size="block" variant="ghost" onClick={() => setStep(1)}>
          Назад
        </Button>
      </Actions>
    </Screen>
  );
}
