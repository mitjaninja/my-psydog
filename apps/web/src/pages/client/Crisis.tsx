import { Link } from 'react-router-dom';
import { Card, Hint, Screen } from '../../components/ui';
import { CRISIS_CONTACTS, EMERGENCY, type CrisisContact } from '../../config/crisis';

function Contact({ c, primary = false }: { c: CrisisContact; primary?: boolean }) {
  return (
    <Card className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium">{c.title}</p>
        <p className="text-sm text-hint">
          {c.display}
          {c.note ? ` · ${c.note}` : ''}
        </p>
      </div>
      <a
        href={`tel:${c.phone}`}
        className={`shrink-0 rounded-2xl px-4 py-2 ${primary ? 'bg-button text-button-text' : 'bg-bg text-text'}`}
      >
        Позвонить
      </a>
    </Card>
  );
}

export function Crisis() {
  return (
    <Screen title="Ты не один(на)">
      <p>
        Сейчас главное — чтобы рядом был живой человек. Позвони тому, кому доверяешь, или в службу
        помощи.
      </p>
      <Contact c={EMERGENCY} primary />
      {CRISIS_CONTACTS.map((c) => (
        <Contact key={c.phone} c={c} />
      ))}
      <Hint>Это приложение не заменяет терапию и экстренную помощь.</Hint>
      <Link
        to="/home"
        className="mt-auto rounded-2xl bg-secondary-bg px-4 py-3 text-center text-text"
      >
        Вернуться к малышу
      </Link>
    </Screen>
  );
}
