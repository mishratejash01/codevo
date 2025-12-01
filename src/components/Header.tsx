{
type: "uploaded file",
fileName: "mishratejash01/pycoder-playground/pycoder-playground-a782311e0675fe1aa4ad6c605c2f37df7aa93d6f/src/components/Header.tsx",
fullContent: `
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, GraduationCap, Info, Home, User, Code, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* --- Desktop & Mobile Top Header --- */}
      <header className="fixed top-5 z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 transition-all duration-300">
        <div className={cn(
          "rounded-2xl border border-white/10 shadow-2xl",
          "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
          "transition-all duration-300 hover:border-primary/20"
        )}>
          <nav className="flex items-center justify-between p-2 px-6">
            
            {/* LEFT: Logo & Live Indicator */}
            <Link to="/" className="flex items-center gap-3 group mr-4">
              <span className={cn(
                "font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white",
                "transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              )}>
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
              {/* Green Signal (Blinking) */}
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
              </div>
            </Link>

            {/* CENTER: Desktop Navigation */}
            <div className="hidden md:flex flex-1 justify-center gap-6">
              <Link to="/degree" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <GraduationCap className="w-4 h-4" />
                IITM BS Degree
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Trophy className="w-4 h-4" />
                Leaderboard
              </Link>
              <Link to="/about" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Info className="w-4 h-4" />
                About
              </Link>
            </div>

            {/* RIGHT: Auth & Profile */}
            <div className="flex items-center gap-2">
              {session ? (
                <>
                  {/* Desktop Profile */}
                  <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner">
                    <span className="text-xs font-medium text-gray-200 max-w-[150px] truncate">{userName}</span>
                    <div className="h-4 w-px bg-white/10 mx-1" />
                    <button onClick={onLogout} className="text-muted-foreground hover:text-white transition-colors" title="Logout">
                      <LogOut className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Mobile Profile Dropdown */}
                  <div className="md:hidden flex items-center gap-2">
                    <span className="text-xs font-medium text-white/80 max-w-[80px] truncate">{userName.split(' ')[0]}</span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full border border-white/10 bg-white/5 p-0">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={session.user.user_metadata.avatar_url} alt={userName} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">{userInitial}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-[#0c0c0e] border-white/10 text-white" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{userName}</p>
                            <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem onClick={onLogout} className="text-red-400 focus:text-red-400 focus:bg-red-950/20 cursor-pointer">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6" onClick={() => navigate('/auth')}>
                  <LogIn className="h-3.5 w-3.5 mr-2" /> Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* --- Mobile Bottom Floating Menu (Redesigned) --- */}
      <div className={cn(
        "fixed bottom-6 left-4 right-4 z-50 md:hidden transition-all duration-500 transform ease-in-out",
        isScrolled || location.pathname !== '/' ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
      )}>
        <div className="bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-2 shadow-2xl ring-1 ring-white/5 relative">
          
          {/* Logo Watermark inside Menu */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 opacity-80 pointer-events-none">
             <div className="h-1 w-12 bg-white/20 rounded-full" />
          </div>

          <div className="grid grid-cols-5 items-end gap-1 h-16">
            
            {/* 1. Home */}
            <Link to="/" className={cn("col-span-1 flex flex-col items-center justify-end pb-2 gap-1 text-muted-foreground hover:text-white transition-colors", location.pathname === '/' && "text-white")}>
              <Home className="w-5 h-5" />
              <span className="text-[9px] font-medium uppercase tracking-wide">Home</span>
            </Link>
            
            {/* 2. IITM BS (Non-Colorful Logo Illustration) */}
            <Link to="/degree" className={cn("col-span-1 flex flex-col items-center justify-end pb-2 gap-1 text-muted-foreground hover:text-white transition-colors", location.pathname.startsWith('/degree') && "text-white")}>
              <GraduationCap className="w-5 h-5" />
              <span className="text-[9px] font-medium uppercase tracking-wide text-center leading-none">IITM BS</span>
            </Link>

            {/* 3. CENTER: Start Upskilling (Prominent) */}
            <div className="col-span-1 relative flex justify-center">
               <Link to="/practice" className="absolute -top-6 bg-gradient-to-tr from-primary to-purple-400 p-4 rounded-full shadow-[0_0_20px_rgba(168,85,247,0.4)] border-4 border-[#0c0c0e] hover:scale-105 transition-transform active:scale-95 group">
                  <Code className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
               </Link>
               <span className="text-[9px] font-bold uppercase tracking-wide text-primary pt-8 pb-2">Practice</span>
            </div>

            {/* 4. Leaderboard */}
            <Link to="/leaderboard" className={cn("col-span-1 flex flex-col items-center justify-end pb-2 gap-1 text-muted-foreground hover:text-white transition-colors", location.pathname === '/leaderboard' && "text-white")}>
              <Trophy className="w-5 h-5" />
              <span className="text-[9px] font-medium uppercase tracking-wide">Rank</span>
            </Link>

            {/* 5. Profile/About */}
            <Link to="/about" className={cn("col-span-1 flex flex-col items-center justify-end pb-2 gap-1 text-muted-foreground hover:text-white transition-colors", location.pathname === '/about' && "text-white")}>
              <Info className="w-5 h-5" />
              <span className="text-[9px] font-medium uppercase tracking-wide">About</span>
            </Link>

          </div>
        </div>
      </div>
    </>
  );
}
`
}
