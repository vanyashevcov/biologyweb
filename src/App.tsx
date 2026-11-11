import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';

import quest from './content/quest.uk.json';
import { HelixJournal } from './components/HelixJournal/HelixJournal';
import { OutbreakAlert } from './components/OutbreakAlert/OutbreakAlert';
import { SplashVideo } from './components/SplashVideo/SplashVideo';
import { Briefing } from './screens/Briefing/Briefing';
import { Centrifuge } from './screens/Centrifuge/Centrifuge';
import { Cryo } from './screens/Cryo/Cryo';
import { FloorPlan } from './screens/FloorPlan/FloorPlan';
import { Immunology } from './screens/Immunology/Immunology';
import { Mendel } from './screens/Mendel/Mendel';
import { Summary } from './screens/Summary/Summary';
import { Teacher } from './screens/Teacher/Teacher';
import { Vault } from './screens/Vault/Vault';
import { VirusLibrary } from './screens/VirusLibrary/VirusLibrary';
import { unlockAudioOnGesture } from './lib/alarm';
import { useQuest } from './store/questStore';

unlockAudioOnGesture();

const LABS = {
  '1': Centrifuge,
  '2': VirusLibrary,
  '3': Immunology,
  '4': Cryo,
  '5': Mendel,
} as const;

function LabRoute() {
  const { num = '' } = useParams();
  const Screen = LABS[num as keyof typeof LABS];
  return Screen ? <Screen key={num} /> : <Navigate to="/plan" replace />;
}

function useSpreadClock() {
  const enabled = useQuest((s) => s.settings.spreadEnabled);
  useEffect(() => {
    const tick = () => useQuest.getState().tick();
    tick();
    const id = window.setInterval(tick, 10_000);
    return () => window.clearInterval(id);
  }, [enabled]);
}

function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Shell() {
  const { pathname } = useLocation();
  useSpreadClock();
  const showJournal = !pathname.startsWith('/teacher') && !pathname.startsWith('/summary');

  return (
    <>
      <a className="skip-link" href="#main" onClick={(event) => {
        event.preventDefault();
        document.getElementById('main')?.focus();
      }}>
        {quest.ui.skipToContent}
      </a>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Briefing />} />
        <Route path="/plan" element={<FloorPlan />} />
        <Route path="/lab/:num" element={<LabRoute />} />
        <Route path="/vault" element={<Vault />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/teacher" element={<Teacher />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showJournal ? <HelixJournal /> : null}
      <OutbreakAlert />
      <SplashVideo />
    </>
  );
}

export function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
