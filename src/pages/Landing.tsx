import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, ChevronsDown, Terminal, LayoutGrid, Play, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

// --- WIDGET IMPORT ---
import { HitMeUpWidget } from '@/components/HitMeUpWidget'; 

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

const DEMO_SCENARIO = {
  question: "How do I fast-track my coding career?",
  code: `import codevo\n\ndef start_journey():\n    # 1. Pick a skill\n    skill = "Python"\n    \n    # 2. Practice daily\n    result = codevo.practice(skill)\n    \n    # 3. Get Hired\n    if result.score > 90:\n        return "SUCCESS!"\n\nprint(start_journey())`
};

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const isMobile = useIsMobile();
  
  const [showcasePhase, setShowcasePhase] = useState<'question' | 'terminal'>('question');
  const [typedCode, setTypedCode] = useState('');
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const codeScrollRef = useRef<HTMLDivElement>(null);

  // Background and Section Scroll Effects Preservation
  const { scrollY } = useScroll();
  const rawScale = useTransform(scrollY, [0, 500], [1, isMobile ? 1 : 0.90]);
  const smoothScale = useSpring(rawScale, { stiffness: 50, damping: 15, mass: 0.1 });
  const rawRadius = useTransform(scrollY, [0, 500], [0, isMobile ? 0 : 32]);
  const smoothRadius = useSpring(rawRadius, { stiffness: 50, damping: 15, mass: 0.1 });

  // Terminal Demo Animation Logic
  useEffect(() => {
    if (isMobile) { setShowcasePhase('terminal'); setTypedCode(DEMO_SCENARIO.code); return; }
    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;
    const animate = () => {
      setShowcasePhase('question'); setTypedCode(''); setActiveKey(null);
      timeoutId = setTimeout(() => {
        setShowcasePhase('terminal');
        const typeChar = () => {
          if (charIndex < DEMO_SCENARIO.code.length) {
            const char = DEMO_SCENARIO.code[charIndex];
            setTypedCode(prev => prev + char);
            setActiveKey(char); charIndex++;
            timeoutId = setTimeout(typeChar, Math.random() * 30 + 30);
          } else {
            setActiveKey(null);
            timeoutId = setTimeout(() => { charIndex = 0; animate(); }, 5000);
          }
        };
        timeoutId = setTimeout(typeChar, 800);
      }, 3500);
    };
    animate();
    return () => clearTimeout(timeoutId);
  }, [isMobile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handlePracticeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    setIsNavigating(true);
    setTimeout(() => { session ? navigate('/practice') : navigate('/auth'); }, 800);
  };

  return (
    <div className="min-h-screen bg-black selection:bg-white/20 flex flex-col relative overflow-hidden font-sans">
      <HitMeUpWidget />
      
      <style>{`
        @keyframes scroll-arrow-move { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(6px); opacity: 1; } }
        .animate-scroll-arrow { animation: scroll-arrow-move 2s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        .cursor-blink { display: inline-block; width: 8px; height: 15px; background-color: #3b82f6; animation: blink 1s step-end infinite; vertical-align: middle; }
      `}</style>

      {/* Page Transition Overlay */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ position: 'fixed', top: buttonPosition.y, left: buttonPosition.x, width: buttonPosition.width, height: buttonPosition.height, borderRadius: '0.75rem', backgroundColor: '#ffffff', zIndex: 9999 }}
            animate={{ top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            className="flex items-center justify-center"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-black font-neuropol text-4xl">INITIALIZING...</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header session={session} onLogout={() => supabase.auth.signOut()} />

      <main className="flex-1 w-full bg-black">
        
        {/* --- HERO SECTION --- */}
        <div className="relative w-full h-[100vh] bg-black"> 
          <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden">
            <motion.div 
              className="relative w-full h-full bg-black flex flex-col justify-center items-center"
              style={{ scale: smoothScale, transformOrigin: 'top center', borderBottomLeftRadius: smoothRadius, borderBottomRightRadius: smoothRadius }}
            >
              <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
                <div className="max-w-5xl mx-auto space-y-8">
                  
                  {/* Heading - Neo Grotesk Font and Image Colors */}
                  <h1 className="text-5xl md:text-8xl font-bold tracking-tight text-white leading-[1.05] font-grotesk">
                    The coding platform for the <br />
                    <span className="text-zinc-600">global developers</span>
                  </h1>

                  {/* Description */}
                  <p className="max-w-2xl mx-auto text-lg md:text-xl text-zinc-400 leading-relaxed font-grotesk">
                    Over 1 million learners trust <span className="text-zinc-200 font-semibold">CODéVO</span> to master what basic tutorials never could — from daily coding practice and logic building to real-world projects and professional careers.
                  </p>

                  {/* Buttons - Middle Centered Alignment */}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-8">
                    <Button 
                      onClick={() => navigate('/auth')}
                      size="lg"
                      className="h-14 px-10 bg-white text-black hover:bg-zinc-200 transition-all text-lg font-bold rounded-full min-w-[240px]"
                    >
                      Join 1M+ Developers
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                    
                    <Button 
                      variant="outline"
                      size="lg"
                      className="h-14 px-12 border-zinc-800 bg-transparent hover:bg-zinc-900 text-white transition-all text-lg font-medium rounded-full"
                    >
                      <Play className="mr-2 w-4 h-4 fill-current" />
                      Try Now
                    </Button>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer" onClick={() => document.getElementById('laptop-section')?.scrollIntoView({ behavior: 'smooth' })}>
                <div className="w-[30px] h-[50px] border border-white/20 rounded-full flex justify-center items-start pt-2 bg-transparent">
                  <div className="w-1 h-2 bg-white/40 rounded-full animate-scroll-arrow" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* --- SECTION 2: EXPERIENCE REAL CODING --- */}
        <section id="laptop-section" className="w-full bg-black py-24 md:py-32 relative z-20 -mt-12 overflow-hidden border-b border-white/5">
          <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
            
            {/* Content Centered and Static */}
            <div className="max-w-4xl mx-auto space-y-6 mb-16">
              <div className="flex items-center gap-2 justify-center text-[10px] font-mono text-green-500 tracking-widest uppercase">
                <Activity className="w-3 h-3 animate-pulse" />
                System::Online
              </div>
              <h2 className="text-4xl md:text-7xl font-bold tracking-tight text-white leading-tight font-grotesk">
                EXPERIENCE <span className="text-zinc-600">REAL CODING</span>
              </h2>
              <p className="text-base md:text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed font-grotesk">
                A fully functional development environment right in your browser. <br/>
                <span className="text-zinc-200 font-medium">Write. Run. Debug. Succeed.</span>
              </p>
              
              {/* Buttons Aligned to Middle */}
              <div className="flex justify-center pt-4">
                <Button onClick={handlePracticeClick} className="h-14 px-12 rounded-full bg-white text-black hover:bg-white/90 text-lg font-bold shadow-2xl transition-transform hover:scale-105">
                  Start Coding Now
                </Button>
              </div>
            </div>

            {/* Centered Laptop Mockup */}
            <div className="max-w-5xl mx-auto perspective-1000">
               <div className="relative transform bg-[#0a0a0a] rounded-t-2xl p-2 border border-white/10 shadow-2xl">
                 <div className="bg-[#000000] rounded-t-xl border border-white/5 overflow-hidden aspect-[16/9] relative group">
                    <div className="absolute inset-0 flex flex-col font-mono text-[10px] md:text-sm text-zinc-500">
                        <div className="h-8 border-b border-white/10 flex items-center px-4 justify-between bg-[#0a0a0a]">
                          <div className="flex gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500/20" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" /></div>
                          <div className="text-xs text-zinc-500">codevo_practice.py</div>
                        </div>
                        <div className="flex-1 p-8 text-left space-y-2">
                          <div className="text-blue-400">def optimize_route(nodes):</div>
                          <div className="text-zinc-600 pl-4"># Initialize dynamic programming</div>
                          <div className="text-purple-400 pl-4">dp = [float('inf')] * len(nodes)</div>
                          <div className="text-white pl-4">dp[0] = 0</div>
                          <div className="pl-4">for i in range(1, len(nodes)): <span className="cursor-blink" /></div>
                        </div>
                    </div>
                 </div>
               </div>
               <div className="h-4 bg-[#111] rounded-b-2xl border-t border-black/50 mx-1" />
            </div>

            {/* Tech Stack Marquee Centered */}
            <div className="mt-20 max-w-2xl mx-auto overflow-hidden relative">
              <div className="flex gap-10 animate-marquee whitespace-nowrap items-center opacity-30 grayscale hover:opacity-100 transition-opacity">
                {[...TECH_STACK, ...TECH_STACK].map((src, i) => (
                  <img key={i} src={src} alt="tech" className="w-10 h-10 object-contain" />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: KEYBOARD & TERMINAL --- */}
        <section className="py-24 bg-black border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
              <div className="relative h-[450px] bg-[#0a0a0a] rounded-3xl border border-white/10 flex flex-col overflow-hidden">
                <div className="h-10 bg-[#0f0f0f] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-zinc-800" /><div className="w-3 h-3 rounded-full bg-zinc-800" />
                  <div className="ml-4 text-xs text-muted-foreground font-mono opacity-50 flex-1 text-center">{showcasePhase === 'question' ? 'challenge.md' : 'solution.py'}</div>
                </div>
                <div className="flex-1 relative p-8 font-mono overflow-hidden">
                  <div className={cn("absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700", showcasePhase === 'question' ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none")}>
                    <Code2 className="w-12 h-12 text-zinc-600 mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-4 font-grotesk">Codevo Challenge</h3>
                    <p className="text-zinc-500 leading-relaxed">"{DEMO_SCENARIO.question}"</p>
                  </div>
                  <div className={cn("absolute inset-0 p-8 bg-[#000000] transition-all duration-500", showcasePhase === 'terminal' ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")}>
                    <div className="text-blue-400 whitespace-pre-wrap leading-relaxed text-sm md:text-base">{typedCode}<span className="cursor-blink" /></div>
                  </div>
                </div>
              </div>
              <div className="relative w-full"><VirtualKeyboard activeChar={activeKey} /></div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CODE ON CODEVO --- */}
        <section className="w-full bg-[#050505] py-24 border-t border-white/5">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div className="max-w-xl"><h2 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.05] font-grotesk">Code on <span className="font-neuropol">CODéVO</span></h2></div>
              <div className="max-w-sm"><p className="text-lg text-zinc-500 leading-relaxed font-grotesk">Experience frontier capabilities in real-time execution and global competition.</p></div>
            </div>
            <div className="relative w-full h-[500px] md:h-[700px] bg-[#0a0a0a] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
              <div className="absolute left-10 top-10 w-full h-full bg-black rounded-3xl border border-white/10 p-10 font-mono text-sm space-y-4">
                 <div className="text-purple-400">import <span className="text-white">React</span> from <span className="text-green-400">'react'</span>;</div>
                 <div className="text-blue-400">const <span className="text-yellow-200">App</span> = () =&gt; {'{'}</div>
                 <div className="pl-8 text-zinc-400">return &lt;<span className="text-blue-300">Codevo</span> /&gt;;</div>
                 <div>{'}'}</div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: PLAY N CODÉ --- */}
        <section className="w-full bg-black py-24 border-t border-white/5">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-16 tracking-tight font-grotesk">Play n Codé</h2>
            <div className="w-full max-w-6xl mx-auto"><AsteroidGameFrame /></div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Landing;
