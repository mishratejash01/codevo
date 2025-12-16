import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
// Explicitly importing Calendar here
import { LogIn, LogOut, Info, Home, User, Code2, Trophy, Terminal, Calendar } from 'lucide-react'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";

  // Hide header elements on practice/exam/compiler pages
  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > window.innerHeight - 100);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const NavItem = ({ to, icon: Icon, label, active, size = "normal" }: { to: string; icon: any; label: string; active?: boolean, size?: "normal" | "large" }) => (
    <Link 
      to={to} 
      className={cn(
        "flex flex-col items-center justify-center rounded-xl transition-all duration-300 group relative",
        size === "large" ? "p-3 -mt-6 bg-[#0c0c0e] border border-primary/30 shadow-[0_0_20px_rgba(59,130,246,0.2)] z-10" : "p-2",
        active 
          ? (size === "large" ? "text-primary ring-2 ring-primary/50" : "bg-primary/10 text-primary")
          : "text-muted-foreground hover:text-white"
      )}
    >
      <Icon className={cn("transition-transform group-hover:scale-110", size === "large" ? "w-6 h-6" : "w-5 h-5")} />
      {size === "large" && <span className="text-[10px] font-bold mt-1 text-primary animate-pulse">UPSKILL</span>}
      {size !== "large" && <span className="sr-only">{label}</span>}
    </Link>
  );

  return (
    <>
      <header 
        className="fixed z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 transition-all duration-300"
        style={{ top: 'calc(1.25rem + var(--banner-height, 0px))' }}
      >
        <div className={cn(
          "rounded-2xl border border-white/10 shadow-2xl",
          "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
          "transition-all duration-300 hover:border-primary/20"
        )}>
          <nav className="flex items-center justify-between p-2 px-6">
            
            <Link to="/" className="flex items-center gap-3 group mr-8">
              <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                COD
                <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
                VO
              </span>
            </Link>

            <div className="hidden md:flex flex-1 justify-center gap-4">
              <Link to="/degree" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" 
                  alt="IITM" 
                  className="w-4 h-4 object-contain opacity-80" 
                /> 
                IITM BS
              </Link>

              <Link to="/practice-arena" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Code2 className="w-4 h-4" /> Practice
              </Link>

              {/* --- EVENTS LINK WITH ICON --- */}
              <Link to="/events" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Calendar className="w-4 h-4" /> Events
              </Link>
              {/* --------------------------- */}

              <Link to="/compiler" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-purple-400 transition-colors hover:bg-purple-500/10 px-3 py-2 rounded-md border border-transparent hover:border-purple-500/20">
                <Terminal className="w-4 h-4" /> Compiler
              </Link>
              <Link to="/leaderboard" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Trophy className="w-4 h-4" /> Leaderboard
              </Link>
              <Link to="/about" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white transition-colors hover:bg-white/5 px-3 py-2 rounded-md">
                <Info className="w-4 h-4" /> About
              </Link>
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner cursor-pointer hover:bg-white/10 transition-all">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-200 max-w-[100px] truncate">{userName}</span>
                      <div className="relative flex h-2 w-2 ml-1" title="Online">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                      </div>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-[#0c0c0e] border-white/10 text-white">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem className="focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer" onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" /> Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6" onClick={() => navigate('/auth')}>
                  <LogIn className="h-3.5 w-3.5 mr-2" /> Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Bar */}
      <div className={cn(
        "fixed bottom-6 left-6 right-6 z-50 md:hidden transition-all duration-500 transform ease-in-out",
        (!isPracticeOrExam && isScrolled) ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0 pointer-events-none"
      )}>
        <div className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl ring-1 ring-white/5 relative">
          <div className="flex justify-between items-end px-2">
            <div className="flex gap-4">
              <NavItem to="/" icon={Home} label="Home" active={location.pathname === "/"} />
              {/* --- EVENTS LINK (Mobile) --- */}
              <NavItem to="/events" icon={Calendar} label="Events" active={location.pathname.startsWith("/events")} />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3">
               <NavItem to="/practice-arena" icon={Code2} label="Practice" active={location.pathname.startsWith("/practice-arena")} size="large" />
            </div>
            <div className="flex gap-4">
              <NavItem to="/leaderboard" icon={Trophy} label="Rank" active={location.pathname === "/leaderboard"} />
              {session ? (
                 <NavItem to="/profile" icon={User} label="Profile" active={location.pathname === "/profile"} />
              ) : (
                 <NavItem to="/auth" icon={LogIn} label="Login" active={location.pathname === "/auth"} />
              )}
            </div>
          </div>
          <div className="absolute -bottom-6 left-0 right-0 text-center">
             <span className="text-[9px] font-neuropol text-white/20 tracking-widest">CODéVO</span>
          </div>
        </div>
      </div>
    </>
  );
}
