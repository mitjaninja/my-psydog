import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import type { CompletionResponse } from '@psydog/shared';
import { Character } from '@/components/Character';
import { ScaleBar } from '@/components/NeedScales';
import { Actions, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { randomDonePhrase } from '@/config/phrases';

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
        <CardContent>
          <ScaleBar need={state.need} value={value} />
        </CardContent>
      </Card>
      <Actions>
        <Button asChild size="block">
          <Link to="/home">К малышу</Link>
        </Button>
      </Actions>
    </Screen>
  );
}
