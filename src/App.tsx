import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Practice from "./pages/Practice";
import NotFound from "./pages/NotFound";
import FuzzyText from "@/components/FuzzyText";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/practice" element={<Practice />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      
      {/* Persistent Footer Element */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center pointer-events-none z-[100]">
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-8 py-3 rounded-full shadow-2xl pointer-events-auto">
          <FuzzyText 
            fontSize="2.5rem" 
            fontWeight={800} 
            color="#e4e4e7" 
            baseIntensity={0.15} 
            hoverIntensity={0.4}
            fontFamily="'JetBrains Mono', monospace"
          >
            Built and Maintained by Neural AI
          </FuzzyText>
        </div>
      </div>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
