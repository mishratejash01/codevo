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
      <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-[100]">
        <div className="bg-black/40 backdrop-blur-sm border border-white/5 px-4 py-1.5 rounded-full shadow-2xl">
          <FuzzyText 
            fontSize="0.75rem" 
            fontWeight={600} 
            color="#a1a1aa" 
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
