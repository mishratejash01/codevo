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

  return (
    <header className="sticky top-5 z-50 mx-auto w-full max-w-4xl px-4 md:px-0 transition-all duration-300">
      <div className={cn(
        "rounded-full border border-white/10 shadow-2xl",
        "bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/40",
        "transition-all duration-300 hover:border-primary/20 hover:shadow-primary/5"
      )}>
        <nav className="flex items-center justify-between p-2 px-6">
          
          {/* LEFT: Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-neuropol text-xl md:text-2xl font-bold tracking-wider text-white group-hover:text-primary transition-colors duration-300">
              CODéVO
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
                  "text-muted-foreground hover:text-white hover:bg-white/10 rounded-full px-4 transition-all"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* RIGHT: Auth & Mobile Menu */}
          <div className="flex items-center gap-2">
            {session ? (
              /* Authenticated State: Glowing User Block */
              <div className="hidden md:flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-inner group transition-all hover:bg-white/10 hover:border-white/20">
                {/* Glowing Green Dot */}
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                </div>
                
                {/* Email */}
                <span className="text-xs font-medium text-gray-200 max-w-[120px] truncate select-none">
                  {session.user.email}
                </span>
                
                <div className="h-4 w-px bg-white/10 mx-1" />

                {/* Logout Button */}
                <button 
                  onClick={onLogout}
                  className="text-muted-foreground hover:text-red-400 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              /* Guest State: Login Button */
              <Button 
                size="sm" 
                className="hidden md:flex bg-primary hover:bg-primary/90 text-white rounded-full px-6 shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)] transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                <LogIn className="h-3.5 w-3.5 mr-2" />
                Login
              </Button>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden rounded-full hover:bg-white/10 text-muted-foreground hover:text-white">
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
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 w-full justify-center">
                        <div className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </div>
                        <span className="text-sm text-gray-200 truncate">{session.user.email}</span>
                      </div>
                      <Button 
                        variant="destructive" 
                        className="w-full rounded-full"
                        onClick={() => { onLogout(); setOpen(false); }}
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      className="w-full max-w-xs bg-primary rounded-full"
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
