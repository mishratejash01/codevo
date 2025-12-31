import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LogOut, User, Check, Loader2, ChevronDown, Home, Code2, Trophy, LayoutDashboard, LogIn } from 'lucide-react'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

interface ProfileData {
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_handle: string | null;
  linkedin_url: string | null;
}

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [username, setUsername] = useState('');
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    if (session?.user?.id) fetchProfile();
  }, [session?.user?.id]);

  async function fetchProfile() {
    if (!session?.user?.id) return;
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, avatar_url, bio, github_handle, linkedin_url')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
      if (data.username) setUsername(data.username);
    }
  }

  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameError(null);
      return;
    }
    const timer = setTimeout(async () => {
      if (username.length < 3) return setUsernameError('Too short');
      setIsCheckingUsername(true);
      const { data } = await supabase.from('profiles').select('username').eq('username', username).neq('id', session?.user?.id || '').maybeSingle();
      setIsCheckingUsername(false);
      setUsernameError(data ? 'Taken' : null);
    }, 500);
    return () => clearTimeout(timer);
  }, [username, profile?.username, session?.user?.id]);

  async function saveUsername() {
    if (!session?.user?.id || usernameError || !username) return;
    setIsSavingUsername(true);
    const { error } = await supabase.from('profiles').update({ username }).eq('id', session.user.id);
    setIsSavingUsername(false);
    if (!error) {
      toast.success('Username updated');
      fetchProfile();
    }
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const hasUsername = !!profile?.username;
  const isProfileIncomplete = !profile?.bio || !profile?.avatar_url || !profile?.github_handle || !profile?.username;
  const isProfileComplete = !isProfileIncomplete;
  
  // Dynamic URL: takes the current host (e.g., localhost:3000 or your domain) and the actual username
  const currentHost = window.location.host;
  const displayUrl = `${currentHost}/u/${profile?.username || 'username'}`;
  const qrFullUrl = `${window.location.origin}/u/${profile?.username || ''}`;

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
      <header className="fixed z-50 left-0 right-0 mx-auto w-full max-w-6xl px-4 md:px-0 top-5">
        <div className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl transition-all">
          <nav className="flex items-center justify-between p-2 px-6">
            <Link to="/" className="flex items-center gap-3 group">
              <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white">
                COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
              </span>
            </Link>

            {/* Desktop Navigation Tabs */}
            <div className="hidden md:flex flex-1 justify-center gap-4">
              <Link to="/degree" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors">
                <img src="https://upload.wikimedia.org/wikipedia/en/thumb/6/69/IIT_Madras_Logo.svg/1200px-IIT_Madras_Logo.svg.png" alt="IITM" className="w-4 h-4 object-contain opacity-80" /> 
                IITM BS
              </Link>
              <Link to="/practice-arena" className="text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors">Practice</Link>
              <Link to="/events" className="text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors">Events</Link>
              <Link to="/compiler" className="text-sm font-medium text-muted-foreground hover:text-purple-400 px-3 py-2 transition-colors">Compiler</Link>
              <Link to="/leaderboard" className="text-sm font-medium text-muted-foreground hover:text-white px-3 py-2 transition-colors">Leaderboard</Link>
            </div>

            <div className="flex items-center gap-2">
              {session ? (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[10px] font-bold text-white border border-white/20">
                        {userName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-gray-200">{userName}</span>
                      {/* Glowing Green Online Indicator */}
                      <div className="relative flex h-2 w-2 ml-1">
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                      </div>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </PopoverTrigger>

                  <PopoverContent align="end" sideOffset={12} className="w-[320px] p-8 bg-[#0a0a0a] border border-[#222222] rounded-none shadow-[0_40px_80px_rgba(0,0,0,0.9)] outline-none">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">Public Profile QR</p>
                      
                      <div className="bg-white p-4 inline-block mb-6 rounded-sm relative">
                        <div className={cn(!hasUsername && "blur-md opacity-30")}>
                          <QRCodeSVG value={hasUsername ? qrFullUrl : 'setup'} size={140} />
                        </div>
                        {!hasUsername && (
                          <div className="absolute inset-0 flex items-center justify-center p-4 text-[10px] text-black font-bold uppercase tracking-widest">
                            Set Username
                          </div>
                        )}
                      </div>

                      <p className="text-[#444444] text-[13px] mb-10 tracking-wide font-medium">
                        {displayUrl}
                      </p>

                      <div className="flex flex-col gap-3 text-left">
                        {!hasUsername && (
                          <div className="flex gap-2 mb-4">
                            <Input 
                              value={username} 
                              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} 
                              placeholder="username" 
                              className="h-9 bg-black border-[#222222] text-xs rounded-none focus:border-white" 
                            />
                            <Button size="sm" onClick={saveUsername} disabled={isSavingUsername || !!usernameError} className="h-9 bg-white text-black hover:bg-zinc-200 rounded-none">
                              {isSavingUsername ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Set'}
                            </Button>
                          </div>
                        )}

                        <Link 
                          to="/profile" 
                          onClick={() => setPopoverOpen(false)} 
                          className={cn(
                            "w-full py-4 text-[13px] font-bold uppercase tracking-widest text-center transition-all border", 
                            isProfileIncomplete 
                              ? "bg-red-600 border-red-600 text-white hover:bg-transparent hover:text-red-600" 
                              : "bg-white border-white text-black hover:bg-transparent hover:text-white"
                          )}
                        >
                          {isProfileIncomplete ? 'Complete Your Profile' : 'Edit Profile'}
                        </Link>

                        {/* View Profile link only shows if profile is complete */}
                        {isProfileComplete && (
                          <Link 
                            to={`/u/${profile?.username}`} 
                            onClick={() => setPopoverOpen(false)} 
                            className="text-white text-[13px] font-medium py-3 px-1 hover:text-[#888888] transition-colors"
                          >
                            View Profile
                          </Link>
                        )}

                        <div className="mt-4 pt-4 border-t border-[#222222]">
                          <button onClick={() => { setPopoverOpen(false); onLogout(); }} className="flex items-center w-full text-white text-[13px] font-medium hover:opacity-60 transition-opacity">
                            <LogOut className="mr-3 w-[18px] h-[18px] stroke-[2px]" /> Logout
                          </button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white rounded-xl px-6" onClick={() => navigate('/auth')}>
                  <LogIn className="h-3.5 w-3.5 mr-2" /> Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className={cn("fixed bottom-6 left-6 right-6 z-50 md:hidden transition-all duration-500 transform", (!isPracticeOrExam && isScrolled) ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0 pointer-events-none")}>
        <div className="bg-[#0c0c0e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 shadow-2xl relative">
          <div className="flex justify-between items-end px-2">
            <div className="flex gap-4">
              <NavItem to="/" icon={Home} label="Home" active={location.pathname === "/"} />
              <NavItem to="/events" icon={Code2} label="Events" active={location.pathname.startsWith("/events")} />
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3">
               <NavItem to="/practice-arena" icon={Code2} label="Practice" active={location.pathname.startsWith("/practice-arena")} size="large" />
            </div>
            <div className="flex gap-4">
              <NavItem to="/leaderboard" icon={Trophy} label="Rank" active={location.pathname === "/leaderboard"} />
              {session ? <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === "/dashboard"} /> : <NavItem to="/auth" icon={LogIn} label="Login" active={location.pathname === "/auth"} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
