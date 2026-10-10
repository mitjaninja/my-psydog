import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CHARACTER_NAME, NEED_IDS, NEEDS, type OnboardingBody } from '@psydog/shared';
import { Character } from '../../components/Character';
import { Button, Card, ErrorNote, Hint, Input, Screen } from '../../components/ui';
import { ReminderPicker } from '../../components/ReminderPicker';
import { api } from '../../lib/api';

const STEPS = 5;

function Checkbox(props: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
  note?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-secondary-bg p-4">
      <input
        type="checkbox"
        className="mt-1 size-5 shrink-0 accent-[var(--button)]"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <span>
        {props.children}
        {props.note && <span className="mt-1 block text-sm text-hint">{props.note}</span>}
      </span>
    </label>
  );
}

export function Onboarding() {
  const [step, setStep] = useState(0);
  const [dataProcessing, setDataProcessing] = useState(false);
  const [shareWithPsychologist, setShare] = useState(false);
  const [crisisNotify, setCrisisNotify] = useState(false);
  const [name, setName] = useState(DEFAULT_CHARACTER_NAME);
  const [reminderHour, setReminderHour] = useState<number | null>(20);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const finish = useMutation({
    mutationFn: () => {
      const body: OnboardingBody = {
        consents: { dataProcessing: true, shareWithPsychologist: true, crisisNotify },
        characterName: name.trim() || DEFAULT_CHARACTER_NAME,
        reminderHour,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      return api('/client/onboarding', { method: 'POST', body: JSON.stringify(body) });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/home', { replace: true });
    },
  });

  const consentsOk = dataProcessing && shareWithPsychologist;
  const next = () => setStep((s) => Math.min(s + 1, STEPS - 1));

  return (
    <Screen>
      <div className="flex justify-center gap-1.5" aria-hidden>
        {Array.from({ length: STEPS }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-button' : 'bg-secondary-bg'}`}
          />
        ))}
      </div>

      {step === 0 && (
        <>
          <Character mood="JOYFUL" waving size={180} />
          <h1 className="text-center text-2xl font-semibold">Привет. Это твой малыш</h1>
          <p className="text-center">Он немного похож на тебя в детстве.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-2xl font-semibold">Что нужно малышу</h1>
          <Hint>У каждого из нас есть пять базовых потребностей. У малыша — тоже.</Hint>
          {NEED_IDS.map((id) => (
            <Card key={id}>
              <p className="font-medium">{NEEDS[id].title}</p>
              <p className="mt-1 text-sm text-hint">{NEEDS[id].about}</p>
            </Card>
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <Character mood="CALM" size={140} />
          <h1 className="text-2xl font-semibold">Как это работает</h1>
          <Card>
            <p>
              Раз в день мы спросим, как малыш, и предложим одну небольшую практику — на 2–10 минут.
            </p>
          </Card>
          <Card>
            <p>Пропускать можно. Малыш всегда рад тебя видеть — даже после долгой паузы.</p>
          </Card>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-2xl font-semibold">Немного о данных</h1>
          <Checkbox
            checked={dataProcessing}
            onChange={setDataProcessing}
            note="Обязательно. Мы храним отметки о состоянии и практиках на серверах в России."
          >
            Я согласен(на) на обработку данных о моём состоянии
          </Checkbox>
          <Checkbox
            checked={shareWithPsychologist}
            onChange={setShare}
            note="Обязательно для работы с психологом. Заметки психолог видит, только если ты сам(а) отметишь «показать психологу»."
          >
            Я согласен(на), чтобы психолог видел(а) сводку по практикам
          </Checkbox>
          <Checkbox
            checked={crisisNotify}
            onChange={setCrisisNotify}
            note="По желанию. Психолог получит короткое сообщение без подробностей."
          >
            Сообщить психологу, если я нажму «Мне очень плохо»
          </Checkbox>
          <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
        </>
      )}

      {step === 4 && (
        <>
          <Character mood="JOYFUL" size={120} />
          <h1 className="text-2xl font-semibold">Как назовёшь малыша?</h1>
          <Input
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={DEFAULT_CHARACTER_NAME}
          />
          <h2 className="mt-2 text-lg font-medium">Когда напоминать о малыше?</h2>
          <ReminderPicker value={reminderHour} onChange={setReminderHour} />
          <Hint>
            Одно мягкое сообщение в день, если ты ещё не заглядывал(а). Можно поменять потом.
          </Hint>
        </>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        {step < STEPS - 1 ? (
          <Button disabled={step === 3 && !consentsOk} onClick={next}>
            Дальше
          </Button>
        ) : (
          <Button disabled={finish.isPending} onClick={() => finish.mutate()}>
            Познакомиться с малышом
          </Button>
        )}
        {finish.isError && <ErrorNote />}
        {step > 0 && (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)}>
            Назад
          </Button>
        )}
      </div>
    </Screen>
  );
}
