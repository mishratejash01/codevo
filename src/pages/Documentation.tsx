import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Code2, GraduationCap, Trophy, Shield, User, Terminal, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Mini Visual Components (Mockups) ---

// Abstract Version
const MiniLanding = () => (
  <div className="flex flex-col h-full bg-black/90 p-4 relative overflow-hidden">
    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
    <div className="mt-8 space-y-4 text-center z-10">
      <div className="w-32 h-8 bg-white/10 rounded mx-auto mb-4" />
      <div className="text-2xl font-bold text-white tracking-widest font-neuropol">CODéVO</div>
      <div className="h-2 w-48 bg-white/20 rounded mx-auto" />
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-8 h-8 rounded bg-white/5" />
        <div className="w-8 h-8 rounded bg-white/5" />
        <div className="w-8 h-8 rounded bg-white/5" />
      </div>
    </div>
    <div className="mt-auto bg-[#0c0c0e] rounded-t-xl h-32 border-t border-white/10 p-3">
       <div className="flex gap-2">
         <div className="w-1/3 h-16 bg-white/5 rounded" />
         <div className="w-2/3 h-16 bg-white/5 rounded" />
       </div>
    </div>
  </div>
);

const MiniAuth = () => (
  <div className="flex h-full bg-[#09090b]">
    <div className="w-1/2 p-6 flex flex-col justify-center space-y-4">
      <div className="space-y-1">
        <div className="h-3 w-20 bg-white/20 rounded" />
        <div className="h-5 w-32 bg-white rounded" />
      </div>
      <div className="h-8 w-full bg-white text-black rounded flex items-center justify-center gap-2 text-[8px] font-bold">
        <div className="w-2 h-2 bg-blue-500 rounded-full" /> Google Sign In
      </div>
      <div className="h-px w-full bg-white/10" />
      <div className="font-neuropol text-[10px] text-white/50 text-center">CODéVO</div>
    </div>
    <div className="w-1/2 bg-black relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] to-transparent z-10" />
      <div className="font-mono text-[6px] text-green-500/50 leading-tight p-2 opacity-50">
        {Array(20).fill("01").map((_, i) => <span key={i}>{Math.random() > 0.5 ? "10 " : "01 "}</span>)}
      </div>
    </div>
  </div>
);

// Abstract Version
const MiniDegree = () => (
  <div className="flex flex-col h-full bg-[#09090b] p-4">
    <div className="flex gap-2 mb-4">
      <div className="h-8 w-20 bg-primary/20 rounded border border-primary/30" />
      <div className="h-8 w-20 bg-white/5 rounded border border-white/10" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="aspect-video bg-white/5 rounded border border-white/10 p-2 flex flex-col justify-between">
          <div className="w-6 h-6 bg-white/10 rounded" />
          <div className="h-2 w-3/4 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const MiniPractice = () => (
  <div className="flex h-full bg-[#09090b] text-[6px] font-mono">
    <div className="w-1/4 border-r border-white/10 bg-[#0c0c0e] flex flex-col">
      <div className="p-2 border-b border-white/10 font-bold text-gray-400">EXPLORER</div>
      {[1,2,3,4].map(i => (
        <div key={i} className={cn("p-2 border-b border-white/5 flex items-center gap-2", i === 1 ? "bg-white/5 border-l-2 border-l-primary" : "text-gray-600")}>
          <div className={cn("w-1.5 h-1.5 rounded-full", i===1 ? "bg-yellow-500" : "bg-green-500")} />
          Problem _{i}
        </div>
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-6 border-b border-white/10 flex items-center px-2 bg-[#0c0c0e] justify-between">
        <span className="text-blue-400">main.py</span>
        <div className="flex gap-1">
          <div className="px-2 py-0.5 bg-green-900/30 text-green-400 rounded">RUN</div>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1">
        <div className="text-gray-500"># Solution</div>
        <div><span className="text-purple-400">def</span> <span className="text-yellow-200">two_sum</span>(nums, target):</div>
        <div className="pl-2"><span className="text-purple-400">for</span> i <span className="text-purple-400">in</span> <span className="text-blue-300">range</span>(<span className="text-blue-300">len</span>(nums)):</div>
        <div className="pl-4 text-gray-400"># TODO: Implement logic</div>
        <div className="pl-4"><span className="text-purple-400">pass</span></div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-1 h-2 bg-primary ml-4 mt-1"
        />
      </div>
      <div className="h-1/3 border-t border-white/10 bg-[#0a0a0a] p-2">
        <div className="text-green-400 mb-1">{">"} Test Case 1: Passed</div>
        <div className="text-red-400">{">"} Test Case 2: Failed (Expected 5, got 3)</div>
      </div>
    </div>
  </div>
);

const MiniExam = () => (
  <div className="flex flex-col h-full bg-[#000000] relative font-sans">
    <div className="h-8 bg-red-950/20 border-b border-red-900/30 flex items-center justify-between px-3">
      <div className="flex items-center gap-2">
        <Shield className="w-3 h-3 text-red-500" />
        <span className="text-[8px] font-bold text-red-400">SECURE BROWSER ENFORCED</span>
      </div>
      <div className="text-[8px] font-mono text-red-300">01:59:45</div>
    </div>
    <div className="flex-1 flex relative">
      <div className="flex-1 p-4">
        <div className="h-2 w-1/3 bg-white/10 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-white/5 rounded" />
          <div className="h-1.5 w-5/6 bg-white/5 rounded" />
          <div className="h-1.5 w-4/6 bg-white/5 rounded" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-2">
          <div className="h-6 border border-white/10 rounded bg-white/5 flex items-center px-2 text-[8px] text-gray-400">Option A</div>
          <div className="h-6 border border-blue-500/50 rounded bg-blue-500/10 flex items-center px-2 text-[8px] text-blue-200">Option B</div>
          <div className="h-6 border border-white/10 rounded bg-white/5 flex items-center px-2 text-[8px] text-gray-400">Option C</div>
        </div>
      </div>
      <div className="absolute top-2 right-2 w-16 h-12 bg-gray-900 border border-white/10 rounded shadow-2xl flex items-center justify-center">
        <div className="w-4 h-4 bg-white/10 rounded-full animate-pulse" />
        <div className="absolute bottom-0.5 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
      </div>
    </div>
  </div>
);

const MiniLeaderboard = () => (
  <div className="flex flex-col h-full bg-[#0c0c0e] p-4 font-sans">
    <div className="flex items-center justify-center mb-4 space-x-2">
      <Trophy className="w-4 h-4 text-yellow-500" />
      <span className="text-[10px] font-bold text-white font-neuropol">HALL OF FAME</span>
    </div>
    <div className="space-y-1.5">
      {[
        { name: "Alex_Dev", score: 9850, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
        { name: "CodeNinja", score: 9420, color: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/20" },
        { name: "PyMaster", score: 8900, color: "text-amber-700", bg: "bg-amber-900/10", border: "border-amber-900/20" },
      ].map((rank, i) => (
        <div key={i} className={cn("flex items-center justify-between p-2 rounded border", rank.bg, rank.border)}>
          <div className="flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border", rank.border, rank.color)}>{i+1}</div>
            <div className="text-[8px] text-white font-medium">{rank.name}</div>
          </div>
          <div className="text-[8px] font-mono text-gray-400">{rank.score}</div>
        </div>
      ))}
      <div className="h-px w-full bg-white/5 my-1" />
      <div className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 opacity-50">
        <div className="flex items-center gap-2">
          <div className="text-[8px] text-gray-500">#42</div>
          <div className="text-[8px] text-gray-400">You</div>
        </div>
        <div className="text-[8px] font-mono text-gray-500">1200</div>
      </div>
    </div>
  </div>
);

// --- Main Data ---

type DocSection = {
  id: string;
  title: string;
  route: string;
  icon: React.ReactNode;
  description: string;
  technicalDetails: string[];
  visualComponent: React.ReactNode;
};

const SECTIONS: DocSection[] = [
  {
    id: 'landing',
    title: 'Centralized Navigation Interface',
    route: '/',
    icon: <Home className="w-5 h-5 text-primary" />,
    description: "The primary operational dashboard serving as the ecosystem's entry vector. It facilitates high-level navigation, presents core platform capabilities, and provides immediate operational status metrics.",
    technicalDetails: ["Dynamic Route Rendering", "Interactive Feature Showcase", "Global State Management"],
    visualComponent: <MiniLanding />
  },
  {
    id: 'auth',
    title: 'Secure Identity Management',
    route: '/auth',
    icon: <User className="w-5 h-5 text-blue-400" />,
    description: "A robust authentication gateway utilizing OAuth 2.0 protocols. This module handles secure session initiation, token persistence, and role-based access control for protected academic resources.",
    technicalDetails: ["OAuth 2.0 Integration", "JWT Token Handling", "Session Persistence Layer"],
    visualComponent: <MiniAuth />
  },
  {
    id: 'degree',
    title: 'Academic Curriculum Dashboard',
    route: '/degree',
    icon: <GraduationCap className="w-5 h-5 text-green-400" />,
    description: "A specialized interface for the IIT Madras BS Degree program. It implements a hierarchical content structure, enabling granular filtering by academic level (Foundation, Diploma, Degree) and subject matter.",
    technicalDetails: ["Relational Data Mapping", "Real-time Filtering", "Dynamic Content Hydration"],
    visualComponent: <MiniDegree />
  },
  {
    id: 'practice',
    title: 'Integrated Development Environment',
    route: '/practice',
    icon: <Code2 className="w-5 h-5 text-purple-400" />,
    description: "A feature-rich coding environment tailored for skill acquisition. It integrates the Monaco Editor for syntax highlighting and employs a WebAssembly-based runtime for secure, client-side code execution.",
    technicalDetails: ["Monaco Editor Integration", "Pyodide WASM Runtime", "Client-side Sandboxing"],
    visualComponent: <MiniPractice />
  },
  {
    id: 'exam',
    title: 'Proctored Assessment Environment',
    route: '/exam',
    icon: <Shield className="w-5 h-5 text-red-500" />,
    description: "A highly secure environment designed for formal evaluations. It enforces strict compliance via Fullscreen API integration, visibility state monitoring, and browser fingerprinting prevention mechanisms.",
    technicalDetails: ["Fullscreen API Enforcement", "Visibility API Monitoring", "Input Event Interception"],
    visualComponent: <MiniExam />
  },
  {
    id: 'leaderboard',
    title: 'Global Performance Metrics',
    route: '/leaderboard',
    icon: <Trophy className="w-5 h-5 text-yellow-500" />,
    description: "An analytics-driven leaderboard system that aggregates user performance data. It employs real-time database subscriptions to reflect score updates instantaneously across the global user base.",
    technicalDetails: ["Real-time Aggregation", "PostgreSQL Views", "Optimized Query Caching"],
    visualComponent: <MiniLeaderboard />
  }
];

// --- Components ---

const LaptopFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full max-w-[600px] aspect-[16/10] perspective-1000 group mx-auto">
    {/* Lid/Screen */}
    <div className="relative w-full h-full bg-[#121212] rounded-[12px] border-[1px] border-[#333] shadow-2xl overflow-hidden transform-gpu transition-transform duration-700 ease-out group-hover:rotate-x-1 ring-1 ring-white/10">
      {/* Bezel */}
      <div className="absolute inset-0 border-[8px] border-[#0a0a0a] rounded-[10px] z-20 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-4 bg-[#0a0a0a] rounded-b-md flex items-center justify-center">
           <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full border border-white/5" />
        </div>
      </div>
      
      {/* Screen Content */}
      <div className="w-full h-full bg-black overflow-hidden relative pt-[8px] px-[8px] pb-[8px]">
        {children}
        {/* Screen Glare/Reflection */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none mix-blend-overlay z-10" />
        {/* Scanline Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-20" />
      </div>
    </div>
    
    {/* Base - Keyboard Area Mockup */}
    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-[110%] h-3 bg-[#151515] rounded-b-xl border-t border-[#222] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-0 transform translate-z-10 flex justify-center">
      <div className="w-24 h-1 bg-[#222] rounded-b-md mt-[1px]" />
    </div>
  </div>
);

const Documentation = () => {
  const navigate = useNavigate();
  const [activeSectionId, setActiveSectionId] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((el) => { if (el) observer.observe(el); });
    return () => observer.disconnect();
  }, []);

  const activeSection = SECTIONS.find(s => s.id === activeSectionId) || SECTIONS[0];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6 md:px-12 justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white transition-colors pl-0 gap-2 hover:bg-transparent">
          <ArrowLeft className="w-4 h-4" /> Return to Platform
        </Button>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span className="font-neuropol text-sm tracking-widest text-white/50">SYS.DOCS.V1</span>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row relative pt-16">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="w-full lg:w-[45%] p-6 md:p-12 lg:p-16 space-y-40 pb-40">
          
          <div className="space-y-6">
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5 uppercase tracking-widest px-3 py-1">System Architecture</Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide text-white leading-tight">
              Operational<br/>Manual
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md border-l-2 border-white/10 pl-6">
              Comprehensive technical documentation for the <span className="text-white font-bold">CODéVO</span> ecosystem.
            </p>
          </div>

          {SECTIONS.map((section, index) => (
            <div 
              key={section.id} 
              id={section.id}
              ref={el => sectionRefs.current[section.id] = el}
              className="scroll-mt-40 space-y-8 group"
            >
              {/* Section Header */}
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] transition-all duration-500">
                  {section.icon}
                </div>
                <div className="font-mono text-xs text-muted-foreground/60 tracking-widest">
                  MODULE_0{index + 1}
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-3xl font-bold text-white group-hover:text-primary transition-colors duration-300">
                  {section.title}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="h-px w-8 bg-primary/50" />
                  <code className="text-xs text-primary/80 bg-primary/5 px-2 py-1 rounded border border-primary/10">
                    {section.route}
                  </code>
                </div>
                <p className="text-base text-gray-400 leading-8 text-justify">
                  {section.description}
                </p>
              </div>

              {/* Technical Card */}
              <Card className="bg-[#0a0a0a] border-white/5 overflow-hidden">
                <CardHeader className="bg-white/[0.02] border-b border-white/5 py-3">
                  <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Technical Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <ul className="grid grid-cols-1 gap-3">
                    {section.technicalDetails.map((tech, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300 group/item">
                        <div className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/item:bg-primary transition-colors" />
                        {tech}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Mobile Visual - Embedded directly after the module content */}
              <div className="lg:hidden mt-8 mb-4">
                 <LaptopFrame>
                   {section.visualComponent}
                 </LaptopFrame>
                 <div className="text-center mt-4">
                    <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                      Preview: {section.title}
                    </p>
                 </div>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Sticky Visuals (Desktop Only) */}
        <div className="hidden lg:flex w-[55%] sticky top-16 h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] overflow-hidden">
          
          {/* Animated Background Mesh */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full animate-pulse" />
          </div>

          <div className="w-full px-12 relative z-10 flex flex-col items-center gap-12">
            <LaptopFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection.id}
                  initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="w-full h-full"
                >
                  {activeSection.visualComponent}
                </motion.div>
              </AnimatePresence>
            </LaptopFrame>

            <div className="text-center space-y-2">
              <motion.div
                key={`label-${activeSection.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Live Preview: {activeSection.title}
                </span>
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Documentation;
