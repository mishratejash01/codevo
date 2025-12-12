import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner"; // Import toast for debug

import { SplashScreen } from "@/components/SplashScreen";
import Dock from "@/components/Dock";
import { Footer } from "@/components/Footer";
import { Home, Code2, Trophy, Terminal } from "lucide-react";

import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { AppRoutes } from "./routes";

const queryClient = new QueryClient();

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("has_seen_splash");
    if (hasSeenSplash) {
      setShowSplash(false);
    } else {
      sessionStorage.setItem("has_seen_splash", "true");
      const timer = setTimeout(() => setShowSplash(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // --- AUTOMATIC ROUTE SYNC LOGIC (DEBUG VERSION) ---
  useEffect(() => {
    const syncRoutes = async () => {
      console.log("🚀 Starting Route Sync...");
      
      const routeData = AppRoutes.map(route => ({
        path: route.path,
        name: route.name,
        last_seen_at: new Date().toISOString()
      }));

      // Check if we can reach Supabase
      const { error } = await supabase
        .from('app_routes')
        .upsert(routeData, { onConflict: 'path' });

      if (error) {
        console.error("❌ Sync Error:", error);
        toast.error(`Route Sync Failed: ${error.message}`);
      } else {
        console.log("✅ Sync Success!");
        // Only show success toast once to confirm it works, then you can comment this out
        // toast.success("Routes synced to Database!"); 
      }
    };

    // Run immediately on load
    syncRoutes();
  }, []);
  // --------------------------------------------------

  const hideDockRoutes = ['/', '/practice', '/exam', '/compiler', '/auth']; 
  const showDock = !hideDockRoutes.some(path => 
    location.pathname === path || 
    location.pathname.startsWith('/practice') || 
    location.pathname.startsWith('/exam') || 
    location.pathname.startsWith('/compiler')
  );
  
  const hideFooterRoutes = ['/practice', '/compiler', '/exam', '/auth', '/u/', '/profile'];
  const showFooter = !hideFooterRoutes.some(path => location.pathname.startsWith(path));

  const dockItems = [
    { icon: <Home size={20} />, label: 'Home', onClick: () => navigate('/') },
    { 
      icon: <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" alt="IITM" className="w-6 h-6 object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />, 
      label: 'IITM BS', 
      onClick: () => navigate('/degree') 
    },
    { icon: <Code2 size={20} />, label: 'Practice', onClick: () => navigate('/practice-arena') },
    { icon: <Terminal size={20} />, label: 'Compiler', onClick: () => navigate('/compiler') },
    { icon: <Trophy size={20} />, label: 'Ranks', onClick: () => navigate('/leaderboard') },
  ];

  return (
    <>
      <AnnouncementBanner />

      <Routes>
        {AppRoutes.map((route) => (
          <Route 
            key={route.path} 
            path={route.path} 
            element={<route.component />} 
          />
        ))}
      </Routes>

      {showFooter && <Footer />}
      {showDock && <Dock items={dockItems} baseItemSize={45} magnification={60} />}
    </>
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
