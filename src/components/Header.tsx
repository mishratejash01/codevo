import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Session } from '@supabase/supabase-js';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LogIn, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  session: Session | null;
  onLogout: () => void;
}

export function Header({ session, onLogout }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const links = [
    { label: 'Testimonials', href: '/testimonials' },
    { label: 'About', href: '/about' },
  ];

  const userName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email;

  return (
    <header className="fixed top-5 z-50 left-0 right-0 mx-auto w-full max-w-4xl px-4 md:px-0 transition-all duration-300">
      <div className={cn(
        "rounded-2xl border border-white/10 shadow-2xl",
        "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
        "transition-all duration-300 hover:border-primary/20"
      )}>
        <nav className="flex items-center justify-between p-2 px-6">
          
          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className={cn(
              "font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white",
              "transition-all duration-300",
              // RESTORED: Minimal White Glow on Hover
              "group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            )}>
              COD
              <span className="text-[1.2em] lowercase relative top-[1px] mx-[1px] inline-block">é</span>
              VO
            </span>
          </Link>

          {/* CENTER: Desktop Links */}
          <div className="hidden md:flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  buttonVariants({ variant: 'ghost', size: 'sm' }),
                  "text-muted-foreground hover:text-white hover:bg-white/10 rounded-xl px-4 transition-all"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT: Auth & Mobile Menu */}
          <div className="flex items-center gap-2">
            {session ? (
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md shadow-inner group transition-all hover:bg-white/10 hover:border-white/20">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </div>
                
                <span className="text-xs font-medium text-gray-200 max-w-[150px] truncate select-none">
                  {userName}
                </span>
                
                <div className="h-4 w-px bg-white/10 mx-1" />

                <button 
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Button 
                size="sm" 
                className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-xl px-6 transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-3.5 w-3.5 mr-2" />
                Login
              </Button>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="top" className="w-full bg-[#09090b]/95 backdrop-blur-2xl border-b border-white/10 text-white pt-20 pb-10">
                <div className="flex flex-col items-center gap-6 animate-in slide-in-from-top-5 duration-300">
                  {links.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setOpen(false)}
                      className="text-lg font-medium text-muted-foreground hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                  
                  <div className="w-16 h-px bg-white/10 my-2" />

                  {session ? (
                    <div className="flex flex-col items-center gap-4 w-full px-8">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-full justify-center">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-sm text-gray-200 truncate">{userName}</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="w-full rounded-xl"
                        onClick={() => { onLogout(); setOpen(false); }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full max-w-xs bg-primary rounded-xl"
                      onClick={() => { navigate('/auth'); setOpen(false); }}
                    >
                      Login
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </nav>
      </div>
    </header>
  );
}
