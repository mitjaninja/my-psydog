import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { NEEDS, type HistoryDay } from '@psydog/shared';
import { Actions, ErrorNote, Hint, Loading, Screen } from '@/components/layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDay } from '@/lib/format';

export function History() {
  const history = useQuery({
    queryKey: ['client', 'history'],
    queryFn: () => api<HistoryDay[]>('/client/history'),
  });

  if (history.isPending) return <Loading />;

  return (
    <Screen title="Что мы уже сделали">
      {!history.data && <ErrorNote />}
      {history.data?.length === 0 && (
        <Hint>Здесь будут практики, которые ты сделаешь для малыша.</Hint>
      )}
      {history.data?.map((day) => (
        <section key={day.date} className="flex flex-col gap-2">
          <h2 className="text-sm text-muted-foreground">{formatDay(day.date)}</h2>
          {day.items.map((item) => (
            <Card key={item.id} size="sm">
              <CardHeader>
                <CardTitle>{item.title}</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{NEEDS[item.need].short}</Badge>
                  {item.note && item.shareNote && (
                    <Badge variant="outline">
                      <Eye />
                      Видно психологу
                    </Badge>
                  )}
                </div>
              </CardHeader>
              {item.note && (
                <CardContent className="text-base whitespace-pre-line">{item.note}</CardContent>
              )}
            </Card>
          ))}
        </section>
      ))}
      <Actions>
        <Button asChild variant="ghost" size="block" className="text-muted-foreground">
          <Link to="/home">Вернуться к малышу</Link>
        </Button>
      </Actions>
    </Screen>
  );
}
