import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

/** «Мне очень плохо» — всегда на главном экране клиента. Экран открывается сразу, даже без сети. */
export function CrisisButton() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => {
        void api('/client/crisis', { method: 'POST' }).catch(() => undefined);
        navigate('/crisis');
      }}
      className="block w-full rounded-2xl border border-hint/40 px-4 py-3 text-center text-text"
    >
      Мне очень плохо
    </button>
  );
}
