import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
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

/**
 * SOLID FILLED DROPDOWN ARROW
 * Always pure white (opacity 100) to match your request.
 */
const FilledDropdownArrow = ({ isOpen }: { isOpen: boolean }) => (
  <svg 
    width="8" 
    height="6" 
    viewBox="0 0 8 6" 
    fill="white" 
    xmlns="http://www.w3.org/2000/svg"
    className={cn(
      "transition-transform duration-300 ml-2 shrink-0", 
      isOpen && "rotate-180"
    )}
  >
    <path d="M0 1L4 5L8 1H0Z" />
  </svg>
);

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
    if (session?.user?.id) {
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle()
        .then(({ data }) => data && setProfile(data));
    }
  }, [session?.user?.id]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (isPracticeOrExam) return null;

  const displayUrl = `${window.location.host}/u/${profile?.username || 'username'}`;

  return (
    <header className={cn(
      "fixed z-50 left-0 right-0 mx-auto transition-all duration-700 font-sans",
      isScrolled ? "top-6 max-w-7xl px-4 md:px-0" : "top-0 w-full max-w-full px-10 py-6"
    )}>
      <div className={cn(
        "transition-all duration-700 w-full",
        isScrolled ? "rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl shadow-2xl p-4 px-10" : "p-0"
      )}>
        <nav className="flex items-center justify-between w-full">
          {/* Logo Section */}
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white transition-all duration-300 group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
              COD<span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>VO
            </span>
          </Link>

          {/* Navigation Menu */}
          <div className="hidden md:flex flex-1 justify-end items-center gap-9 mr-8">
            
            {/* PRODUCTS MEGA DROPDOWN (HOVER) */}
            <div 
              className="relative group" 
              onMouseEnter={() => setActiveDropdown('products')} 
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center text-[14px] font-semibold text-white transition-colors py-2 outline-none">
                Products
                <FilledDropdownArrow isOpen={activeDropdown === 'products'} />
              </button>
              
              {activeDropdown === 'products' && (
                <div className="absolute top-full right-[-150px] w-[850px] bg-[#050505] border border-white/10 rounded-sm p-10 grid grid-cols-[1fr_1fr_1.2fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2 text-[11px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">Our Solutions</div>
                  <div className="col-span-1 border-l border-white/10 pl-10 text-[11px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">Ecosystem</div>
                  
                  <div className="grid grid-cols-2 col-span-2 gap-y-7">
                    <Link to="/compiler" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/item">
                      <Terminal className="w-[18px] h-[18px] text-[#666] group-hover/item:text-white" /> 
                      <span className="text-[15px]">Compiler</span>
                    </Link>
                    <Link to="/practice-arena" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/item">
                      <Gamepad2 className="w-[18px] h-[18px] text-[#666] group-hover/item:text-white" /> 
                      <span className="text-[15px]">Practice Arena</span>
                    </Link>
                    <Link to="/profile" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/item">
                      <UserCircle className="w-[18px] h-[18px] text-[#666] group-hover/item:text-white" /> 
                      <span className="text-[15px]">Profile Card</span>
                    </Link>
                  </div>

                  <div className="border-l border-white/10 pl-10 flex flex-col gap-6">
                    <div className="relative rounded-md overflow-hidden border border-white/10 aspect-video bg-[#111]">
                       <img src="https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" className="w-full h-full object-cover blur-lg opacity-20" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-white/40 text-[14px] font-medium blur-[2.5px] leading-tight">Neural IDE v3</p>
                        <p className="text-[11px] text-[#666] font-bold uppercase tracking-widest mt-2">Coming Soon</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RESOURCES MEGA DROPDOWN (HOVER) */}
            <div 
              className="relative group" 
              onMouseEnter={() => setActiveDropdown('resources')} 
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button className="flex items-center text-[14px] font-semibold text-white transition-colors py-2 outline-none">
                Resources
                <FilledDropdownArrow isOpen={activeDropdown === 'resources'} />
              </button>

              {activeDropdown === 'resources' && (
                <div className="absolute top-full right-[-150px] w-[850px] bg-[#050505] border border-white/10 rounded-sm p-10 grid grid-cols-[1fr_1fr_1.2fr] gap-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-3xl animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2 text-[11px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">CODéVO</div>
                  <div className="col-span-1 border-l border-white/10 pl-10 text-[11px] font-bold text-[#666] uppercase tracking-[0.2em] mb-2">Featured Blog Posts</div>

                  <div className="grid grid-cols-2 col-span-2 gap-y-7">
                    <Link to="/contact" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><Mail className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Contact Us</span></Link>
                    <Link to="/security" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><ShieldCheck className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Security</span></Link>
                    <Link to="/terms" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><FileText className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Terms & Conditions</span></Link>
                    <Link to="/cookies" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><Cookie className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Cookies</span></Link>
                    <Link to="/privacy" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><Lock className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Privacy Policy</span></Link>
                    <Link to="/blog" className="flex items-center gap-4 text-[#e0e0e0] hover:text-white hover:translate-x-1 transition-all group/res"><BookOpen className="w-[18px] h-[18px] text-[#666] group-hover/res:text-white" /> <span className="text-[15px]">Blog</span></Link>
                  </div>

                  <div className="border-l border-white/10 pl-10 flex flex-col gap-10">
                    {[
                      { title: "MoReBench: Evaluating AI Moral Reasoning", img: "https://images.unsplash.com/photo-1614850523296-e8c041de4398?auto=format&fit=crop&q=80&w=300" },
                      { title: "The Agentic Era: Building Foundations", img: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=300" }
                    ].map((blog, i) => (
                      <div key={i} className="flex gap-4 items-start">
                        <div className="w-[130px] h-[75px] bg-[#111] rounded-md border border-white/10 overflow-hidden flex-shrink-0">
                          <img src={blog.img} className="w-full h-full object-cover blur-md opacity-20" />
                        </div>
                        <div className="flex flex-col">
                          <p className="text-[14px] text-white/30 blur-[2px] font-medium leading-tight">{blog.title}</p>
                          <p className="text-[10px] text-[#666] font-bold uppercase tracking-widest mt-2">Coming Soon</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/events" className="text-[14px] font-semibold text-white hover:opacity-80 transition-opacity">Events</Link>

            {/* Try CODéVO Play Button */}
            <Button 
              onClick={() => navigate('/practice-arena')}
              className="group border border-white/20 bg-transparent hover:bg-white text-white hover:text-black rounded-full px-6 h-10 text-[13px] font-bold transition-all flex items-center gap-2"
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
                    <span className="text-sm font-semibold text-white">{userName}</span>
                    <FilledDropdownArrow isOpen={popoverOpen} />
                  </div>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-[320px] p-8 bg-[#0a0a0a] border border-[#222222] shadow-[0_40px_80px_rgba(0,0,0,0.9)] outline-none">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#888888] mb-8">Public Profile</p>
                    <div className="bg-white p-4 inline-block mb-6 rounded-sm">
                      <QRCodeSVG value={displayUrl} size={140} />
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
