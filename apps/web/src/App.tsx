import { Navigate, Route, Routes } from 'react-router-dom';
import { Gate } from './pages/Gate';
import { Welcome } from './pages/Welcome';
import { AcceptInvite } from './pages/AcceptInvite';
import { Onboarding } from './pages/client/Onboarding';
import { ClientHome } from './pages/client/Home';
import { PsyClients } from './pages/psychologist/Clients';
import { PsyInvite } from './pages/psychologist/Invite';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Gate />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:code" element={<AcceptInvite />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/home" element={<ClientHome />} />
      <Route path="/p/clients" element={<PsyClients />} />
      <Route path="/p/invite" element={<PsyInvite />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
