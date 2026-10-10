import { Navigate, Route, Routes } from 'react-router-dom';
import { Gate } from './pages/Gate';
import { Welcome } from './pages/Welcome';
import { AcceptInvite } from './pages/AcceptInvite';
import { Onboarding } from './pages/client/Onboarding';
import { ClientHome } from './pages/client/Home';
import { Checkin } from './pages/client/Checkin';
import { Practice } from './pages/client/Practice';
import { Done } from './pages/client/Done';
import { History } from './pages/client/History';
import { Settings } from './pages/client/Settings';
import { Crisis } from './pages/client/Crisis';
import { PsyClients } from './pages/psychologist/Clients';
import { PsyInvite } from './pages/psychologist/Invite';
import { PsyClientSummary } from './pages/psychologist/ClientSummary';
import { PsyAssign } from './pages/psychologist/Assign';
import { CharacterDemo } from './pages/dev/CharacterDemo';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Gate />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/invite/:code" element={<AcceptInvite />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/home" element={<ClientHome />} />
      <Route path="/checkin" element={<Checkin />} />
      <Route path="/practice/:id" element={<Practice />} />
      <Route path="/done" element={<Done />} />
      <Route path="/history" element={<History />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/crisis" element={<Crisis />} />
      <Route path="/p/clients" element={<PsyClients />} />
      <Route path="/p/invite" element={<PsyInvite />} />
      <Route path="/p/clients/:id" element={<PsyClientSummary />} />
      <Route path="/p/clients/:id/assign" element={<PsyAssign />} />
      {import.meta.env.DEV && <Route path="/dev/character" element={<CharacterDemo />} />}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
