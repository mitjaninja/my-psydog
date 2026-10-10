import { MOOD_IDS } from '@psydog/shared';
import { Character } from '../../components/Character';
import { Screen } from '../../components/ui';

const LABELS = { CALM: 'Спокойный', JOYFUL: 'Радостный', HIDING: 'Прячется', SCARED: 'Испуганный' };

/** Только в dev: все состояния персонажа. */
export function CharacterDemo() {
  return (
    <Screen title="Персонаж">
      <div className="grid grid-cols-2 gap-4">
        {MOOD_IDS.map((mood) => (
          <figure key={mood} className="rounded-2xl bg-secondary-bg p-2 text-center">
            <Character mood={mood} size={140} />
            <figcaption className="text-sm text-hint">
              {LABELS[mood]} · {mood}
            </figcaption>
          </figure>
        ))}
        <figure className="col-span-2 rounded-2xl bg-secondary-bg p-2 text-center">
          <Character mood="JOYFUL" waving size={140} />
          <figcaption className="text-sm text-hint">Машет (онбординг)</figcaption>
        </figure>
      </div>
    </Screen>
  );
}
