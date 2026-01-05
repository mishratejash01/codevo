import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Dock from "@/components/Dock";
import { Footer } from "@/components/Footer";
import { User } from "lucide-react"; 

import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AppRoutes } from "./routes";
import { useTimeTracking } from "@/hooks/useTimeTracking";
import AvailabilityGuard from "@/components/AvailabilityGuard";

// --- IMPORT THE VERIFICATION PAGE ---
import VerifyRegistration from "@/pages/VerifyRegistration";

const queryClient = new QueryClient();

// --- CUSTOM ICONS FOR DOCK ---

// 1. NEW Home Icon (Modified: No chimney, White color)
const HomeIcon = () => (
  <svg viewBox="0 0 180 180" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Roof Chevron */}
    <path 
      d="M 20 75 L 90 15 L 160 75" 
      stroke="white" 
      strokeWidth="24" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    />
    
    {/* House Body */}
    <path 
      d="M 90 50 L 160 95 L 160 150 Q 160 160 150 160 L 110 160 L 110 135 Q 110 120 90 120 Q 70 120 70 135 L 70 160 L 30 160 Q 20 160 20 150 L 20 95 Z" 
      fill="white" 
    />
  </svg>
);

// 2. Practice Icon (Reduced size with padding)
const PracticeIcon = () => (
  <div className="w-full h-full p-2">
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="22" y="18" width="45" height="65" rx="2" fill="#e5e7eb" />
      <rect fill="#334155" x="35" y="14" width="20" height="8" rx="2" />
      <circle fill="#475569" cx="45" cy="18" r="2" />
      <text x="45" y="32" textAnchor="middle" fill="#f59e0b" fontSize="8" fontWeight="900" fontFamily="sans-serif" letterSpacing="0.5">TEST</text>
      <rect x="28" y="40" width="10" height="10" rx="1" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <line x1="42" y1="43" x2="60" y2="43" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="48" x2="55" y2="48" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="55" width="10" height="10" rx="1" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <path d="M28 60 L33 65 L42 53" fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="42" y1="58" x2="60" y2="58" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="63" x2="55" y2="63" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="28" y="70" width="10" height="10" rx="1" fill="none" stroke="#9ca3af" strokeWidth="1.5" />
      <line x1="42" y1="73" x2="60" y2="73" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42" y1="78" x2="55" y2="78" stroke="#4b5563" strokeWidth="2.5" strokeLinecap="round" />
      <rect fill="rgba(0,0,0,0.1)" x="76" y="34" width="8" height="42" rx="1" />
      <rect fill="#0ea5e9" x="73" y="30" width="8" height="42" rx="1" />
      <path fill="#1e293b" d="M73 72 L77 82 L81 72 Z" />
      <path fill="#fca5a5" d="M73 34 A 4 4 0 0 1 81 34 V 30 H 73 V 34 Z" />
    </svg>
  </div>
);

// 3. Compiler Icon (Reduced size with padding)
const CompilerIcon = () => (
  <div className="w-full h-full p-2.5">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
      <rect x="20" y="30" width="60" height="40" rx="4" fill="#222" stroke="#666" strokeWidth="4" />
      <text x="30" y="55" fill="#00ff00" fontFamily="monospace" fontSize="14" fontWeight="bold">{">_"}</text>
    </svg>
  </div>
);

// 4. Events Icon (Reduced size with padding)
const EventsIcon = () => (
  <div className="w-full h-full p-2">
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[2px_2px_0px_rgba(0,0,0,0.5)]">
      {/* Sketchy Rings */}
      <rect x="28" y="5" width="8" height="20" rx="2" fill="#a8dadc" stroke="#1a1a1a" strokeWidth="3" />
      <rect x="64" y="5" width="8" height="20" rx="2" fill="#a8dadc" stroke="#1a1a1a" strokeWidth="3" />
      
      {/* Body */}
      <rect x="15" y="18" width="70" height="75" rx="4" fill="white" stroke="#1a1a1a" strokeWidth="3" />
      
      {/* Red Banner */}
      <path d="M15 25 A 4 4 0 0 1 19 21 H 81 A 4 4 0 0 1 85 25 V 38 H 15 Z" fill="#e63946" stroke="none" />
      <line x1="15" y1="38" x2="85" y2="38" stroke="#1a1a1a" strokeWidth="3" />
      
      {/* Grid Dots */}
      <g fill="#a8dadc" stroke="#1a1a1a" strokeWidth="1.5">
        <rect x="24" y="48" width="10" height="6" rx="1" />
        <rect x="38" y="48" width="10" height="6" rx="1" />
        <rect x="52" y="48" width="10" height="6" rx="1" />
        <rect x="66" y="48" width="10" height="6" rx="1" />

        <rect x="24" y="62" width="10" height="6" rx="1" />
        <rect x="38" y="62" width="10" height="6" rx="1" />
        <rect x="52" y="62" width="10" height="6" rx="1" />
        <rect x="66" y="62" width="10" height="6" rx="1" />
      </g>
    </svg>
  </div>
);

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useTimeTracking();

  useEffect(() => {
    const syncRoutes = async () => {
      const routeData = AppRoutes.map(route => ({
        path: route.path,
        name: route.name,
        last_seen_at: new Date().toISOString()
      }));

      await supabase
        .from('app_routes')
        .upsert(routeData, { onConflict: 'path' });
    };
    syncRoutes();
  }, []);

  // --- HIDE NAVIGATION ON VERIFICATION PAGE ---
  const hideDockRoutes = ['/', '/practice', '/exam', '/compiler', '/auth', '/verify']; 
  const showDock = !hideDockRoutes.some(path => 
    location.pathname === path || 
    location.pathname.startsWith('/practice') || 
    location.pathname.startsWith('/exam') || 
    location.pathname.startsWith('/compiler') ||
    location.pathname.startsWith('/verify')
  );
  
  const hideFooterRoutes = ['/practice', '/compiler', '/exam', '/auth', '/u/', '/profile', '/verify'];
  const showFooter = !hideFooterRoutes.some(path => location.pathname.startsWith(path));

  // --- UPDATED DOCK ITEMS ---
  const dockItems = [
    { 
      icon: <HomeIcon />, 
      label: 'Home', 
      onClick: () => navigate('/') 
    },
    { 
      icon: <PracticeIcon />, 
      label: 'Practice', 
      onClick: () => navigate('/practice-arena') 
    },
    {
      icon: <CompilerIcon />,
      label: 'Compiler',
      onClick: () => navigate('/compiler')
    },
    { 
      icon: <EventsIcon />, 
      label: 'Events', 
      onClick: () => navigate('/events') 
    }, 
    { 
      // Wrapped User icon in padding to match balance
      icon: <div className="p-1"><User className="w-full h-full" /></div>, 
      label: 'Profile', 
      onClick: () => navigate('/profile') 
    },
  ];

  const getSectionKey = (path: string): string | null => {
    if (path.startsWith('/degree') || path === '/exam' || path.startsWith('/exam/')) return 'iitm_bs';
    if (path === '/practice-arena' || path.startsWith('/practice-arena/') || path === '/practice' || path.startsWith('/practice/')) return 'practice';
    // --- MAP VERIFY PAGE TO EVENTS GUARD ---
    if (path === '/events' || path.startsWith('/events/') || path.startsWith('/verify/')) return 'events';
    if (path === '/compiler') return 'compiler';
    if (path === '/leaderboard') return 'leaderboard';
    if (path === '/about') return 'about';
    return null;
  };

  return (
    <AvailabilityGuard sectionKey="main_website">
      <AnnouncementBanner />
      <Routes>
        {/* --- MANUAL ROUTE FOR QR SCAN VERIFICATION --- */}
        <Route 
          path="/verify/:registrationId" 
          element={
            <AvailabilityGuard sectionKey="events">
              <VerifyRegistration />
            </AvailabilityGuard>
          } 
        />

        {AppRoutes.map((route) => {
          const sectionKey = getSectionKey(route.path);
          const RouteElement = <route.component />;
          return (
            <Route 
              key={route.path} 
              path={route.path} 
              element={
                sectionKey ? (
                  <AvailabilityGuard sectionKey={sectionKey}>
                    {RouteElement}
                  </AvailabilityGuard>
                ) : RouteElement
              }
            />
          );
        })}
      </Routes>
      {showFooter && <Footer />}
      {showDock && <Dock items={dockItems} baseItemSize={45} magnification={60} />}
    </AvailabilityGuard>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
