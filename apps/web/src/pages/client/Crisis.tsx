import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { Actions, Hint, Screen } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CRISIS_CONTACTS, EMERGENCY, type CrisisContact } from '@/config/crisis';

function Contact({ c, primary = false }: { c: CrisisContact; primary?: boolean }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{c.title}</CardTitle>
        <CardDescription>
          {c.display}
          {c.note ? ` · ${c.note}` : ''}
        </CardDescription>
        <CardAction>
          <Button asChild size="lg" variant={primary ? 'default' : 'outline'}>
            <a href={`tel:${c.phone}`}>
              <Phone />
              Позвонить
            </a>
          </Button>
        </CardAction>
      </CardHeader>
    </Card>
  );
}

export function Crisis() {
  return (
    <Screen title="Ты не один(на)">
      <p className="text-base">
        Сейчас главное — чтобы рядом был живой человек. Позвони тому, кому доверяешь, или в службу
        помощи.
      </p>
      <Contact c={EMERGENCY} primary />
      {CRISIS_CONTACTS.map((c) => (
        <Contact key={c.phone} c={c} />
      ))}
      <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
      <Actions>
        <Button asChild size="block" variant="secondary">
          <Link to="/home">Вернуться к малышу</Link>
        </Button>
      </Actions>
    </Screen>
  );
}
