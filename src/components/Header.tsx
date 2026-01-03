import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  ChevronDown, 
  ArrowRight,
  Terminal,
  Gamepad2,
  UserCircle,
  ShieldCheck,
  FileText,
  Mail,
  Lock,
  Cookie,
  BookOpen,
  Copy
} from 'lucide-react'; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';

interface HeaderProps { session: Session | null; onLogout: () => void; }

export function Header({ session, onLogout }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  const userName = session?.user?.user_metadata?.full_name || session?.user?.email?.split('@')[0] || "User";
  const isPracticeOrExam = location.pathname.includes('/practice') || location.pathname.includes('/exam') || location.pathname.includes('/compiler');

  useEffect(() => {
    if (session?.user?.id) fetchProfile();
  }, [session?.user?.id]);

  async function fetchProfile() {
    const { data } = await supabase.from('profiles').select('*').eq('id', session?.user?.id).maybeSingle();
    if (data) setProfile(data);
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const displayUrl = `${window.location.host}/u/${profile?.username || 'username'}`;

  return (
    <header className={cn(
      "fixed z-50 left-0 right-0 mx-auto transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] font-sans",
      isScrolled ? "top-6 max-w-7xl px-4 md:px-0" : "top-0 w-full max-w-full px-10 py-6"
    )}>
      <div className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] w-full",
        isScrolled ? "rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 px-10" : "rounded-none border-transparent bg-transparent p-0"
      )}>
        <nav className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
              COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
            </span>
          </Link>

          {/* Navigation Tabs */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-8 mr-8">
            
            {/* Products Mega Dropdown (Hover) */}
            <div className="relative" onMouseEnter={() => setActiveDropdown('products')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-1 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors py-2 group">
                Products
                {/* Refined Arrow Design */}
                <ChevronDown className={cn(
                  "w-3 h-3 stroke-[2.5px] opacity-40 transition-all duration-300", 
                  activeDropdown === 'products' && "rotate-180 opacity-100 text-white"
                )} />
              </button>
              
              {activeDropdown === 'products' && (
                <div className="absolute top-full right-[-150px] w-[850px] bg-[#050505] border border-white/10 rounded-md p-10 grid grid-cols-[1.5fr_1fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="nav-column flex flex-col gap-6">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-2">Our Solutions</p>
                    <div className="grid grid-cols-2 gap-6">
                      <Link to="/compiler" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item">
                        <Terminal className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> 
                        <span className="text-[15px]">Compiler</span>
                      </Link>
                      <Link to="/practice-arena" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item">
                        <Gamepad2 className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> 
                        <span className="text-[15px]">Practice Arena</span>
                      </Link>
                      <Link to="/profile" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item">
                        <UserCircle className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> 
                        <span className="text-[15px]">Profile Card</span>
                      </Link>
                    </div>
                  </div>

                  <div className="featured-section border-l border-white/10 pl-10 flex flex-col gap-6">
                    <p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em]">New Release</p>
                    <div className="group relative rounded-lg overflow-hidden border border-white/5 aspect-[16/9] bg-[#111]">
                       <img src="https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover blur-md opacity-20" />
                       <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                         <p className="text-white/40 text-[13px] font-medium blur-[1.5px] mb-1">Advanced Neural IDE v3</p>
                         <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Coming Soon</p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resources Mega Dropdown (Hover) */}
            <div className="relative" onMouseEnter={() => setActiveDropdown('resources')} onMouseLeave={() => setActiveDropdown(null)}>
              <button className="flex items-center gap-1 text-[14px] font-medium text-muted-foreground hover:text-white transition-colors py-2 group">
                Resources
                {/* Refined Arrow Design */}
                <ChevronDown className={cn(
                  "w-3 h-3 stroke-[2.5px] opacity-40 transition-all duration-300", 
                  activeDropdown === 'resources' && "rotate-180 opacity-100 text-white"
                )} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute top-full right-[-150px] w-[850px] bg-[#050505] border border-white/10 rounded-md p-10 grid grid-cols-[1fr_1fr_1.2fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">CODéVO</p></div>
                  <div className="col-span-1 pl-10"><p className="text-muted-foreground text-[11px] font-semibold uppercase tracking-[0.2em] mb-8">Featured Blog Posts</p></div>

                  <div className="grid grid-cols-2 col-span-2 gap-x-10 gap-y-6">
                    <Link to="/contact" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><Mail className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Contact Us</span></Link>
                    <Link to="/security" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><ShieldCheck className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Security</span></Link>
                    <Link to="/terms" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><FileText className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Terms & Conditions</span></Link>
                    <Link to="/cookies" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><Cookie className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Cookies</span></Link>
                    <Link to="/privacy" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><Lock className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Privacy Policy</span></Link>
                    <Link to="/blog" className="flex items-center gap-4 text-gray-300 hover:text-white transition-all hover:translate-x-1 group/item"><BookOpen className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-white" /> <span className="text-[15px]">Blog</span></Link>
                  </div>

                  <div className="featured-section border-l border-white/10 pl-10 flex flex-col gap-10">
                    {[
                      { title: "MoReBench: Evaluating AI Moral Reasoning", img: "https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" },
                      { title: "The Agentic Era: Building Foundations", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300" }
                    ].map((blog, i) => (
                      <div key={i} className="flex gap-4 relative">
                        <div className="w-[130px] h-[75px] bg-[#111] rounded-md border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={blog.img} className="w-full h-full object-cover blur-md opacity-20" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[14px] text-white/30 blur-[2px] line-clamp-2 leading-tight font-medium mb-1.5">{blog.title}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Coming Soon</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/events" className="text-[14px] font-medium text-muted-foreground hover:text-white transition-colors">Events</Link>

            <Button 
              onClick={() => navigate('/practice-arena')}
              variant="outline" 
              className="group border-white/20 bg-transparent hover:bg-white text-white hover:text-black rounded-full px-6 h-10 text-[13px] font-bold transition-all flex items-center gap-2"
            >
              Try CODéVO Play
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>

          {/* Auth Section */}
          <div className="flex items-center gap-2 shrink-0">
            {session ? (
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-[11px] font-bold text-white border border-white/20">{userName.charAt(0).toUpperCase()}</div>
                    <span className="text-sm font-medium text-gray-200">{userName}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] p-8 bg-[#0a0a0a] border border-[#222222] shadow-[0_40px_80px_rgba(0,0,0,0.9)]">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">Public Profile</p>
                    <div className="bg-white p-4 inline-block mb-6 rounded-sm">
                      <QRCodeSVG value={displayUrl} size={140} />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-10 group cursor-pointer" onClick={() => { navigator.clipboard.writeText(displayUrl); toast.success('Link copied!'); }}>
                      <p className="text-[#444444] text-[13px] font-medium group-hover:text-[#888888]">{displayUrl}</p>
                    </div>
                    <Link to="/profile" className="w-full block py-4 text-[13px] font-bold uppercase tracking-widest bg-white text-black hover:bg-transparent hover:text-white border border-white transition-all">Edit Profile</Link>
                    <div className="mt-4 pt-4 border-t border-[#222222]">
                      <button onClick={onLogout} className="flex items-center w-full text-white text-[13px] font-medium hover:opacity-60 transition-opacity"><LogOut className="mr-3 w-[18px] h-[18px]" /> Logout</button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <Button size="lg" className="bg-white/10 hover:bg-white/20 text-white rounded-full px-7 font-semibold h-10 transition-all border border-white/10 backdrop-blur-md text-[14px]" onClick={() => navigate('/auth')}>Sign in</Button>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
