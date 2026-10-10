import { MOOD_IDS } from '@psydog/shared';
import { Character } from '@/components/Character';
import { Screen } from '@/components/layout';
import { Card, CardContent, CardDescription } from '@/components/ui/card';

const LABELS = { CALM: 'Спокойный', JOYFUL: 'Радостный', HIDING: 'Прячется', SCARED: 'Испуганный' };

/** Только в dev: все состояния персонажа. */
export function CharacterDemo() {
  return (
    <Screen title="Персонаж">
      <div className="grid grid-cols-2 gap-4">
        {MOOD_IDS.map((mood) => (
          <Card key={mood} size="sm">
            <CardContent className="text-center">
              <Character mood={mood} size={140} />
              <CardDescription>
                {LABELS[mood]} · {mood}
              </CardDescription>
            </CardContent>
          </Card>
        ))}
        <Card size="sm" className="col-span-2">
          <CardContent className="text-center">
            <Character mood="JOYFUL" waving size={140} />
            <CardDescription>Машет (онбординг)</CardDescription>
          </CardContent>
        </Card>
      </div>
    </Screen>
  );
}
