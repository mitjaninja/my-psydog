import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CHARACTER_NAME, NEED_IDS, NEEDS, type OnboardingBody } from '@psydog/shared';
import { Actions, ErrorNote, Hint, Screen } from '@/components/layout';
import { Character } from '@/components/Character';
import { CheckboxRow } from '@/components/CheckboxRow';
import { ReminderPicker } from '@/components/ReminderPicker';
import { NEED_COLORS } from '@/components/NeedScales';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const STEPS = 5;

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
            className={cn('h-1.5 w-6 rounded-full', i <= step ? 'bg-primary' : 'bg-muted')}
          />
        ))}
      </div>

      {step === 0 && (
        <>
          <Character mood="JOYFUL" waving size={180} />
          <h1 className="text-center text-2xl font-semibold">Привет. Это Пушок, твой малыш</h1>
          <p className="text-center text-base">Он немного похож на тебя в детстве.</p>
        </>
      )}

      {step === 1 && (
        <>
          <h1 className="text-2xl font-semibold">Что нужно малышу</h1>
          <Hint>У каждого из нас есть пять базовых потребностей. У малыша — тоже.</Hint>
          {NEED_IDS.map((id) => (
            <Card
              key={id}
              size="sm"
              className="border-l-4"
              style={{ borderLeftColor: NEED_COLORS[id] }}
            >
              <CardHeader>
                <CardTitle>{NEEDS[id].title}</CardTitle>
                <CardDescription>{NEEDS[id].about}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </>
      )}

      {step === 2 && (
        <>
          <Character mood="CALM" size={140} />
          <h1 className="text-2xl font-semibold">Как это работает</h1>
          <Card className="text-base">
            <CardContent>
              Раз в день мы спросим, как малыш, и предложим одну небольшую практику — на 2–10 минут.
            </CardContent>
          </Card>
          <Card className="text-base">
            <CardContent>
              Пропускать можно. Малыш всегда рад тебя видеть — даже после долгой паузы.
            </CardContent>
          </Card>
        </>
      )}

      {step === 3 && (
        <>
          <h1 className="text-2xl font-semibold">Немного о данных</h1>
          <CheckboxRow
            checked={dataProcessing}
            onChange={setDataProcessing}
            note="Обязательно. Мы храним отметки о состоянии и практиках на серверах в России."
          >
            Я согласен(на) на обработку данных о моём состоянии
          </CheckboxRow>
          <CheckboxRow
            checked={shareWithPsychologist}
            onChange={setShare}
            note="Обязательно для работы с психологом. Заметки психолог видит, только если ты сам(а) отметишь «показать психологу»."
          >
            Я согласен(на), чтобы психолог видел(а) сводку по практикам
          </CheckboxRow>
          <CheckboxRow
            checked={crisisNotify}
            onChange={setCrisisNotify}
            note="По желанию. Психолог получит короткое сообщение без подробностей."
          >
            Сообщить психологу, если я нажму «Мне очень плохо»
          </CheckboxRow>
          <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
        </>
      )}

      {step === 4 && (
        <>
          <Character mood="JOYFUL" size={120} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="characterName" className="text-lg">
              Как будут звать малыша?
            </Label>
            <Input
              id="characterName"
              maxLength={30}
              className="h-12 rounded-xl text-base"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={DEFAULT_CHARACTER_NAME}
            />
            <Hint>Можно оставить «{DEFAULT_CHARACTER_NAME}» или придумать своё имя.</Hint>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reminder" className="text-lg">
              Когда напоминать о малыше?
            </Label>
            <ReminderPicker id="reminder" value={reminderHour} onChange={setReminderHour} />
            <Hint>
              Одно мягкое сообщение в день, если ты ещё не заглядывал(а). Можно поменять потом.
            </Hint>
          </div>
        </>
      )}

      <Actions>
        {step < STEPS - 1 ? (
          <Button size="block" disabled={step === 3 && !consentsOk} onClick={next}>
            Дальше
          </Button>
        ) : (
          <Button size="block" disabled={finish.isPending} onClick={() => finish.mutate()}>
            Познакомиться с малышом
          </Button>
        )}
        {finish.isError && <ErrorNote />}
        {step > 0 && (
          <Button size="block" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            Назад
          </Button>
        )}
      </Actions>
    </Screen>
  );
}
