import { Link } from 'react-router-dom';
import { Hint, Screen } from '../../components/ui';

// Список клиентов появится на шаге 9.
export function PsyClients() {
  return (
    <Screen title="Мои клиенты">
      <Hint>Список клиентов скоро будет здесь.</Hint>
      <Link to="/p/invite" className="rounded-2xl bg-button px-4 py-3 text-center text-button-text">
        Пригласить клиента
      </Link>
    </Screen>
  );
}
