import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Shield, TrendingUp, ArrowRight, Lock, ChevronsDown, Terminal, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';

// --- Typewriter Hook ---
const useTypewriter = (text: string, speed: number = 50, startDelay: number = 1000) => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const delayTimer = setTimeout(() => {
      setStarted(true);
    }, startDelay);

    return () => clearTimeout(delayTimer);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;

    const interval = setInterval(() => {
      setDisplayText((currentText) => {
        if (currentText.length < text.length) {
          return currentText + text.charAt(currentText.length);
        }
        clearInterval(interval);
        return currentText;
      });
    }, speed);

    return () => clearInterval(interval);
  }, [started, text, speed]);

  return displayText;
};

// Tech Stack Icons for Marquee
const TECH_STACK = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg"
];

// --- Marketing Animation Scenario ---
const DEMO_SCENARIO = {
  question: "How do I fast-track my coding career?",
  code: `import codevo

def level_up_career(user):
    # Learn by doing, not just watching
    skills = codevo.practice(["Python", "DSA", "System Design"])
    
    # Get instant feedback & analytics
    confidence = codevo.analyze(skills)
    
    if confidence >= 100:
        return "You're Hired! 🚀"

print(level_up_career(me))`
};

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);

  // Typewriter states
  const taglineText = useTypewriter("Forget theory… let’s break stuff and build better.", 40, 500);
  const helloWorldText = useTypewriter("Hello World", 150, 1500);

  // --- Showcase Animation States ---
  const [showcasePhase, setShowcasePhase] = useState<'question' | 'terminal'>('question');
  const [typedCode, setTypedCode] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Animation Loop
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;

    const animate = () => {
      // Phase 1: Show Marketing Hook (Question)
      setShowcasePhase('question');
      setTypedCode('');
      setActiveKey(null);

      timeoutId = setTimeout(() => {
        // Phase 2: Switch to Terminal & Type Codevo Promo
        setShowcasePhase('terminal');
        
        const typeChar = () => {
          if (charIndex < DEMO_SCENARIO.code.length) {
            const char = DEMO_SCENARIO.code[charIndex];
            setTypedCode(prev => prev + char);
            setActiveKey(char); 
            
            // Varied typing speed for realism
            const delay = Math.random() * 30 + 30; 
            charIndex++;
            timeoutId = setTimeout(typeChar, delay);
          } else {
            // Finished typing, hold for reading, then reset
            setActiveKey(null);
            timeoutId = setTimeout(() => {
              charIndex = 0;
              animate(); // Loop back
            }, 5000);
          }
        };
        // Brief pause before typing starts
        timeoutId = setTimeout(typeChar, 800);

      }, 3500); // Duration of Question Phase
    };

    animate();

    return () => clearTimeout(timeoutId);
  }, []);

  // Clear active key shortly after it's set
  useEffect(() => {
    if (activeKey) {
      const t = setTimeout(() => setActiveKey(null), 150);
      return () => clearTimeout(t);
    }
  }, [activeKey, typedCode]);

  // Monitor Auth & Scroll
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [toast]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    toast({ description: "Logged out successfully" });
  };

  const scrollToContent = () => {
    const element = document.getElementById('showcase-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scale = Math.max(0.9, 1 - scrollY / 1500);
  const borderRadius = Math.min(60, scrollY / 8);

  return (
    <div className="min-h-screen bg-white selection:bg-primary/20 flex flex-col">
      <style>{`
        @keyframes scroll-arrow-move {
          0% { transform: translateY(0); opacity: 0.5; }
          25% { transform: translateY(-4px); opacity: 0.8; }
          75% { transform: translateY(4px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 0.5; }
        }
        .animate-scroll-arrow {
          animation: scroll-arrow-move 2s ease-in-out infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .cursor-blink {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: #3b82f6;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full">
        
        {/* --- HERO SECTION --- */}
        <div className="relative w-full h-[120vh] bg-white"> 
          <div className="sticky top-0 h-screen w-full flex items-start justify-center overflow-hidden">
            <div 
              className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center shadow-2xl will-change-transform"
              style={{
                transform: `scale(${scale})`, 
                transformOrigin: 'top center', 
                borderBottomLeftRadius: `${borderRadius}px`,
                borderBottomRightRadius: `${borderRadius}px`,
              }}
            >
              <div className="absolute inset-0 z-0 w-full h-full"><DarkVeil /><div className="absolute inset-0 bg-black/60" /></div>

              <div className="container mx-auto px-6 relative z-10 flex flex-col items-center justify-center h-full pb-20">
                <div className="max-w-7xl mx-auto space-y-10 text-center">
                  <div className="flex justify-center mb-6">
                    <div className="relative group cursor-default">
                      <div className="absolute -inset-1 bg-green-500/20 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000" />
                      <div className="relative bg-black/50 backdrop-blur-md border border-white/10 rounded-lg px-6 py-3 shadow-2xl flex items-center gap-3">
                        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/50" /></div>
                        <div className="h-4 w-px bg-white/10 mx-1" />
                        <p className="font-mono text-base md:text-lg text-green-400 font-medium tracking-wide"><span className="text-gray-500 mr-3 select-none">$</span>{taglineText}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <span className="text-3xl md:text-5xl text-white font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">Évolve from</span>
                    <div className="flex flex-wrap items-baseline justify-center gap-3 md:gap-5 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
                      <span className="font-mono text-primary text-5xl md:text-8xl font-bold drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]">{helloWorldText}</span>
                      <span className="text-2xl md:text-4xl text-muted-foreground/60 font-light">to</span>
                      <span className="text-5xl md:text-8xl font-extrabold text-[#1a1a1a] transition-colors duration-700 hover:text-white cursor-default" title="Keep coding to reveal">Hired</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-4 mt-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <div className="flex items-center -space-x-4">
                      {[{ src: "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=150&h=150&fit=crop", rotate: "-rotate-6", zIndex: "z-0" }, { src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop", rotate: "rotate-3", zIndex: "z-10" }, { src: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=150&h=150&fit=crop", rotate: "-rotate-3", zIndex: "z-20" }, { src: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=150&h=150&fit=crop", rotate: "rotate-6", zIndex: "z-30" }].map((item, i) => (
                        <div key={i} className={cn("relative w-10 h-12 md:w-12 md:h-14 rounded-xl border-[2px] border-[#0c0c0e] overflow-hidden shadow-lg transition-all duration-300 ease-out hover:-translate-y-2 hover:scale-110 hover:!z-50 hover:border-white/40 hover:shadow-2xl bg-gray-800", item.rotate, item.zIndex)}>
                          <img src={item.src} alt="User" className="w-full h-full object-cover opacity-90 hover:opacity-100" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm font-medium text-muted-foreground/80 tracking-wide border-l border-white/10 pl-4 h-full flex items-center">Trusted by <span className="text-white font-semibold mx-1">100K+</span> community users</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer animate-in fade-in duration-1000 delay-1000" onClick={scrollToContent}>
                <div className="w-[36px] h-[64px] border border-white/30 rounded-full flex justify-center items-center bg-black/20 backdrop-blur-sm hover:border-white/60 transition-colors shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                  <div className="animate-scroll-arrow"><ChevronsDown className="w-5 h-5 text-white/90" /></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- KEYBOARD & TERMINAL SHOWCASE SECTION --- */}
        <section id="showcase-section" className="w-full bg-[#09090b] pt-16 pb-24 relative z-10 overflow-hidden border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-24 max-w-7xl mx-auto">
              
              {/* RIGHT (Desktop) / TOP (Mobile): Dynamic Terminal Screen */}
              <div className="relative order-1 lg:order-2 h-[350px] md:h-[450px] w-full bg-[#121212] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden group hover:border-white/20 transition-colors">
                
                {/* Window Chrome */}
                <div className="h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 text-xs text-muted-foreground font-mono opacity-50 flex-1 text-center">
                    {showcasePhase === 'question' ? 'challenge.md' : 'solution.py'}
                  </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative p-6 md:p-8 font-mono text-sm md:text-base overflow-hidden">
                  
                  {/* Phase 1: Question/Marketing View */}
                  <div className={cn("absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out", showcasePhase === 'question' ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none")}>
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
                      <Sparkles className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4">Codevo Challenge</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed text-base md:text-lg">"{DEMO_SCENARIO.question}"</p>
                  </div>

                  {/* Phase 2: Terminal/Code View */}
                  <div className={cn("absolute inset-0 p-6 md:p-8 bg-[#0c0c0e] transition-all duration-500 ease-in-out flex flex-col", showcasePhase === 'terminal' ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10 pointer-events-none")}>
                    <div className="flex items-center gap-2 text-muted-foreground mb-4 opacity-50 text-xs">
                      <Terminal className="w-4 h-4" />
                      <span>user@codevo:~/workspace $ code main.py</span>
                    </div>
                    <div className="font-mono text-blue-400 whitespace-pre-wrap leading-relaxed text-xs md:text-sm">
                      {typedCode}<span className="cursor-blink" />
                    </div>
                  </div>

                </div>
              </div>

              {/* LEFT (Desktop) / BOTTOM (Mobile): Synchronized Keyboard */}
              <div className="relative order-2 lg:order-1">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Live Input
                </h3>
                {/* Responsive Virtual Keyboard Component */}
                <VirtualKeyboard activeChar={activeKey} />
              </div>

            </div>

            {/* Infinite Tech Marquee */}
            <div className="w-full max-w-7xl mx-auto overflow-hidden relative group mt-8">
              <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />
              
              <div className="flex gap-8 md:gap-16 animate-marquee whitespace-nowrap py-4">
                {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((src, i) => (
                  <div key={i} className="flex-shrink-0 flex items-center justify-center w-14 h-14 md:w-20 md:h-20 bg-white/5 rounded-2xl border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm group/icon">
                    <img src={src} alt="tech" className="w-7 h-7 md:w-10 md:h-10 object-contain opacity-40 group-hover/icon:opacity-100 group-hover/icon:scale-110 transition-all duration-300 grayscale group-hover/icon:grayscale-0" />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>

        {/* Modes Section */}
        <section id="modes-section" className="relative w-full min-h-screen flex items-center justify-center bg-[#09090b] z-10 py-24 border-t border-white/5">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Select Mode</h2>
              <p className="text-muted-foreground text-lg">Choose how you want to code today.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <div className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-primary/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                    <Code2 className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">Learning Environment</h2>
                  <div className="text-muted-foreground leading-relaxed mb-6">
                    Standard practice console offering:
                    <ul className="mt-4 space-y-3 text-sm">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Instant Feedback & Scoring</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Unlimited Attempts</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Access to Public Test Cases</li>
                    </ul>
                  </div>
                </div>
                <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                  <Button size="lg" onClick={() => session ? navigate('/practice') : navigate('/auth')} className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 text-base font-medium transition-all hover:scale-[1.02]">
                    {session ? "Enter Learning Mode" : "Login to Practice"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>

              <div className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-red-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col overflow-hidden h-full">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10 flex-1">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-red-500/20">
                    <Lock className="w-8 h-8 text-red-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">Exam Portal</h2>
                  <div className="text-muted-foreground leading-relaxed mb-6">
                    Secure proctored environment featuring:
                    <ul className="mt-4 space-y-3 text-sm">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Strict Time Limits</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Full-screen Enforcement</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Activity Monitoring</li>
                    </ul>
                  </div>
                </div>
                <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                  <Button size="lg" variant="outline" className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 hover:text-red-400 h-12 text-base font-medium transition-all hover:scale-[1.02]" onClick={() => session ? navigate('/exam') : navigate('/auth')}>
                    {session ? "Enter Exam Hall" : "Login to Exam"} <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-white/10 bg-[#09090b] relative z-10">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Platform Features</h2>
              <p className="text-muted-foreground">Everything you need to master your coding skills</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Evaluation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Code is evaluated client-side using Pyodide WebAssembly for immediate feedback without server latency.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Secure & Scalable</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on a robust infrastructure ensuring a secure, reliable, and consistent coding experience for all users.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed breakdown of passed test cases, error logs, and execution outputs to help you debug faster.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 bg-[#0c0c0e] relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 IIT Madras. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
