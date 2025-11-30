import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import ExamResult from "./pages/ExamResult"; // Import the result page
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import DegreeSelection from "./pages/DegreeSelection";
import QuestionSetSelection from "./pages/QuestionSetSelection";
import { SplashScreen } from "@/components/SplashScreen";

const queryClient = new QueryClient();

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
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Learning Flow */}
            <Route path="/practice" element={<Practice />} />
            
            {/* Exam Flow */}
            <Route path="/exam" element={<Exam />} />
            <Route path="/exam/result" element={<ExamResult />} /> {/* CRITICAL FIX: Registered Route */}
            
            {/* Selection Flow */}
            <Route path="/degree" element={<DegreeSelection />} />
            <Route path="/degree/sets/:subjectId/:subjectName/:examType/:mode" element={<QuestionSetSelection />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
