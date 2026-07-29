import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnboardingWalkthrough } from '../trust/OnboardingWalkthrough';

export function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-600 selection:text-white">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <OnboardingWalkthrough />
    </div>
  );
}
