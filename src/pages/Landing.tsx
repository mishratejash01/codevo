import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, ChevronsDown, Terminal, Activity, Maximize2, RefreshCw, Minus, Plus, Download, Play, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { cn } from "@/lib/utils";
import { VirtualKeyboard } from '@/components/VirtualKeyboard';
import { AsteroidGameFrame } from '@/components/AsteroidGameFrame';
import { motion, AnimatePresence } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';
import { FeaturesInfiniteCarousel } from '@/components/FeaturesInfiniteCarousel';

// --- WIDGET IMPORT UPDATED ---
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
  
  // Terminal Animation Logic (ENABLED FOR MOBILE)
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
  }, []); 

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
    // Directly navigate to the compiler page
    setTimeout(() => { navigate('/compiler'); }, 800);
  };

  // --- HANDLERS ---
  const handleJoinClick = () => {
    if (session) {
      navigate('/profile');
    } else {
      navigate('/auth');
    }
  };

  const handleTryNowClick = () => {
    const element = document.getElementById('features-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black selection:bg-white/20 flex flex-col relative overflow-hidden">
      
      <HitMeUpWidget />

      <style>{`
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
        
        {/* --- SECTION 1: HERO --- */}
        <div className="relative w-full min-h-[100dvh] bg-black flex flex-col justify-center items-center shadow-2xl py-20 md:py-32"> 
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center justify-center text-center">
            
            {/* Wider container for Zoomed In Feel */}
            <div className="max-w-5xl mx-auto flex flex-col items-center w-full">
              
              {/* Main Heading: Large & Bold */}
              <h1 
                className="text-[42px] leading-[1.1] md:text-[88px] tracking-tight md:leading-[1] text-white mb-[24px] text-center" 
                style={{ 
                  fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                  fontWeight: 500 
                }}
              >
                <span className="block">The Coding Platform built</span>
                for global developers
              </h1>

              {/* Description: Larger Text */}
              <p 
                className="text-[16px] md:text-[21px] text-[#a1a1aa] max-w-[90%] md:max-w-[850px] mx-auto leading-[1.6] tracking-normal mb-[40px] text-center" 
                style={{ fontFamily: 'var(--font-geom)' }}
              >
                Over 1 million learners trust CODéVO to achieve what basic tutorials never could — delivering depth, rigor, and lasting impact at scale.
              </p>

              {/* Buttons: Large & Prominent */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-[16px] mb-12 relative z-30 w-full md:w-auto">
                <Button 
                  onClick={handleJoinClick}
                  size="lg"
                  className="w-full sm:w-auto h-auto px-[42px] py-[16px] md:py-[20px] bg-white text-black hover:bg-zinc-200 transition-all text-[16px] md:text-[17px] font-semibold rounded-full min-w-[200px] md:min-w-[240px]"
                >
                  Join 1M+ Developers
                </Button>
                
                <Button 
                  onClick={handleTryNowClick}
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-auto px-[42px] py-[16px] md:py-[20px] border-[#333] bg-transparent hover:bg-zinc-900 text-white transition-all text-[16px] md:text-[17px] font-semibold rounded-full"
                >
                  Try Now
                </Button>
              </div>

              {/* --- IMAGE CAROUSEL SECTION --- */}
              <div className="w-full relative z-20 -mt-8">
                {/* Fixed: Used aspect-video and object-contain to ensure image fits horizontally without cutting sides */}
                <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden rounded-t-lg shadow-2xl bg-black">
                  <AnimatePresence mode="popLayout">
                    <motion.img 
                      key={currentImageIndex}
                      src={HERO_IMAGES[currentImageIndex]}
                      alt="Platform Preview" 
                      className="absolute inset-0 w-full h-full object-contain md:object-cover object-bottom"
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
          <div className="hidden md:block absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer" onClick={scrollToContent}>
            <div className="w-[30px] h-[50px] border border-white/20 rounded-full flex justify-center items-center bg-transparent">
              <div className="animate-scroll-arrow"><ChevronsDown className="w-4 h-4 text-white/40" /></div>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: EXPERIENCE REAL CODING (With MacBook Pro Frame) --- */}
        <section id="laptop-section" className="w-full bg-black py-12 md:py-24 relative z-20 -mt-12 overflow-hidden border-b border-white/5 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
          <div className="container mx-auto px-4 md:px-6 relative z-10">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
              
              <div className="flex-1 space-y-8 md:space-y-10 text-center lg:text-left w-full">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center lg:justify-start text-[10px] font-mono text-green-500 mb-2 tracking-widest uppercase">
                    <Activity className="w-3 h-3 animate-pulse" />
                    System::Online
                  </div>
                  <h2 className="text-4xl md:text-6xl font-mono font-bold tracking-tight text-white leading-tight">
                    EXPERIENCE <br/> <span className="text-blue-500">REAL CODING</span>
                  </h2>
                  <p className="font-mono text-xs md:text-base text-gray-400 w-full max-w-[90vw] md:max-w-lg mx-auto lg:mx-0 leading-relaxed">
                    A fully functional development environment right in your browser. <br/>
                    <span className="text-white">Write. Run. Debug. Succeed.</span>
                  </p>
                </div>

                <div className="flex flex-col items-center lg:items-start gap-8 w-full">
                  <Button onClick={handlePracticeClick} className="group h-12 md:h-14 px-8 md:px-10 rounded-[1rem] bg-white text-black hover:bg-white/90 text-base md:text-lg font-bold w-full md:w-auto">
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

              {/* --- MACBOOK PRO VIEWPORT --- */}
              <div className="flex-1 w-full max-w-full lg:max-w-none perspective-2000">
                <div className="relative group w-full max-w-[95vw] md:max-w-[650px] mx-auto transform transition-transform duration-700 hover:rotate-y-[-2deg] hover:rotate-x-[2deg]">
                  
                  {/* Top Case / Lid (Reduced padding from p-2.5 to p-1.5 to thin out the bezel) */}
                  <div className="relative bg-[#0d0d0d] rounded-[14px] md:rounded-[22px] p-1 md:p-1.5 shadow-2xl border border-[#222]">
                     
                     {/* Screen Bezel (Glossy Black) */}
                     <div className="relative bg-black rounded-[10px] md:rounded-[18px] overflow-hidden border border-white/5 ring-1 ring-white/5">
                        
                        {/* Notch Area */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80px] md:w-[120px] h-[12px] md:h-[18px] bg-black rounded-b-[6px] md:rounded-b-[10px] z-50 flex justify-center items-center">
                           {/* Camera Lens */}
                           <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-[#1a1a1a] shadow-inner border border-white/10" />
                        </div>

                        {/* --- COMPILER SCREEN CONTENT --- */}
                        <div className="aspect-[16/10] relative flex flex-col font-sans select-none bg-[#050505]">
                          
                          {/* 1. COMPILER HEADER */}
                          <div className="h-[36px] flex items-center justify-between px-3 border-b border-white/10 bg-[#050505] z-10">
                             <div className="flex items-center gap-1.5">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#666]">
                                  <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
                                </svg>
                             </div>
                             {/* Logo Centered */}
                             <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 flex items-center justify-center">
                                <span className="font-neuropol text-[10px] md:text-xs tracking-[0.2em] text-white/90">
                                  CODéVO
                                </span>
                             </div>
                             <div className="flex items-center gap-2 text-[#666]">
                                <Maximize2 className="w-3 h-3" />
                             </div>
                          </div>

                          {/* 2. WORKSPACE SPLIT */}
                          <div className="flex-1 flex relative bg-[#0a0a0a] overflow-hidden">
                              {/* LEFT PANEL: EDITOR */}
                              <div className="w-[60%] border-r border-white/5 flex flex-col bg-[#050505]">
                                  {/* Left Toolbar */}
                                  <div className="h-[32px] px-2 flex items-center justify-between bg-[#080808] border-b border-white/10">
                                      <div className="flex items-center gap-2">
                                         <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" className="w-3 h-3 opacity-80" alt="py" />
                                         <div className="bg-transparent border border-white/10 text-[6px] md:text-[8px] text-gray-300 px-1.5 py-0.5 rounded-sm uppercase flex items-center gap-1">
                                           Python <span className="text-[6px] text-[#666]">▼</span>
                                         </div>
                                         <div className="w-[1px] h-3 bg-white/10 mx-1" />
                                         <span className="text-[6px] md:text-[8px] font-mono text-[#666]">0.00s</span>
                                      </div>
                                      <div className="flex items-center gap-1.5 text-[#666]">
                                          <div className="flex border border-white/10 rounded overflow-hidden">
                                            <div className="p-0.5 hover:bg-white/5"><Minus className="w-2.5 h-2.5" /></div>
                                            <div className="w-[1px] bg-white/10" />
                                            <div className="p-0.5 hover:bg-white/5"><Plus className="w-2.5 h-2.5" /></div>
                                          </div>
                                          <RefreshCw className="w-2.5 h-2.5" />
                                      </div>
                                  </div>
                                  {/* Editor Area */}
                                  <div className="flex-1 p-3 font-mono text-[6px] md:text-[10px] text-gray-300 leading-relaxed overflow-hidden">
                                      <div><span className="text-blue-400">def</span> <span className="text-yellow-200">optimize_route</span>(nodes):</div>
                                      <div className="pl-3 text-[#6a9955]"># Initialize DP table</div>
                                      <div className="pl-3">dp = [<span className="text-blue-400">float</span>(<span className="text-green-400">'inf'</span>)] * <span className="text-blue-400">len</span>(nodes)</div>
                                      <div className="pl-3">dp[0] = <span className="text-green-400">0</span></div>
                                      <br/>
                                      <div className="pl-3 text-purple-400">for</div>
                                      <div className="pl-3 text-white">...</div>
                                  </div>
                              </div>

                              {/* RIGHT PANEL: TERMINAL */}
                              <div className="flex-1 flex flex-col bg-[#050505]">
                                  {/* Right Toolbar */}
                                  <div className="h-[32px] px-2 flex items-center justify-between bg-[#080808] border-b border-white/10">
                                      <span className="text-[5px] md:text-[8px] font-semibold uppercase tracking-widest text-[#666] flex items-center gap-1">
                                        <Terminal className="w-2.5 h-2.5" /> Console
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                         <Download className="w-2.5 h-2.5 text-[#666]" />
                                         <div className="bg-white text-black px-2 py-0.5 rounded-[1px] flex items-center gap-0.5">
                                            <Play className="w-2 h-2 fill-current" />
                                            <span className="text-[5px] md:text-[7px] font-bold uppercase tracking-wider">Run</span>
                                         </div>
                                      </div>
                                  </div>
                                  {/* Terminal Area */}
                                  <div className="flex-1 bg-[#010409] p-3 font-mono text-[6px] md:text-[10px] text-green-400/90 leading-relaxed">
                                      <div>&gt;&gt; SYSTEM READY</div>
                                      <div className="text-gray-500">&gt;&gt; Initializing Kernel...</div>
                                      <div className="mt-1">&gt;&gt; <span className="animate-pulse">_</span></div>
                                  </div>
                              </div>
                          </div>

                          {/* 3. FOOTER */}
                          <div className="h-[24px] border-t border-white/10 bg-[#050505] flex items-center justify-between px-3 text-[6px] md:text-[8px] text-[#666] uppercase tracking-widest">
                             <div className="flex items-center gap-1.5">
                               <div className="w-1.5 h-1.5 rounded-full bg-[#3fb950] shadow-[0_0_4px_#3fb950]" />
                               <span>Connected / encrypted_v2</span>
                             </div>
                             <span>Codevo 2025</span>
                          </div>

                        </div>
                     </div>
                  </div>

                  {/* Bottom Case / Base */}
                  <div className="relative -mt-[1px] mx-[2%]">
                     {/* Hinge Area */}
                     <div className="h-2 bg-[#111] rounded-b-sm border-x border-b border-[#222]" />
                     {/* Main Base */}
                     <div className="h-2.5 md:h-3.5 bg-gradient-to-b from-[#1a1a1a] to-[#111] rounded-b-[10px] md:rounded-b-[16px] border border-[#222] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] flex justify-center">
                        {/* Opening Indent */}
                        <div className="w-[15%] h-[2px] md:h-[3px] bg-[#222] rounded-b-md border-x border-b border-[#333]" />
                     </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* --- NEW SECTION: FEATURES CAROUSEL --- */}
        <div id="features-section">
          <FeaturesInfiniteCarousel />
        </div>
        
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
