import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, X, LogIn, LogOut, User, 
  ChevronDown, Trophy, ExternalLink 
} from "lucide-react";
import { Button } from "./ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: "Logged out successfully" });
    navigate("/");
  };

  const isProfileComplete = profile?.full_name && profile?.username && profile?.avatar_url;
  const publicProfileUrl = `codevo.dev/u/${profile?.username || 'user'}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=https://${publicProfileUrl}&bgcolor=ffffff&color=000000`;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
            <span className="text-[#0a0a0a] font-bold text-xl">C</span>
          </div>
          <span className="text-xl font-bold tracking-tighter text-white">CODEVO</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/practice" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Practice</Link>
          <Link to="/events" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Events</Link>
          <Link to="/leaderboard" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Leaderboard</Link>
          
          {loading ? (
            <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 group outline-none">
                  <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-zinc-800">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-white">
                        {profile?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                </button>
              </DropdownMenuTrigger>
              
              <DropdownMenuContent 
                align="end" 
                className="w-[320px] bg-[#0a0a0a] border border-[#222222] p-8 rounded-none shadow-[0_40px_80px_rgba(0,0,0,0.9)]"
              >
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">
                    Public Profile QR
                  </div>

                  <div className="bg-white p-4 inline-block mb-6 rounded-sm">
                    <img 
                      src={qrCodeUrl} 
                      alt="Profile QR" 
                      className="w-40 h-40"
                    />
                  </div>

                  <Link 
                    to={`/u/${profile?.username}`} 
                    className="block text-[#444444] text-[13px] mb-10 hover:text-[#888888] transition-colors tracking-wide"
                  >
                    {publicProfileUrl}
                  </Link>

                  <div className="flex flex-col gap-3 text-left">
                    <Link 
                      to="/profile" 
                      className={`
                        py-4 px-6 text-sm font-bold rounded-sm text-center transition-all duration-200
                        ${!isProfileComplete 
                          ? 'bg-red-600 text-white hover:bg-transparent hover:text-red-600 border border-transparent hover:border-red-600' 
                          : 'bg-white text-black hover:bg-transparent hover:text-white border border-transparent hover:border-white'
                        }
                      `}
                    >
                      Complete Your Profile
                    </Link>

                    <Link 
                      to="/profile" 
                      className="text-white text-sm font-medium py-3 px-1 hover:text-[#888888] transition-colors"
                    >
                      View Profile
                    </Link>

                    <div className="mt-4 pt-4 border-t border-[#222222]">
                      <button 
                        onClick={handleLogout}
                        className="flex items-center w-full text-white text-sm font-medium hover:opacity-60 transition-opacity group"
                      >
                        <LogOut className="mr-3 w-[18px] h-[18px] stroke-[2px]" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" className="border-white/10 hover:bg-white hover:text-[#0a0a0a] text-xs h-9">
                Sign In
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#0a0a0a] border-b border-white/5 py-4 animate-in slide-in-from-top duration-300">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            <Link to="/practice" className="text-zinc-400 py-2" onClick={() => setIsMenuOpen(false)}>Practice</Link>
            <Link to="/events" className="text-zinc-400 py-2" onClick={() => setIsMenuOpen(false)}>Events</Link>
            <Link to="/leaderboard" className="text-zinc-400 py-2" onClick={() => setIsMenuOpen(false)}>Leaderboard</Link>
            {user ? (
              <>
                <Link to="/profile" className="text-white py-2" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="text-red-400 py-2 text-left">Logout</button>
              </>
            ) : (
              <Link to="/auth" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full bg-white text-[#0a0a0a]">Sign In</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
