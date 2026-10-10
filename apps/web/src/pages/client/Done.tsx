import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import type { CompletionResponse } from '@psydog/shared';
import { Character } from '../../components/Character';
import { ScaleBar } from '../../components/NeedScales';
import { Card, Screen } from '../../components/ui';
import { randomDonePhrase } from '../../config/phrases';

export function Done() {
  const state = useLocation().state as CompletionResponse | null;
  const phrase = useMemo(randomDonePhrase, []);
  const [value, setValue] = useState(state?.scaleBefore ?? 0);

  // Шкала плавно растёт: сначала «до», через мгновение — «после»
  useEffect(() => {
    if (!state) return;
    const t = window.setTimeout(() => setValue(state.scaleAfter), 300);
    return () => window.clearTimeout(t);
  }, [state]);

  if (!state) return <Navigate to="/home" replace />;

  return (
    <Screen>
      <Character mood="JOYFUL" size={200} />
      <p className="text-center text-xl font-medium">{phrase}</p>
      <Card>
        <ScaleBar need={state.need} value={value} />
      </Card>
      <Link
        to="/home"
        className="mt-auto rounded-2xl bg-button px-4 py-3 text-center text-button-text"
      >
        К малышу
      </Link>
    </Screen>
  );
}
