import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import Exam from "./pages/Exam";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import SubjectOppeSelection from "./pages/SubjectOppeSelection";
import SubjectModeSelection from "./pages/SubjectModeSelection"; 
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
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            
            {/* Standard Playground Routes */}
            <Route path="/practice" element={<Practice />} />
            <Route path="/exam" element={<Exam />} />
            
            {/* IITM Routes */}
            
            {/* Step 1: Select OPPE 1 or 2 */}
            <Route path="/degree/subject/:subjectId/:subjectName" element={<SubjectOppeSelection />} />
            
            {/* Step 2: Select Mode (Learning/Exam) - Now includes examType */}
            <Route path="/degree/mode/:subjectId/:subjectName/:examType" element={<SubjectModeSelection />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
