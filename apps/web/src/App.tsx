import { Route, Routes } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { HealthResponse } from '@psydog/shared';

function Placeholder() {
  const health = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<HealthResponse> => {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
  });

  return (
    <main className="mx-auto max-w-md p-4">
      <h1 className="text-xl font-semibold">Привет. Здесь скоро будет малыш</h1>
      <p className="mt-2 text-hint">
        API: {health.isPending ? '…' : health.data?.ok ? 'на связи' : 'недоступен'}
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
