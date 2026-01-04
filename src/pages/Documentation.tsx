import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Home, 
  Code2, 
  Trophy, 
  User, 
  Terminal, 
  ChevronRight, 
  Hash, 
  Calendar,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Mini Visual Components (Mockups) ---

// 1. Landing / Navigation
const MiniLanding = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4 relative overflow-hidden font-sans">
    <div className="absolute top-0 left-0 right-0 h-1 bg-white/20" />
    <div className="mt-8 space-y-4 text-center z-10">
      <div className="w-32 h-6 bg-white/10 rounded-sm mx-auto mb-4" />
      <div className="text-2xl font-bold text-white tracking-widest font-neuropol">CODéVO</div>
      <div className="h-2 w-48 bg-white/10 rounded-sm mx-auto" />
      <div className="flex justify-center gap-2 mt-4">
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
        <div className="w-8 h-8 rounded-sm bg-white/5 border border-white/10" />
      </div>
    </div>
    <div className="mt-auto bg-[#0a0a0a] rounded-t-lg h-32 border-t border-white/10 p-3">
       <div className="flex gap-2">
         <div className="w-1/3 h-16 bg-white/5 rounded-sm" />
         <div className="w-2/3 h-16 bg-white/5 rounded-sm" />
       </div>
    </div>
  </div>
);

// 2. Auth
const MiniAuth = () => (
  <div className="flex h-full bg-[#050505]">
    <div className="w-1/2 p-6 flex flex-col justify-center space-y-4">
      <div className="space-y-1">
        <div className="h-3 w-20 bg-white/20 rounded-sm" />
        <div className="h-5 w-32 bg-white rounded-sm" />
      </div>
      <div className="h-8 w-full bg-white text-black rounded-sm flex items-center justify-center gap-2 text-[8px] font-bold">
        <div className="w-2 h-2 bg-black rounded-full" /> Google Sign In
      </div>
      <div className="h-px w-full bg-white/10" />
      <div className="font-neuropol text-[10px] text-white/50 text-center">CODéVO</div>
    </div>
    <div className="w-1/2 bg-black relative overflow-hidden flex items-center justify-center border-l border-white/10">
      <div className="absolute inset-0 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:8px_8px] opacity-20" />
      <div className="font-mono text-[8px] text-white/50">Authenticate</div>
    </div>
  </div>
);

// 3. Practice Arena
const MiniPractice = () => (
  <div className="flex h-full bg-[#050505] text-[6px] font-mono">
    <div className="w-1/4 border-r border-white/10 bg-[#0a0a0a] flex flex-col">
      <div className="p-2 border-b border-white/10 font-bold text-gray-400">EXPLORER</div>
      {[1,2,3,4].map(i => (
        <div key={i} className={cn("p-2 border-b border-white/5 flex items-center gap-2", i === 1 ? "bg-white/10 text-white" : "text-gray-600")}>
          <div className={cn("w-1 h-1 rounded-sm", i===1 ? "bg-white" : "bg-gray-700")} />
          algorithm_{i}.ts
        </div>
      ))}
    </div>
    <div className="flex-1 flex flex-col">
      <div className="h-6 border-b border-white/10 flex items-center px-2 bg-[#0a0a0a] justify-between">
        <span className="text-gray-300">main.ts</span>
        <div className="flex gap-1">
          <div className="px-2 py-0.5 bg-white text-black font-bold rounded-[2px]">RUN</div>
        </div>
      </div>
      <div className="flex-1 p-2 space-y-1 bg-[#050505]">
        <div className="text-gray-600">// Two Sum Solution</div>
        <div><span className="text-white">function</span> <span className="text-gray-300">twoSum</span>(nums, target) {'{'}</div>
        <div className="pl-2"><span className="text-white">const</span> map = <span className="text-white">new</span> Map();</div>
        <div className="pl-2"><span className="text-gray-500">...</span></div>
        <div className="pl-2">{'}'}</div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="w-1 h-2 bg-white ml-2 mt-1"
        />
      </div>
      <div className="h-1/3 border-t border-white/10 bg-[#0a0a0a] p-2">
        <div className="text-gray-400 mb-1">{">"} Running test cases...</div>
        <div className="text-white">{">"} All Passed (12ms)</div>
      </div>
    </div>
  </div>
);

// 4. Events (NEW)
const MiniEvents = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4 font-sans">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-3 h-3 text-white" />
        <span className="text-[8px] font-bold text-white tracking-widest">LIVE EVENTS</span>
      </div>
      <div className="px-1.5 py-0.5 rounded-sm bg-white/10 border border-white/10 text-[6px] text-white">FILTER</div>
    </div>
    <div className="space-y-2">
      {[
        { title: "Weekly Contest 102", status: "LIVE", users: "1.2k" },
        { title: "CodeVo Hackathon", status: "REG", users: "500+" },
        { title: "Algorithm Sprint", status: "ENDED", users: "890" }
      ].map((event, i) => (
        <div key={i} className="flex flex-col p-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[8px] font-bold text-white">{event.title}</span>
            <span className={cn(
              "text-[6px] px-1 rounded-sm border", 
              event.status === "LIVE" ? "border-red-500/50 text-red-400 bg-red-500/10" : 
              event.status === "REG" ? "border-green-500/50 text-green-400 bg-green-500/10" : 
              "border-white/10 text-gray-500"
            )}>
              {event.status}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[6px] text-gray-500">
             <span>{event.users} Participants</span>
             <div className="h-1 w-1 rounded-full bg-gray-700" />
             <span>Ranked</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// 5. Profile & Activity (NEW)
const MiniProfile = () => (
  <div className="flex flex-col h-full bg-[#050505] font-sans">
     {/* Profile Header */}
     <div className="h-12 bg-white/5 border-b border-white/10 p-3 flex items-center gap-3">
        <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center text-[8px] font-bold">JD</div>
        <div>
           <div className="h-1.5 w-16 bg-white/20 rounded-sm mb-1" />
           <div className="h-1 w-10 bg-white/10 rounded-sm" />
        </div>
     </div>
     
     <div className="p-3 space-y-4">
        {/* Heatmap Mockup */}
        <div>
           <div className="text-[6px] text-gray-500 mb-1 uppercase tracking-wider">Activity</div>
           <div className="grid grid-cols-12 gap-0.5">
              {Array.from({ length: 36 }).map((_, i) => (
                 <div 
                   key={i} 
                   className={cn(
                     "w-full aspect-square rounded-[1px]", 
                     Math.random() > 0.7 ? "bg-white/80" : Math.random() > 0.4 ? "bg-white/20" : "bg-white/5"
                   )} 
                 />
              ))}
           </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-2">
           <div className="p-2 border border-white/10 rounded-sm bg-white/[0.02]">
              <div className="text-[6px] text-gray-500 uppercase">Solved</div>
              <div className="text-[10px] font-bold text-white mt-0.5">142</div>
           </div>
           <div className="p-2 border border-white/10 rounded-sm bg-white/[0.02]">
              <div className="text-[6px] text-gray-500 uppercase">Streak</div>
              <div className="text-[10px] font-bold text-white mt-0.5">12 Days</div>
           </div>
        </div>
     </div>
  </div>
);

// 6. Leaderboard
const MiniLeaderboard = () => (
  <div className="flex flex-col h-full bg-[#050505] p-4 font-sans">
    <div className="flex items-center justify-center mb-4 space-x-2">
      <Trophy className="w-4 h-4 text-white" />
      <span className="text-[10px] font-bold text-white tracking-widest">RANKINGS</span>
    </div>
    <div className="space-y-1.5">
      {[1, 2, 3].map((rank, i) => (
        <div key={i} className="flex items-center justify-between p-2 rounded-sm border border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-white/10 flex items-center justify-center text-[8px] font-bold text-white">{rank}</div>
            <div className="h-1.5 w-12 bg-white/10 rounded-sm" />
          </div>
          <div className="h-1.5 w-6 bg-white/10 rounded-sm" />
        </div>
      ))}
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
    title: 'Platform Navigation',
    route: '/',
    icon: <Home className="w-5 h-5" />,
    description: "The primary entry vector serving as the operational command center. It facilitates high-level ecosystem navigation, presents core platform capabilities, and provides immediate status metrics through a unified interface.",
    technicalDetails: ["Dynamic Route Rendering", "Interactive Feature Showcase", "Global State Management"],
    visualComponent: <MiniLanding />
  },
  {
    id: 'auth',
    title: 'Identity Management',
    route: '/auth',
    icon: <User className="w-5 h-5" />,
    description: "A robust authentication gateway utilizing OAuth 2.0 protocols. This module handles secure session initiation, JWT token persistence, and role-based access control for protected resources.",
    technicalDetails: ["OAuth 2.0 Integration", "JWT Token Handling", "Session Persistence"],
    visualComponent: <MiniAuth />
  },
  {
    id: 'practice',
    title: 'Practice Arena',
    route: '/practice-arena',
    icon: <Code2 className="w-5 h-5" />,
    description: "A feature-rich coding environment tailored for skill acquisition. Integrates the Monaco Editor for professional syntax highlighting and employs a WebAssembly runtime for secure, client-side code execution.",
    technicalDetails: ["Monaco Editor Engine", "Pyodide WASM Runtime", "Client-side Sandboxing"],
    visualComponent: <MiniPractice />
  },
  {
    id: 'events',
    title: 'Events & Hackathons',
    route: '/events',
    icon: <Calendar className="w-5 h-5" />,
    description: "Comprehensive event management system supporting competitive programming contests, hackathons, and webinars. Features real-time registration tracking, countdown timers, and live status updates.",
    technicalDetails: ["Real-time Websockets", "Concurrency Management", "Dynamic Status Updates"],
    visualComponent: <MiniEvents />
  },
  {
    id: 'profile',
    title: 'Profile & Activity',
    route: '/profile',
    icon: <Activity className="w-5 h-5" />,
    description: "Detailed user analytics dashboard visualizing coding activity, problem-solving streaks, and skill progression. Includes GitHub-style contribution heatmaps and persistent statistics tracking.",
    technicalDetails: ["Data Visualization", "Activity Aggregation", "Persistent Storage"],
    visualComponent: <MiniProfile />
  },
  {
    id: 'leaderboard',
    title: 'Global Leaderboard',
    route: '/leaderboard',
    icon: <Trophy className="w-5 h-5" />,
    description: "Analytics-driven leaderboard system aggregating user performance. Employs real-time database subscriptions to reflect score updates instantaneously across the global user base.",
    technicalDetails: ["Real-time Aggregation", "PostgreSQL Views", "Query Caching"],
    visualComponent: <MiniLeaderboard />
  }
];

// --- Components ---

const LaptopFrame = ({ children }: { children: React.ReactNode }) => (
  <div className="relative w-full max-w-[600px] aspect-[16/10] perspective-1000 group mx-auto">
    {/* Lid/Screen */}
    <div className="relative w-full h-full bg-[#0a0a0a] rounded-[6px] border border-[#333] shadow-2xl overflow-hidden ring-1 ring-white/5">
      {/* Screen Content */}
      <div className="w-full h-full bg-black overflow-hidden relative">
        {children}
        {/* Subtle Glare */}
        <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/[0.02] to-transparent pointer-events-none z-10" />
      </div>
    </div>
    
    {/* Base - Keyboard Area Mockup */}
    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[102%] h-2 bg-[#1a1a1a] rounded-b-md border-t border-[#333] shadow-[0_20px_40px_-10px_rgba(0,0,0,1)] z-0 flex justify-center">
      <div className="w-16 h-1 bg-[#2a2a2a] rounded-b-sm mt-[1px]" />
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
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-white/20">
      
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 h-16 flex items-center px-6 md:px-12 justify-between">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-gray-400 hover:text-white transition-colors pl-0 gap-2 hover:bg-transparent text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Platform
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-1.5 w-1.5 rounded-full bg-white/40" />
          <span className="font-mono text-xs text-white/40 tracking-wider">SYSTEM_DOCS</span>
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row relative pt-16">
        
        {/* LEFT COLUMN: Scrollable Content */}
        <div className="w-full lg:w-[45%] p-6 md:p-12 lg:p-16 space-y-40 pb-40">
          
          <div className="space-y-8 pt-10">
            <div className="inline-flex items-center gap-2 px-2 py-1 rounded border border-white/10 bg-white/5">
                <Terminal className="w-3 h-3 text-white/70" />
                <span className="text-[10px] font-mono font-medium text-white/70 uppercase tracking-widest">Version 2.0</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white leading-[1.1]">
              System<br/>Documentation
            </h1>
            <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-md">
              Detailed technical specifications and operational manuals for the CodeVo ecosystem. Designed for developers and system administrators.
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
                <span className="font-mono text-xs text-white/30 tracking-widest">0{index + 1}</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                  {section.title}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-[#111] border border-white/10 text-[10px] font-mono text-gray-400">
                    <Hash className="w-2.5 h-2.5" />
                    {section.route}
                  </div>
                </div>
                <p className="text-sm md:text-base text-gray-400 leading-7 text-justify">
                  {section.description}
                </p>
              </div>

              {/* Technical Details - Minimalist List */}
              <div className="border-l-2 border-white/5 pl-6 py-2">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-4 font-mono">Technical Specs</h4>
                 <ul className="space-y-3">
                    {section.technicalDetails.map((tech, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
                        <ChevronRight className="w-3 h-3 text-white/30" />
                        {tech}
                      </li>
                    ))}
                  </ul>
              </div>

              {/* Mobile Visual - Embedded directly after the module content */}
              <div className="lg:hidden mt-8 mb-4">
                 <LaptopFrame>
                   {section.visualComponent}
                 </LaptopFrame>
              </div>

            </div>
          ))}
        </div>

        {/* RIGHT COLUMN: Sticky Visuals (Desktop Only) */}
        <div className="hidden lg:flex w-[55%] sticky top-16 h-[calc(100vh-4rem)] items-center justify-center bg-[#050505] overflow-hidden border-l border-white/5">
          
          <div className="w-full px-16 relative z-10 flex flex-col items-center gap-10">
            <LaptopFrame>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full"
                >
                  {activeSection.visualComponent}
                </motion.div>
              </AnimatePresence>
            </LaptopFrame>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/[0.02]">
               <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
               <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                 Live Preview: {activeSection.title}
               </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Documentation;
