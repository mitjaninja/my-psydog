import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AcceptInviteResponse, InvitePreview } from '@psydog/shared';
import { Button, Card, ErrorNote, Hint, Loading, Screen } from '../components/ui';
import { api } from '../lib/api';

export function AcceptInvite() {
  const { code = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const preview = useQuery({
    queryKey: ['invite', code],
    queryFn: () => api<InvitePreview>(`/invites/${code}`),
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () => api<AcceptInviteResponse>(`/invites/${code}/accept`, { method: 'POST' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['me'] });
      navigate('/onboarding', { replace: true });
    },
  });

  if (preview.isPending) return <Loading />;

  if (!preview.data || preview.data.status !== 'active') {
    return (
      <Screen title="Эта ссылка уже не работает">
        <Card>
          <p>
            Похоже, ею уже воспользовались или прошло слишком много времени. Попроси у своего
            психолога новую ссылку — малыш подождёт.
          </p>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen title="Тебя приглашают познакомиться с малышом">
      <Card>
        <p>
          <b>{preview.data.psychologistName}</b> приглашает тебя делать небольшие практики между
          встречами.
        </p>
      </Card>
      <Hint>Дальше расскажем, как всё устроено, и спросим согласие на обработку данных.</Hint>
      <div className="mt-auto flex flex-col gap-2">
        <Button disabled={accept.isPending} onClick={() => accept.mutate()}>
          Принять приглашение
        </Button>
        {accept.isError && <ErrorNote />}
      </div>
    </Screen>
  );
}
