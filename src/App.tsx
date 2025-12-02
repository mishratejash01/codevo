import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import ExamResult from "./pages/ExamResult";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DegreeSelection from "./pages/DegreeSelection";
import QuestionSetSelection from "./pages/QuestionSetSelection";
import Leaderboard from "./pages/Leaderboard";
import Compiler from "./pages/Compiler"; // Import the new page
import { SplashScreen } from "@/components/SplashScreen";
import Dock from "@/components/Dock";
import { Home, Code2, Trophy, Terminal } from "lucide-react";

const queryClient = new QueryClient();

// Wrapper to handle Dock Visibility and Navigation Logic
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

  if (showSplash) return <SplashScreen />;

  // Define routes where Dock should NOT appear
  const hideDockRoutes = ['/', '/practice', '/exam', '/compiler']; // Hide dock on Compiler too as it has full layout
  const showDock = !hideDockRoutes.some(path => location.pathname === path || location.pathname.startsWith('/practice') || location.pathname.startsWith('/exam') || location.pathname.startsWith('/compiler'));

  const dockItems = [
    { 
      icon: <Home size={20} />, 
      label: 'Home', 
      onClick: () => navigate('/') 
    },
    { 
      // IITM Logo Block - Redirects to BS Degree Page
      icon: <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" alt="IITM" className="w-6 h-6 object-contain opacity-80 grayscale hover:grayscale-0 transition-all" />, 
      label: 'IITM BS', 
      onClick: () => navigate('/degree') 
    },
    { 
      // Compiler Shortcut in Dock
      icon: <Terminal size={20} />, 
      label: 'Compiler', 
      onClick: () => navigate('/compiler') 
    },
    { 
      // Upskill Block - Disabled for now
      icon: <Code2 size={20} className="opacity-50" />, 
      label: 'Upskill (Coming Soon)', 
      onClick: undefined // Disabled
    },
    { 
      icon: <Trophy size={20} />, 
      label: 'Ranks', 
      onClick: () => navigate('/leaderboard') 
    },
  ];

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        
        {/* Learning Flow */}
        <Route path="/practice" element={<Practice />} />
        
        {/* Exam Flow */}
        <Route path="/exam" element={<Exam />} />
        <Route path="/exam/result" element={<ExamResult />} />
        
        {/* Selection Flow */}
        <Route path="/degree" element={<DegreeSelection />} />
        <Route path="/degree/sets/:subjectId/:subjectName/:examType/:mode" element={<QuestionSetSelection />} />
        
        {/* Tools & Analytics */}
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/compiler" element={<Compiler />} /> {/* Added Route */}
        
        <Route path="*" element={<NotFound />} />
      </Routes>

      {/* Dock - Visible on Mobile and Desktop if showDock is true */}
      {showDock && (
        <div>
          <Dock 
            items={dockItems} 
            baseItemSize={45}
            magnification={60}
          />
        </div>
      )}
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
