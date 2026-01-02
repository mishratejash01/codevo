import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, ArrowRight, ChevronsDown, Terminal, LayoutGrid, Play, Server, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

// --- WIDGET IMPORT ---
import { HitMeUpWidget } from '@/pages/Profile'; 

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
  code: `import codevo

def start_journey():
    # 1. Pick a skill
    skill = "Python"
    
    # 2. Practice daily
    result = codevo.practice(skill)
    
    # 3. Get Hired
    if result.score > 90:
        return "SUCCESS!"

print(start_journey())`
};

const HERO_IMAGES = [
  "https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/IMG%20Pat%201.png",
  "https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/IMG%20Part%202.png",
  "https://fxwmyjvzwcimlievpvjh.supabase.co/storage/v1/object/public/Assets/IMG%20Part%203.png"
];

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
  
  // Image Carousel State
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Cycle Images
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 4000); // Change image every 4 seconds
    return () => clearInterval(timer);
  }, []);
  
  // Terminal Animation Logic
  useEffect(() => {
    if (isMobile) {
      setShowcasePhase('terminal');
      setTypedCode(DEMO_SCENARIO.code);
      return;
    }
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
            charIndex++;
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
  }, [toast]);

  const scrollToContent = () => {
    const element = document.getElementById('laptop-section');
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePracticeClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setButtonPosition({ x: rect.left, y: rect.top, width: rect.width, height: rect.height });
    setIsNavigating(true);
    setTimeout(() => { session ? navigate('/practice') : navigate('/auth'); }, 800);
  };

  return (
    <div className="min-h-screen bg-black selection:bg-white/20 flex flex-col relative overflow-hidden">
      
      <HitMeUpWidget />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&family=Inter:wght@400;500;600;700&display=swap');
        
        :root {
          --font-geom: 'Inter', system-ui, sans-serif;
        }

        @keyframes scroll-arrow-move {
          0% { transform: translateY(0); opacity: 0.5; }
          25% { transform: translateY(-4px); opacity: 0.8; }
          75% { transform: translateY(4px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 0.5; }
        }
        .animate-scroll-arrow { animation: scroll-arrow-move 2s ease-in-out infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes code-blink { 50% { opacity: 0; } }
        .cursor-blink { display: inline-block; width: 8px; height: 15px; background-color: #3b82f6; animation: blink 1s step-end infinite; vertical-align: middle; margin-left: 2px; }
      `}</style>

      <AnimatePresence>
        {isNavigating && (
          <motion.div
            initial={{ position: 'fixed', top: buttonPosition.y, left: buttonPosition.x, width: buttonPosition.width, height: buttonPosition.height, borderRadius: '0.75rem', backgroundColor: '#ffffff', zIndex: 9999 }}
            animate={{ top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
            className="flex items-center justify-center"
          >
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.3 } }} className="text-black font-neuropol text-4xl">
              INITIALIZING...
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header session={session} onLogout={() => { supabase.auth.signOut(); setSession(null); }} />

      <main className="flex-1 w-full bg-black">
        
        {/* --- HERO SECTION --- */}
        <div className="relative w-full min-h-screen bg-black flex flex-col justify-center items-center shadow-2xl py-32"> 
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
            <div className="max-w-[1100px] mx-auto flex flex-col items-center">
              
              {/* Main Heading: Reduced Size */}
              <h1 
                className="text-[42px] md:text-[72px] tracking-[-0.06em] leading-[0.95] text-white mb-[20px]" 
                style={{ 
                  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: 500 
                }}
              >
                <span className="block">The Coding Platform built</span>
                for global developers
              </h1>

              {/* Description: Reduced Size */}
              <p 
                className="text-[14px] md:text-[18px] text-[#a1a1aa] max-w-[800px] mx-auto leading-[1.5] tracking-[-0.02em] mb-[32px]" 
                style={{ fontFamily: 'var(--font-geom)' }}
              >
                Over 1 million learners trust CODéVO to achieve what basic tutorials never could — delivering depth, rigor, and lasting impact at scale.
              </p>

              {/* Buttons: Shifted Up */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-[12px] mb-12 relative z-30">
                <Button 
                  onClick={() => navigate('/auth')}
                  size="lg"
                  className="h-auto px-[38px] py-[18px] bg-white text-black hover:bg-zinc-200 transition-all text-[16px] font-semibold rounded-full min-w-[220px]"
                >
                  Join 1M+ Developers -Auth
                </Button>
                
                <Button 
                  variant="outline"
                  size="lg"
                  className="h-auto px-[38px] py-[18px] border-[#333] bg-transparent hover:bg-zinc-900 text-white transition-all text-[16px] font-semibold rounded-full"
                >
                  Try Now
                </Button>
              </div>

              {/* --- IMAGE CAROUSEL SECTION --- */}
              {/* Shifted down to -mt-4 to fill space below and reduce aggressive overlap */}
              <div className="w-full max-w-7xl relative z-20 -mt-4">
                <div className="relative w-full aspect-[16/10] md:aspect-[21/9] overflow-hidden rounded-t-lg">
                  <AnimatePresence mode="popLayout">
                    <motion.img 
                      key={currentImageIndex}
                      src={HERO_IMAGES[currentImageIndex]}
                      alt="Platform Preview" 
                      className="absolute inset-0 w-full h-full object-cover object-bottom"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    />
                  </AnimatePresence>
                  
                  {/* Blending Gradients */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-transparent z-10 pointer-events-none" />
                </div>
              </div>

            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer" onClick={scrollToContent}>
            <div className="w-[30px] h-[50px] border border-white/20 rounded-full flex justify-center items-center bg-transparent">
              <div className="animate-scroll-arrow"><ChevronsDown className="w-4 h-4 text-white/40" /></div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: EXPERIENCE REAL CODING --- */}
        <section id="laptop-section" className="w-full bg-black py-12 md:py-24 relative z-20 -mt-12 overflow-hidden border-b border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              <div className="flex-1 space-y-8 md:space-y-10 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-[10px] font-mono text-green-500 mb-2 tracking-widest uppercase">
                    <Activity className="w-3 h-3 animate-pulse" />
                    System::Online
                  </div>
                  <h2 className="text-3xl md:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
                    EXPERIENCE <br/> <span className="text-blue-500">REAL CODING</span>
                  </h2>
                  <p className="font-mono text-xs md:text-base text-gray-400 w-full max-w-[90vw] md:max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    A fully functional development environment right in your browser. <br/>
                    <span className="text-white">Write. Run. Debug. Succeed.</span>
                  </p>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-8">
                  <Button onClick={handlePracticeClick} className="group h-12 md:h-14 px-8 md:px-10 rounded-[1rem] bg-white text-black hover:bg-white/90 text-base md:text-lg font-bold">
                    Start Coding
                  </Button>
                  
                  <div className="w-full max-w-md">
                    <div className="w-full overflow-hidden relative mask-gradient-x">
                      <div className="flex gap-6 animate-marquee whitespace-nowrap items-center">
                        {[...TECH_STACK, ...TECH_STACK].map((src, i) => (
                          <div key={i} className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 opacity-50 grayscale transition-all hover:grayscale-0">
                            <img src={src} alt="tech" className="w-full h-full object-contain" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Laptop Viewport */}
              <div className="flex-1 w-full max-w-full lg:max-w-none perspective-1000">
                <div className="relative transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]">
                  <div className="relative bg-[#151515] rounded-t-xl p-1.5 pb-0 border border-white/10 shadow-2xl">
                    <div className="bg-[#09090b] rounded-t-md border border-white/5 overflow-hidden aspect-[16/10] relative group">
                      <div className="absolute inset-0 flex flex-col font-mono text-[9px] md:text-[10px] text-gray-400">
                        <div className="h-6 border-b border-white/10 flex items-center px-3 justify-between bg-[#0c0c0e]">
                          <div className="flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" /><div className="w-1.5 h-1.5 rounded-full bg-green-500/50" /></div>
                          <div className="text-xs text-white/40">codevo_practice.py</div>
                        </div>
                        <div className="flex-1 flex overflow-hidden">
                          <div className="w-8 md:w-10 border-r border-white/10 flex flex-col items-center py-2 gap-3 bg-[#0c0c0e]">
                            <LayoutGrid className="w-3 h-3 text-primary" />
                            <Code2 className="w-3 h-3 opacity-50" />
                          </div>
                          <div className="flex-1 p-2 md:p-3 relative bg-[#09090b]">
                            <div className="text-blue-400">def optimize_route(nodes):</div>
                            <div className="text-purple-400 pl-4">dp = [float('inf')] * len(nodes)</div>
                            <div className="text-white pl-4">dp[0] = 0</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="h-2.5 md:h-3.5 bg-[#1f1f1f] rounded-b-lg border-t border-black/50 shadow-2xl" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- SECTION 3: KEYBOARD & TERMINAL --- */}
        <section className="py-12 md:py-24 relative overflow-hidden bg-black border-t border-white/5">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 max-w-7xl mx-auto">
              <div className="relative h-[300px] md:h-[450px] w-full bg-[#121212] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div className="h-10 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2 shrink-0">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" /><div className="w-3 h-3 rounded-full bg-yellow-500/80" /><div className="w-3 h-3 rounded-full bg-green-500/80" />
                  <div className="ml-4 text-xs text-muted-foreground font-mono opacity-50 flex-1 text-center">{showcasePhase === 'question' ? 'challenge.md' : 'solution.py'}</div>
                </div>
                <div className="flex-1 relative p-6 md:p-8 font-mono text-sm md:text-base overflow-hidden">
                  <div className={cn("absolute inset-0 p-8 flex flex-col items-center justify-center text-center transition-all duration-700", showcasePhase === 'question' ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className="relative w-20 h-20 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl backdrop-blur-md mb-8"><Code2 className="w-10 h-10 text-white/90" /></div>
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 tracking-tight">Codevo Challenge</h3>
                    <p className="text-muted-foreground max-w-md leading-relaxed">"{DEMO_SCENARIO.question}"</p>
                  </div>
                  <div className={cn("absolute inset-0 p-6 md:p-8 bg-[#0c0c0e] transition-all duration-500 flex flex-col", showcasePhase === 'terminal' ? "opacity-100" : "opacity-0 pointer-events-none")}>
                    <div className="font-mono text-blue-400 whitespace-pre-wrap leading-relaxed flex-1 pr-2 no-scrollbar">{typedCode}<span className="cursor-blink" /></div>
                  </div>
                </div>
              </div>
              <div className="relative w-full"><VirtualKeyboard activeChar={activeKey} /></div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: CODE ON CODEVO --- */}
        <section className="w-full bg-[#050505] py-12 md:py-24 relative overflow-hidden border-t border-white/5">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
              <div className="max-w-xl"><h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">Code on <span className="font-neuropol text-white">CODéVO</span></h2></div>
              <div className="max-w-sm"><p className="text-base md:text-lg text-gray-400 leading-relaxed">Experience the future of coding. Featuring frontier capabilities in real-time execution, secure proctoring, and global competition.</p></div>
            </div>
            <div className="relative w-full h-[450px] md:h-[700px] mt-12">
              <div className="absolute left-0 top-0 w-[95%] md:w-[80%] h-[90%] bg-[#0f0f11] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10">
                 <div className="w-full h-full flex flex-col bg-[#0c0c0e] rounded-xl border border-white/5 overflow-hidden">
                    <div className="h-12 border-b border-white/5 flex items-center px-4 md:px-6 justify-between bg-[#151517]"><div className="text-xs md:text-sm text-gray-500 font-mono">codevo_ide_v2.tsx</div></div>
                    <div className="flex-1 p-4 md:p-8 font-mono text-xs md:text-base text-gray-400 space-y-2 md:space-y-4">
                       <div><span className="text-purple-400">import</span> <span className="text-white">React</span> <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span>;</div>
                       <div><span className="text-blue-400">const</span> <span className="text-yellow-200">App</span> = () <span className="text-blue-400">=&gt;</span> {'{'}</div>
                       <div className="pl-4 md:pl-8 text-pink-400">return (</div>
                       <div className="pl-8 md:pl-12 text-gray-300">&lt;<span className="text-blue-300">CodevoEnvironment</span> /&gt;</div>
                    </div>
                 </div>
              </div>
              <div className="absolute right-[2%] md:right-[5%] bottom-[10px] md:bottom-[-20px] w-[120px] md:w-[300px] aspect-[9/19] bg-black rounded-[1.5rem] md:rounded-[3rem] border-[4px] md:border-[8px] border-[#1a1a1a] shadow-2xl z-30 overflow-hidden transform md:translate-y-10">
                 <div className="h-full w-full bg-[#0c0c0e] pt-8 md:pt-12 px-2 md:px-5 pb-4 md:pb-8 flex flex-col relative">
                    <div className="mt-auto w-full h-8 md:h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-[8px] md:text-sm shadow-lg">Start</div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 5: PLAY N CODÉ --- */}
        <section className="w-full bg-black py-12 md:py-20 relative overflow-hidden border-t border-white/5">
          <div className="container mx-auto px-6 relative z-20 max-w-7xl">
            <div className="text-left mb-12"><h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight font-sans">Play n Codé</h2></div>
            <div className="w-full"><AsteroidGameFrame /></div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default Landing;
