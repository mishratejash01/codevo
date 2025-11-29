import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Custom Typewriter Hook ---
const useTypewriter = (text: string, speed: number = 50, startDelay: number = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed, started]);

  return displayText;
};
// ---------------------------

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Typewriter text for the video overlay
  const typewriterText = useTypewriter("Built and Maintained by Neural AI", 60, 1200);

  // Redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/");
    };
    checkSession();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex overflow-hidden">
      {/* LEFT SIDE: Form & Branding */}
      <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-12 lg:p-20 relative z-10 bg-[#09090b]">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          className="self-start text-muted-foreground hover:text-white mb-12 -ml-4 rounded-xl"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-muted-foreground">Please sign in to continue.</p>
          </div>

          <div className="grid gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "w-full h-12 bg-white text-black border-none font-medium text-base",
                "flex items-center justify-center gap-3 transition-all duration-200",
                "hover:bg-gray-200 hover:scale-[1.02]", 
                "rounded-xl"
              )}
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
                    <path d="M12.0003 20.45c4.6667 0 8.45-3.7833 8.45-8.45 0-4.6667-3.7833-8.45-8.45-8.45-4.6667 0-8.45 3.7833-8.45 8.45 0 4.6667 3.7833 8.45 8.45 8.45Z" fill="#fff" fillOpacity="0" stroke="none"/>
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </>
              )}
            </Button>
          </div>

          {/* Branding Section with Light Ray Animation */}
          <div className="pt-8 border-t border-white/10 mt-8">
            <div className="flex flex-col items-center justify-center space-y-3 opacity-90 transition-opacity cursor-default">
              <span className={cn(
                "font-neuropol text-2xl font-bold tracking-wider text-white",
                "drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
              )}>
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
              
              <span className="text-[10px] uppercase tracking-[0.3em] font-medium animate-light-ray whitespace-nowrap">
                A Product of Unknown IITians
              </span>
            </div>
          </div>
        </div>
        
        {/* Footer Copyright */}
        <div className="mt-auto text-xs text-muted-foreground hidden lg:block">
          &copy; {new Date().getFullYear()} CODéVO. All rights reserved.
        </div>
      </div>

      {/* RIGHT SIDE: Video Background */}
      <div className="hidden lg:block lg:w-1/2 bg-[#0c0c0e] relative h-screen">
        {/* Fixed: Removed 'relative' and 'z-0' to allow absolute inset-0 to fill parent height */}
        <div className="absolute inset-0 m-4 rounded-[40px] overflow-hidden border border-white/10 bg-black shadow-2xl">
           <video 
             src="https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/efecto-recording-2025-11-29T22-59-44.webm"
             autoPlay 
             loop 
             muted 
             playsInline 
             className="w-full h-full object-cover opacity-80"
           />
           
           {/* Overlay Gradient for text readability */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20 pointer-events-none z-10" />

           {/* TYPEWRITER TEXT OVERLAY */}
           <div className="absolute bottom-10 inset-x-0 flex justify-center z-20 pointer-events-none">
             <div className="bg-black/40 backdrop-blur-sm px-6 py-3 rounded-full border border-white/5">
               <p className={cn(
                 "text-white/90 text-sm font-mono tracking-wider",
                 "flex items-center gap-1",
                 "drop-shadow-lg"
               )}>
                 {typewriterText}
                 <span className="animate-pulse w-[2px] h-[1.2em] bg-green-400 inline-block shadow-[0_0_8px_rgba(74,222,128,0.8)]"></span>
               </p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
