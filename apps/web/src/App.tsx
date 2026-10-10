import { Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { MeResponse } from '@psydog/shared';
import { api } from './lib/api';

function Placeholder() {
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<MeResponse>('/me') });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold">
        Привет{me.data?.firstName ? `, ${me.data.firstName}` : ''}. Здесь скоро будет малыш
      </h1>
      <p className="mt-2 text-hint">
        {me.isPending
          ? 'Загружаемся…'
          : me.data
            ? `Telegram ID ${me.data.tgId}, роль: ${me.data.role ?? 'пока не выбрана'}`
            : 'Не получилось связаться с сервером'}
      </p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  );
}
