import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Optional Background Element: A very subtle spotlight effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-900/10 via-transparent to-amber-900/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-8 p-4">
        
        {/* 404 Glitch/Glow Effect */}
        <h1 className={cn(
          "font-neuropol text-8xl md:text-9xl font-bold tracking-widest text-white",
          "drop-shadow-[0_0_35px_rgba(255,255,255,0.25)]", // Premium Glow
          "select-none"
        )}>
          404
        </h1>

        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-wide">
            Page Not Found
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Buttons Container */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
          
          {/* HOME BUTTON: Bluish/Cool Tone */}
          <Button 
            variant="outline"
            onClick={() => navigate("/")}
            className={cn(
              "h-12 px-8 rounded-xl border-blue-500/30 text-blue-400",
              "hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-500/60",
              "transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
            )}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Return Home
          </Button>

          {/* VISIT UNKNOWN IITIANS BUTTON: Premium Golden Gradient */}
          <Button 
            className={cn(
              "h-12 px-8 rounded-xl border-none text-black font-bold",
              // Golden Gradient
              "bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-600",
              "hover:opacity-90 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]",
              "transition-all duration-300"
            )}
            onClick={() => window.open("https://unknowniitians.com", "_blank")} // Replace with actual URL
          >
            Visit Unknown IITians
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>

        </div>
      </div>
    </div>
  );
};

export default NotFound;
