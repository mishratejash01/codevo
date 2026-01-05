import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import Dock from "@/components/Dock";
import { Footer } from "@/components/Footer";
// Imported standard non-colored icons
import { Code2, Calendar, User, Terminal } from "lucide-react"; 

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
      icon: <Code2 size={20} />, 
      label: 'Practice', 
      onClick: () => navigate('/practice-arena') 
    },
    {
      icon: <Terminal size={20} />,
      label: 'Compiler',
      onClick: () => navigate('/compiler')
    },
    { 
      icon: <Calendar size={20} />, 
      label: 'Events', 
      onClick: () => navigate('/events') 
    }, 
    { 
      icon: <User size={20} />, 
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
