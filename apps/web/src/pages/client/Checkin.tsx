import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MOOD_IDS,
  NEED_IDS,
  NEEDS,
  type CheckinBody,
  type CheckinResponse,
  type Mood,
  type Need,
  type PracticeDto,
} from '@psydog/shared';
import { Character } from '../../components/Character';
import { Button, Card, ErrorNote, Hint, Screen } from '../../components/ui';
import { api } from '../../lib/api';
import { useClientHome } from '../../lib/client';

const MOOD_LABELS: Record<Mood, string> = {
  CALM: 'Спокоен',
  JOYFUL: 'Радуется',
  HIDING: 'Хочет спрятаться',
  SCARED: 'Испуган, критик громкий',
};

function PracticeCard({ p }: { p: PracticeDto }) {
  return (
    <Card>
      <p className="text-lg font-medium">{p.title}</p>
      <p className="mt-1">{p.summary}</p>
      <p className="mt-2 text-sm text-hint">
        {NEEDS[p.need].short} · {p.durationMin} мин
      </p>
    </Card>
  );
}

function Alternatives({
  current,
  need,
  comforting,
}: {
  current: string;
  need: Need | null;
  comforting: boolean;
}) {
  const list = useQuery({
    queryKey: ['practices', need, comforting],
    queryFn: () =>
      api<PracticeDto[]>(`/practices?${comforting ? 'comforting=1' : need ? `need=${need}` : ''}`),
  });
  const others = list.data?.filter((p) => p.id !== current) ?? [];
  return (
    <ul className="flex flex-col gap-2">
      {others.map((p) => (
        <li key={p.id}>
          <Link to={`/practice/${p.id}`} className="block rounded-2xl bg-secondary-bg p-3">
            <span className="font-medium">{p.title}</span>
            <span className="block text-sm text-hint">{p.summary}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function Checkin() {
  const home = useClientHome();
  const name = home.data?.characterName ?? 'Малыш';
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

  if (submit.data) {
    const p = submit.data.suggestedPractice;
    const comforting = isHardDay || mood === 'HIDING' || mood === 'SCARED';
    return (
      <Screen title={comforting ? 'Давай немного позаботимся' : 'Вот что можно сделать сегодня'}>
        {p ? (
          <>
            <PracticeCard p={p} />
            <Link
              to={`/practice/${p.id}`}
              className="rounded-2xl bg-button px-4 py-3 text-center text-button-text"
            >
              Начать
            </Link>
            {showOthers ? (
              <Alternatives current={p.id} need={lowNeed} comforting={comforting} />
            ) : (
              <button className="text-hint" onClick={() => setShowOthers(true)}>
                Выбрать другую
              </button>
            )}
          </>
        ) : (
          <Hint>Пока нечего предложить — загляни чуть позже.</Hint>
        )}
        <Link to="/home" className="mt-auto text-center text-hint">
          Вернуться к малышу
        </Link>
      </Screen>
    );
  }

  if (step === 1) {
    return (
      <Screen title={`Как ${name} сегодня?`}>
        <div className="grid grid-cols-2 gap-3">
          {MOOD_IDS.map((m) => (
            <button
              key={m}
              onClick={() => setMood(m)}
              aria-pressed={mood === m}
              className={`rounded-2xl p-2 text-center ${mood === m ? 'bg-button/20 ring-2 ring-button' : 'bg-secondary-bg'}`}
            >
              <Character mood={m} size={96} />
              <span className="text-sm">{MOOD_LABELS[m]}</span>
            </button>
          ))}
        </div>
        <label className="flex items-center gap-3 rounded-2xl bg-secondary-bg p-4">
          <input
            type="checkbox"
            className="size-5 accent-[var(--button)]"
            checked={isHardDay}
            onChange={(e) => setHardDay(e.target.checked)}
          />
          Сегодня тяжело
        </label>
        <div className="mt-auto flex flex-col gap-2">
          <Button disabled={!mood} onClick={() => setStep(2)}>
            Дальше
          </Button>
          <Link to="/home" className="text-center text-hint">
            Вернуться к малышу
          </Link>
        </div>
      </Screen>
    );
  }

  return (
    <Screen title={`Чего ${name} сегодня не хватает?`}>
      <div className="flex flex-col gap-2">
        {NEED_IDS.map((n) => (
          <button
            key={n}
            onClick={() => setLowNeed(lowNeed === n ? null : n)}
            aria-pressed={lowNeed === n}
            className={`rounded-2xl p-4 text-left ${lowNeed === n ? 'bg-button/20 ring-2 ring-button' : 'bg-secondary-bg'}`}
          >
            <span className="font-medium">{NEEDS[n].title}</span>
            <span className="block text-sm text-hint">{NEEDS[n].about}</span>
          </button>
        ))}
      </div>
      <Hint>Можно не выбирать — тогда предложим что-нибудь на твой вкус.</Hint>
      <div className="mt-auto flex flex-col gap-2">
        <Button disabled={submit.isPending} onClick={() => submit.mutate()}>
          Готово
        </Button>
        {submit.isError && <ErrorNote />}
        <Button variant="secondary" onClick={() => setStep(1)}>
          Назад
        </Button>
      </div>
    </Screen>
  );
}
