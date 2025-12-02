import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, ChevronsDown, Terminal, LayoutGrid, Play, Server, Activity, Cpu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, Lock, ChevronsDown, Terminal, LayoutGrid, Play, Server, Activity, Cpu, Zap, Shield, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { CodevoShowcase } from '@/components/CodevoShowcase';
import { motion, AnimatePresence } from 'framer-motion';

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

// Filtered Tech Stack
const TECH_STACK = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
];

// --- Animation Scenario ---
const DEMO_SCENARIO = {
  question: "How do I fast-track my coding career?",
  code: `import codevo

def start_journey():
    # 1. Pick a skill
    skill = "Python"
    
    # 2. Practice daily
    result = codevo.practice(skill)
    
    # 3. Get Hired
    if result.score > 90:
        return "Success! 🚀"

print(start_journey())`
};

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
      setShowcasePhase('question');
      setTypedCode('');
      setActiveKey(null);

      timeoutId = setTimeout(() => {
        setShowcasePhase('terminal');
        const typeChar = () => {
          if (charIndex < DEMO_SCENARIO.code.length) {
            const char = DEMO_SCENARIO.code[charIndex];
            setTypedCode(prev => prev + char);
            setActiveKey(char); 
            const delay = Math.random() * 30 + 30; 
            charIndex++;
            timeoutId = setTimeout(typeChar, delay);
          } else {
            setActiveKey(null);
            timeoutId = setTimeout(() => {
              charIndex = 0;
              animate();
            }, 5000);
          }
        };
        timeoutId = setTimeout(typeChar, 800);
      }, 3500);
    };

    animate();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (activeKey) {
      const t = setTimeout(() => setActiveKey(null), 150);
      return () => clearTimeout(t);
    }
  }, [activeKey, typedCode]);

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
    const element = document.getElementById('laptop-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePracticeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    setIsNavigating(true);
    setTimeout(() => {
      session ? navigate('/practice') : navigate('/auth');
    }, 800);
  };

  // Adjusted Scale
  const scale = Math.max(0.985, 1 - scrollY / 4000);
  const borderRadius = Math.min(24, scrollY / 20);

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-primary/20 flex flex-col relative overflow-hidden">
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
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes code-blink { 50% { opacity: 0; } }
        .cursor-blink {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: #3b82f6;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
      `}</style>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ 
              position: 'fixed', top: buttonPosition.y, left: buttonPosition.x, width: buttonPosition.width, height: buttonPosition.height, borderRadius: '0.75rem', backgroundColor: '#7c3aed', zIndex: 9999,
            }}
            animate={{ 
              top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }}
            className="flex items-center justify-center"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-white font-neuropol text-4xl">
              INITIALIZING_ENV...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full bg-[#09090b]">
        
        {/* --- HERO SECTION --- */}
        {/* CHANGED: Background is now white to show the shrinking effect correctly */}
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

        {/* --- SECTION 2: LAPTOP & TECHNOLOGIES --- */}
        <section id="laptop-section" className="w-full bg-[#09090b] py-24 relative overflow-hidden border-b border-white/5">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* LEFT: Text & Button */}
              <div className="flex-1 space-y-10 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-[10px] font-mono text-green-500 mb-2 tracking-widest uppercase">
                    <Activity className="w-3 h-3 animate-pulse" />
                    System::Online
                  </div>
                  <h2 className="text-4xl md:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
                    EXPERIENCE <br/> <span className="text-blue-500">REAL CODING</span>
                  </h2>
                  <p className="font-mono text-sm md:text-base text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    A fully functional development environment right in your browser. <br/>
                    <span className="text-white">Write. Run. Debug. Succeed.</span>
                  </p>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-8">
                  {/* BUTTON */}
                  <Button 
                    onClick={handlePracticeClick}
                    className="group relative h-14 px-10 rounded-[1rem] bg-white text-black hover:bg-white/90 text-lg font-bold shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Coding
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0" />
                    </span>
                  </Button>

                  {/* Tech Stack Marquee */}
                  <div className="w-full max-w-md">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center lg:text-left opacity-70 font-mono">
                      // POWERED BY MODERN TECHNOLOGIES
                    </p>
                    <div className="w-full overflow-hidden relative mask-gradient-x">
                      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />
                      
                      <div className="flex gap-8 animate-marquee whitespace-nowrap items-center">
                        {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((src, i) => (
                          <div key={i} className="flex-shrink-0 w-10 h-10 opacity-50 hover:opacity-100 transition-all grayscale hover:grayscale-0 cursor-pointer">
                            <img src={src} alt="tech" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: 3D Laptop Mockup */}
              <div className="flex-1 w-full max-w-2xl lg:max-w-none perspective-1000">
                <div className="relative transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]">
                  <div className="relative bg-[#151515] rounded-t-xl p-1.5 pb-0 border border-white/10 shadow-2xl">
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-700 rounded-full z-20" />
                    <div className="bg-[#09090b] rounded-t-md border border-white/5 overflow-hidden aspect-[16/10] relative group">
                      <div className="absolute inset-0 flex flex-col font-mono text-[9px] md:text-[10px] text-gray-400">
                        <div className="h-6 border-b border-white/10 flex items-center px-3 justify-between bg-[#0c0c0e]">
                          <div className="flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /></div>
                          <div className="text-xs text-white/40">codevo_practice.py</div>
                          <div className="w-10 h-3 bg-white/5 rounded" />
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                          <div className="w-10 border-r border-white/10 flex flex-col items-center py-2 gap-3 bg-[#0c0c0e]">
                            <LayoutGrid className="w-3 h-3 text-primary" />
                            <Code2 className="w-3 h-3 opacity-50" />
                            <Server className="w-3 h-3 opacity-50" />
                          </div>
                          <div className="flex-1 p-3 relative bg-[#09090b]">
                            <div className="text-blue-400">def optimize_route(nodes):</div>
                            <div className="text-gray-500 pl-4"># Initialize dynamic programming table</div>
                            <div className="text-purple-400 pl-4">dp = [float('inf')] * len(nodes)</div>
                            <div className="text-white pl-4">dp[0] = 0</div>
                            <div className="text-white pl-4 mt-1">
                              for i in range(1, len(nodes)):
                              <span className="inline-block w-1 h-2.5 bg-primary ml-0.5 animate-[code-blink_1s_infinite]" />
                            </div>
                            <div className="absolute bottom-3 right-3 bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[8px] flex items-center gap-1 shadow-lg">
                              <Play className="w-2 h-2 fill-current" /> EXECUTE
                            </div>
                          </div>
                          <div className="w-1/3 border-l border-white/10 bg-black/60 p-2 font-mono">
                            <div className="text-green-500 mb-1">➜  ~ running tests...</div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1 text-green-400">✓ Case 1 Passed</div>
                              <div className="flex items-center gap-1 text-green-400">✓ Case 2 Passed</div>
                              <div className="flex items-center gap-1 text-red-400">✗ Case 3 Failed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="h-2.5 md:h-3.5 bg-[#1f1f1f] rounded-b-lg border-t border-black/50 shadow-2xl relative z-10 mx-[1px]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-b-[2px]" />
                  </div>
                  <div className="absolute -bottom-10 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full transform scale-y-50" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- SECTION 3: KEYBOARD & TERMINAL --- */}
        <section className="py-24 relative overflow-hidden bg-[#09090b] border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 max-w-7xl mx-auto">
              
              {/* LEFT: Terminal (Swapped) */}
              <div className="relative order-2 lg:order-1 h-[350px] md:h-[450px] w-full bg-[#121212] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden group hover:border-white/20 transition-colors">
                <div className="h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 text-xs text-muted-foreground font-mono opacity-50 flex-1 text-center">
                    {showcasePhase === 'question' ? 'challenge.md' : 'solution.py'}
                  </div>
                </div>

                <div className="flex-1 relative p-6 md:p-8 font-mono text-sm md:text-base overflow-hidden">
                  <div className={cn("absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out", showcasePhase === 'question' ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none")}>
                    <div className="relative mb-8 group/icon">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover/icon:bg-blue-500/30 transition-all duration-700" />
                      <div className="relative w-20 h-20 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md">
                        <Code2 className="w-10 h-10 text-white/90 group-hover/icon:text-blue-400 transition-colors duration-300" />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Codevo Challenge</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed text-base md:text-lg">"{DEMO_SCENARIO.question}"</p>
                  </div>

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

              {/* RIGHT: Keyboard (Swapped) */}
              <div className="relative order-1 lg:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Real-time Interaction
                </h3>
                <VirtualKeyboard activeChar={activeKey} />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CODE ON CODEVO (New Component) --- */}
        <CodevoShowcase />

        {/* --- SECTION 5: "Play n Codé" (Asteroid Game) --- */}
        <section className="w-full bg-[#000000] py-20 relative overflow-hidden border-t border-white/5">
          {/* Fade to footer */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0c0e] to-transparent pointer-events-none z-10" />

          <div className="container mx-auto px-6 relative z-20">
            {/* Header: Left Aligned, Sans-Serif */}
            <div className="text-left mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-sans">
                Play n Codé
              </h2>
            </div>

            <div className="w-full"> 
              <AsteroidGameFrame />
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 mt-0 bg-[#0c0c0e] relative z-10">
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
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { CodevoShowcase } from '@/components/CodevoShowcase';
import { motion, AnimatePresence } from 'framer-motion';

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

// Filtered Tech Stack
const TECH_STACK = [
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg",
  "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg",
];

// --- Animation Scenario ---
const DEMO_SCENARIO = {
  question: "How do I fast-track my coding career?",
  code: `import codevo

def start_journey():
    # 1. Pick a skill
    skill = "Python"
    
    # 2. Practice daily
    result = codevo.practice(skill)
    
    # 3. Get Hired
    if result.score > 90:
        return "Success! 🚀"

print(start_journey())`
};

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [scrollY, setScrollY] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });

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
      setShowcasePhase('question');
      setTypedCode('');
      setActiveKey(null);

      timeoutId = setTimeout(() => {
        setShowcasePhase('terminal');
        const typeChar = () => {
          if (charIndex < DEMO_SCENARIO.code.length) {
            const char = DEMO_SCENARIO.code[charIndex];
            setTypedCode(prev => prev + char);
            setActiveKey(char); 
            const delay = Math.random() * 30 + 30; 
            charIndex++;
            timeoutId = setTimeout(typeChar, delay);
          } else {
            setActiveKey(null);
            timeoutId = setTimeout(() => {
              charIndex = 0;
              animate();
            }, 5000);
          }
        };
        timeoutId = setTimeout(typeChar, 800);
      }, 3500);
    };

    animate();
    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (activeKey) {
      const t = setTimeout(() => setActiveKey(null), 150);
      return () => clearTimeout(t);
    }
  }, [activeKey, typedCode]);

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
    const element = document.getElementById('laptop-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handlePracticeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    setIsNavigating(true);
    setTimeout(() => {
      session ? navigate('/practice') : navigate('/auth');
    }, 800);
  };

  // Adjusted Scale for "Less Shrinking"
  // Shrinks width slightly, but keeps top position constant (effectively shrinking from bottom/sides)
  const scale = Math.max(0.98, 1 - scrollY / 3000);
  const translateY = Math.min(20, scrollY / 10); // Moves slightly up to counteract visual drop if needed
  const borderRadius = Math.min(24, scrollY / 20);

  return (
    <div className="min-h-screen bg-[#09090b] selection:bg-primary/20 flex flex-col relative overflow-hidden">
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
          animation: marquee 30s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes code-blink { 50% { opacity: 0; } }
        .cursor-blink {
          display: inline-block;
          width: 8px;
          height: 15px;
          background-color: #3b82f6;
          animation: blink 1s step-end infinite;
          vertical-align: middle;
          margin-left: 2px;
        }
      `}</style>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ 
              position: 'fixed', top: buttonPosition.y, left: buttonPosition.x, width: buttonPosition.width, height: buttonPosition.height, borderRadius: '0.75rem', backgroundColor: '#7c3aed', zIndex: 9999,
            }}
            animate={{ 
              top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
            }}
            className="flex items-center justify-center"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-white font-neuropol text-4xl">
              INITIALIZING_ENV...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full bg-[#09090b]">
        
        {/* --- HERO SECTION --- */}
        <div className="relative w-full h-[120vh] bg-[#09090b]"> 
          <div className="sticky top-0 h-screen w-full flex items-start justify-center overflow-hidden">
            <div 
              className="relative w-full h-full bg-black overflow-hidden flex flex-col justify-center items-center shadow-2xl will-change-transform"
              style={{
                transform: `scale(${scale})`, 
                transformOrigin: 'top center', // Ensures shrinking happens from bottom/sides
                borderRadius: `0 0 ${borderRadius}px ${borderRadius}px`, // Only bottom radius
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

        {/* --- SECTION 2: LAPTOP & TECHNOLOGIES --- */}
        <section id="laptop-section" className="w-full bg-[#09090b] py-24 relative overflow-hidden border-b border-white/5">
          {/* Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              {/* LEFT: Text & Button */}
              <div className="flex-1 space-y-10 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-[10px] font-mono text-green-500 mb-2 tracking-widest uppercase">
                    <Activity className="w-3 h-3 animate-pulse" />
                    System::Online
                  </div>
                  <h2 className="text-4xl md:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
                    EXPERIENCE <br/> <span className="text-blue-500">REAL CODING</span>
                  </h2>
                  <p className="font-mono text-sm md:text-base text-gray-400 max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    A fully functional development environment right in your browser. <br/>
                    <span className="text-white">Write. Run. Debug. Succeed.</span>
                  </p>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-8">
                  {/* BUTTON */}
                  <Button 
                    onClick={handlePracticeClick}
                    className="group relative h-14 px-10 rounded-[1rem] bg-white text-black hover:bg-white/90 text-lg font-bold shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] overflow-hidden"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Start Coding
                      <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1 opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0" />
                    </span>
                  </Button>

                  {/* Tech Stack Marquee */}
                  <div className="w-full max-w-md">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-4 text-center lg:text-left opacity-70 font-mono">
                      // POWERED BY MODERN TECHNOLOGIES
                    </p>
                    <div className="w-full overflow-hidden relative mask-gradient-x">
                      <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none" />
                      <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none" />
                      
                      <div className="flex gap-8 animate-marquee whitespace-nowrap items-center">
                        {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((src, i) => (
                          <div key={i} className="flex-shrink-0 w-10 h-10 opacity-50 hover:opacity-100 transition-all grayscale hover:grayscale-0 cursor-pointer">
                            <img src={src} alt="tech" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT: 3D Laptop Mockup */}
              <div className="flex-1 w-full max-w-2xl lg:max-w-none perspective-1000">
                <div className="relative transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]">
                  <div className="relative bg-[#151515] rounded-t-xl p-1.5 pb-0 border border-white/10 shadow-2xl">
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-gray-700 rounded-full z-20" />
                    <div className="bg-[#09090b] rounded-t-md border border-white/5 overflow-hidden aspect-[16/10] relative group">
                      <div className="absolute inset-0 flex flex-col font-mono text-[9px] md:text-[10px] text-gray-400">
                        <div className="h-6 border-b border-white/10 flex items-center px-3 justify-between bg-[#0c0c0e]">
                          <div className="flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /></div>
                          <div className="text-xs text-white/40">codevo_practice.py</div>
                          <div className="w-10 h-3 bg-white/5 rounded" />
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                          <div className="w-10 border-r border-white/10 flex flex-col items-center py-2 gap-3 bg-[#0c0c0e]">
                            <LayoutGrid className="w-3 h-3 text-primary" />
                            <Code2 className="w-3 h-3 opacity-50" />
                            <Server className="w-3 h-3 opacity-50" />
                          </div>
                          <div className="flex-1 p-3 relative bg-[#09090b]">
                            <div className="text-blue-400">def optimize_route(nodes):</div>
                            <div className="text-gray-500 pl-4"># Initialize dynamic programming table</div>
                            <div className="text-purple-400 pl-4">dp = [float('inf')] * len(nodes)</div>
                            <div className="text-white pl-4">dp[0] = 0</div>
                            <div className="text-white pl-4 mt-1">
                              for i in range(1, len(nodes)):
                              <span className="inline-block w-1 h-2.5 bg-primary ml-0.5 animate-[code-blink_1s_infinite]" />
                            </div>
                            <div className="absolute bottom-3 right-3 bg-green-900/30 text-green-400 border border-green-500/30 px-2 py-0.5 rounded text-[8px] flex items-center gap-1 shadow-lg">
                              <Play className="w-2 h-2 fill-current" /> EXECUTE
                            </div>
                          </div>
                          <div className="w-1/3 border-l border-white/10 bg-black/60 p-2 font-mono">
                            <div className="text-green-500 mb-1">➜  ~ running tests...</div>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center gap-1 text-green-400">✓ Case 1 Passed</div>
                              <div className="flex items-center gap-1 text-green-400">✓ Case 2 Passed</div>
                              <div className="flex items-center gap-1 text-red-400">✗ Case 3 Failed</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none" />
                    </div>
                  </div>
                  <div className="h-2.5 md:h-3.5 bg-[#1f1f1f] rounded-b-lg border-t border-black/50 shadow-2xl relative z-10 mx-[1px]">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 bg-gray-600 rounded-b-[2px]" />
                  </div>
                  <div className="absolute -bottom-10 left-4 right-4 h-8 bg-black/40 blur-xl rounded-full transform scale-y-50" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- SECTION 3: KEYBOARD & TERMINAL --- */}
        <section className="py-24 relative overflow-hidden bg-[#09090b] border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 max-w-7xl mx-auto">
              
              {/* LEFT: Terminal (Swapped) */}
              <div className="relative order-2 lg:order-1 h-[350px] md:h-[450px] w-full bg-[#121212] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden group hover:border-white/20 transition-colors">
                <div className="h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 text-xs text-muted-foreground font-mono opacity-50 flex-1 text-center">
                    {showcasePhase === 'question' ? 'challenge.md' : 'solution.py'}
                  </div>
                </div>

                <div className="flex-1 relative p-6 md:p-8 font-mono text-sm md:text-base overflow-hidden">
                  <div className={cn("absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700 ease-in-out", showcasePhase === 'question' ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-10 scale-95 pointer-events-none")}>
                    <div className="relative mb-8 group/icon">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl group-hover/icon:bg-blue-500/30 transition-all duration-700" />
                      <div className="relative w-20 h-20 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md">
                        <Code2 className="w-10 h-10 text-white/90 group-hover/icon:text-blue-400 transition-colors duration-300" />
                      </div>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Codevo Challenge</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed text-base md:text-lg">"{DEMO_SCENARIO.question}"</p>
                  </div>

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

              {/* RIGHT: Keyboard (Swapped) */}
              <div className="relative order-1 lg:order-2">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl -z-10 rounded-full" />
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Real-time Interaction
                </h3>
                <VirtualKeyboard activeChar={activeKey} />
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CODE ON CODEVO --- */}
        <CodevoShowcase />

        {/* --- SECTION 5: "Play n Codé" (Asteroid Game) --- */}
        <section className="w-full bg-[#000000] py-20 relative overflow-hidden border-t border-white/5">
          
          {/* FADE EFFECT: Shrinking into footer */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0ee0] to-transparent pointer-events-none z-20" />

          <div className="container mx-auto px-6 relative z-10">
            {/* Header: Left Aligned, Sans-Serif */}
            <div className="text-left mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight font-sans">
                Play n Codé
              </h2>
            </div>

            <div className="w-full"> {/* Full width to match other sections */}
              <AsteroidGameFrame />
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-white/10 mt-0 bg-[#0c0c0e] relative z-10">
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
