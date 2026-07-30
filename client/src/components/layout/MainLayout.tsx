import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnboardingWalkthrough } from '../trust/OnboardingWalkthrough';

export function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main
        key={pathname}
        className="flex-1 animate-fade-in"
        style={{ animationDuration: '0.3s' }}
      >
        <Outlet />
      </main>
      <Footer />
      <OnboardingWalkthrough />
    </div>
  );
}

