import { Link } from 'react-router-dom';

/** «Мне очень плохо» — всегда на главном экране клиента. */
export function CrisisButton() {
  return (
    <Link
      to="/crisis"
      className="block rounded-2xl border border-hint/40 px-4 py-3 text-center text-text"
    >
      Мне очень плохо
    </Link>
  );
}
