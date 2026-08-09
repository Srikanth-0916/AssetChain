import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { Footer } from './Footer';
import { OnboardingWalkthrough } from '../trust/OnboardingWalkthrough';

export function MainLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-[#030712]">
      {/* Ambient background glow nodes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-indigo-600/[0.04] blur-[150px] animate-pulse-glow" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[140px]" />
      </div>

      <Header />
      
      <AnimatePresence mode="wait">
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 relative z-10"
        >
          <Outlet />
        </motion.main>
      </AnimatePresence>

      <Footer />
      <OnboardingWalkthrough />
    </div>
  );
}

