import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";

// Page Imports
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import ExamResult from "./pages/ExamResult";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DegreeSelection from "./pages/DegreeSelection";
import QuestionSetSelection from "./pages/QuestionSetSelection";
import Leaderboard from "./pages/Leaderboard";
import Compiler from "./pages/Compiler";
import Documentation from "./pages/Documentation";
import PracticeArena from "./pages/PracticeArena";
import PracticeSolver from "./pages/PracticeSolver";
import SubjectOppeSelection from "./pages/SubjectOppeSelection"; 
import SubjectModeSelection from "./pages/SubjectModeSelection";
import Profile from "./pages/Profile";
import About from "./pages/About"; // New Import for About Page

import { SplashScreen } from "@/components/SplashScreen";
import Dock from "@/components/Dock";
import { Footer } from "@/components/Footer";
import { Home, Code2, Trophy, Terminal } from "lucide-react";

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

  if (showSplash) return <SplashScreen />;

  // Hide Dock/Footer on specific routes
  const hideDockRoutes = ['/', '/practice', '/exam', '/compiler', '/auth']; 
  const showDock = !hideDockRoutes.some(path => 
    location.pathname === path || 
    location.pathname.startsWith('/practice') || 
    location.pathname.startsWith('/exam') || 
    location.pathname.startsWith('/compiler')
  );
  
  // UPDATED: Added /u/ and /profile to hidden routes
  const hideFooterRoutes = ['/practice', '/compiler', '/exam', '/auth', '/u/', '/profile'];
  const showFooter = !hideFooterRoutes.some(path => location.pathname.startsWith(path));

  const dockItems = [
    { icon: <Home size={20} />, label: 'Home', onClick: () => navigate('/') },
    { 
      // --- RESTORED ORIGINAL IITM LOGO ---
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
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/about" element={<About />} /> {/* Added About Route */}
        
        <Route path="/practice" element={<Practice />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/exam/result" element={<ExamResult />} />
        
        <Route path="/degree" element={<DegreeSelection />} />
        <Route path="/degree/oppe/:subjectId/:subjectName" element={<SubjectOppeSelection />} />
        <Route path="/degree/mode/:subjectId/:subjectName/:examType" element={<SubjectModeSelection />} />
        <Route path="/degree/sets/:subjectId/:subjectName/:examType/:mode" element={<QuestionSetSelection />} />

        <Route path="/practice-arena" element={<PracticeArena />} />
        <Route path="/practice-arena/:slug" element={<PracticeSolver />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/compiler" element={<Compiler />} />
        <Route path="/docs" element={<Documentation />} />

        <Route path="/u/:username" element={<Profile />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="*" element={<NotFound />} />
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
