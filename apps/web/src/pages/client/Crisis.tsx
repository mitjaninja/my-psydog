import { Link } from 'react-router-dom';
import { Screen } from '../../components/ui';

// Кризисный экран — шаг 8.
export function Crisis() {
  return (
    <Screen title="Ты не один(на)">
      <p>Сейчас главное — чтобы рядом был живой человек. Экстренный номер: 112.</p>
      <Link to="/home" className="mt-auto text-center text-hint">
        Вернуться к малышу
      </Link>
    </Screen>
  );
}
