{
type: "uploaded file",
fileName: "mishratejash01/pycoder-playground/pycoder-playground-a782311e0675fe1aa4ad6c605c2f37df7aa93d6f/src/App.tsx",
fullContent: `
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, Home, BookOpen, User, Trophy, LogOut } from 'lucide-react';

import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import ExamResult from "./pages/ExamResult";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DegreeSelection from "./pages/DegreeSelection";
import QuestionSetSelection from "./pages/QuestionSetSelection";
import Leaderboard from "./pages/Leaderboard";
import { SplashScreen } from "@/components/SplashScreen";
import Dock from "@/components/Dock";

const queryClient = new QueryClient();

// Dock Wrapper Component to handle visibility logic
const DockWrapper = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide dock on Home, Practice, and Exam pages
  const hiddenPaths = ['/', '/practice', '/exam'];
  const shouldHide = hiddenPaths.some(path => location.pathname === path || location.pathname.startsWith('/exam'));

  if (shouldHide) return null;

  const dockItems = [
    {
      icon: <Home className="w-5 h-5" />,
      label: "Home",
      onClick: () => navigate('/'),
    },
    {
      icon: <GraduationCap className="w-5 h-5" />,
      label: "Degree",
      onClick: () => navigate('/degree'),
    },
    {
      icon: <BookOpen className="w-5 h-5" />,
      label: "About",
      onClick: () => navigate('/about'),
    },
    {
      icon: <Trophy className="w-5 h-5" />,
      label: "Leaderboard",
      onClick: () => navigate('/leaderboard'),
    },
    // Center Logo Item
    {
      icon: (
        <span className="font-neuropol text-sm font-bold tracking-wider text-white">
          C<span className="text-[0.8em] lowercase relative -top-[1px]">é</span>V
        </span>
      ),
      label: "CodéVo",
      onClick: () => {}, // Just a visual anchor
      className: "border-primary/30 bg-primary/10"
    }
  ];

  return <Dock items={dockItems} panelHeight={60} baseItemSize={45} magnification={70} className="hidden md:flex" />;
};

const App = () => {
  const [showSplash, setShowSplash] = useState(true);

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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DockWrapper />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/exam" element={<Exam />} />
            <Route path="/exam/result" element={<ExamResult />} />
            <Route path="/degree" element={<DegreeSelection />} />
            <Route path="/degree/sets/:subjectId/:subjectName/:examType/:mode" element={<QuestionSetSelection />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
`
}
