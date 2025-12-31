// src/pages/Auth.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) navigate("/");
    };
    checkSession();

    // 1. Function to initialize Google
    const initGoogle = () => {
      if ((window as any).google) {
        setIsGoogleLoaded(true);
        (window as any).google.accounts.id.initialize({
          client_id: "29616950088-p64jd8affh5s0q1c3eq48fgfn9mu28e2.apps.googleusercontent.com",
          callback: handleGoogleResponse,
          auto_select: false,
          itp_support: true
        });

        // 2. Render the invisible real Google button inside our ref
        if (googleBtnRef.current) {
          (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
            theme: "outline",
            size: "large",
            width: "100%", // Matches your UI
          });
        }
      }
    };

    // 3. Poll for Google script if not yet loaded
    const interval = setInterval(() => {
      if ((window as any).google) {
        initGoogle();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    try {
      console.log("Google Response received, signing in to Supabase...");
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      });

      if (error) throw error;
      if (data.session) navigate("/");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleCustomButtonClick = () => {
    if (!isGoogleLoaded) {
      toast({
        title: "Wait a moment",
        description: "Google services are still loading...",
      });
      return;
    }

    // This finds the real hidden Google button and clicks it for the user
    const googleIframeButton = googleBtnRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (googleIframeButton) {
      googleIframeButton.click();
    } else {
      // Fallback to prompt if rendering hasn't finished
      (window as any).google.accounts.id.prompt();
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex overflow-hidden">
      <div className="w-full lg:w-1/2 flex flex-col p-8 md:p-12 lg:p-20 relative z-10 bg-[#09090b]">
        <Button 
          variant="ghost" 
          className="self-start text-muted-foreground hover:text-white mb-12 -ml-4 rounded-xl"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Welcome back</h1>
            <p className="text-muted-foreground">Sign in to codevo.co.in to continue.</p>
          </div>

          <div className="grid gap-4 relative">
            {/* This is the actual Google button. 
              We hide it behind your styled button using opacity-0 
            */}
            <div ref={googleBtnRef} className="absolute inset-0 opacity-0 z-20 cursor-pointer pointer-events-auto" />
            
            <Button 
              variant="outline" 
              className={cn(
                "w-full h-12 bg-white text-black border-none font-medium text-base relative z-10",
                "flex items-center justify-center gap-3 transition-all duration-200",
                "hover:bg-gray-200 hover:scale-[1.02]", 
                "rounded-xl"
              )}
              disabled={loading || !isGoogleLoaded}
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
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
          
          {/* ... Brand text and rest of component ... */}
        </div>
      </div>
      {/* ... Right side video ... */}
    </div>
  );
};

export default Auth;
