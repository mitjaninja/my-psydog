import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

/** «Мне очень плохо» — всегда на главном экране клиента. Экран открывается сразу, даже без сети. */
export function CrisisButton() {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="block"
      onClick={() => {
        void api('/client/crisis', { method: 'POST' }).catch(() => undefined);
        navigate('/crisis');
      }}
    >
      Мне очень плохо
    </Button>
  );
}
