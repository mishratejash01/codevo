import { ArrowUpRight } from "lucide-react";

// --- Custom SVG Graphics from your design ---

const LeaderboardIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
    <g stroke="#444" strokeWidth="1" fill="none">
      <path d="M50 15 L80 35 L80 65 L50 85 L20 65 L20 35 Z" />
      <circle cx="50" cy="50" r="15" fill="#222" stroke="#666" />
      <path d="M45 65 L40 80 L50 75 L60 80 L55 65" fill="#333" />
    </g>
  </svg>
);

const StreakIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
    <defs>
      <radialGradient id="fireGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ff6b00" />
        <stop offset="100%" stopColor="#331100" />
      </radialGradient>
    </defs>
    <path d="M50 10 Q70 40 50 60 Q30 40 50 10" fill="url(#fireGrad)" opacity="0.8" />
    <circle cx="50" cy="70" r="8" fill="#444" />
  </svg>
);

const CompilerIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
    <rect x="20" y="30" width="60" height="40" rx="4" fill="#1a1a1a" stroke="#444" />
    <text x="30" y="55" fill="#00ff00" fontFamily="monospace" fontSize="10">{">_ run"}</text>
  </svg>
);

const CompetitionsIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
    <path d="M30 30 H70 V50 Q50 80 30 50 Z" fill="#222" stroke="#ffd700" strokeWidth="2" />
    <rect x="45" y="80" width="10" height="5" fill="#ffd700" />
  </svg>
);

const BlogIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
    <rect x="30" y="20" width="40" height="60" rx="2" fill="#222" stroke="#555" />
    <line x1="35" y1="35" x2="65" y2="35" stroke="#444" strokeWidth="2" />
    <line x1="35" y1="45" x2="65" y2="45" stroke="#444" strokeWidth="2" />
  </svg>
);

const ProfileIcon = () => (
   <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
     <circle cx="50" cy="40" r="15" fill="#222" stroke="#555" />
     <path d="M25 80 Q50 90 75 80 V90 H25 Z" fill="#222" stroke="#555" />
     <rect x="20" y="20" width="60" height="60" rx="4" fill="none" stroke="#444" />
   </svg>
);

export function FeaturesInfiniteCarousel() {
  const features = [
    {
      title: "SEAL Leaderboards: Expert Evaluations",
      label: "Leaderboards",
      icon: LeaderboardIcon,
      status: "active"
    },
    {
      title: "Maintain Streak: Keep Your Code Alive",
      label: "Consistency",
      icon: StreakIcon,
      status: "active"
    },
    {
      title: "Online Compiler: Instant Execution",
      label: "IDE",
      icon: CompilerIcon,
      status: "active"
    },
    {
      title: "Competitions: Win Rewards & Honor",
      label: "Challenges",
      icon: CompetitionsIcon,
      status: "active"
    },
    {
      title: "Tech Blog: Community Tutorials",
      label: "Insights",
      icon: BlogIcon,
      status: "coming_soon"
    },
    {
      title: "Profile Card: Showcase Stats",
      label: "Identity",
      icon: ProfileIcon,
      status: "active"
    }
  ];

  return (
    // Wrapper: Full width with radial background
    <div className="w-full py-[60px] overflow-hidden bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)] border-t border-white/5">
      
      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll-features {
          animation: scroll 40s linear infinite;
        }
        .carousel-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* Track Container */}
      <div className="flex w-max animate-scroll-features carousel-track">
        
        {/* Double map for infinite loop */}
        {[...features, ...features].map((feature, index) => (
          <div 
            key={index} 
            className="group w-[550px] h-[280px] mx-[15px] bg-[#0d0d0e] rounded-[32px] border border-[#1f1f21] flex items-center relative px-[40px] shrink-0 transition-all duration-300 hover:border-[#333] hover:-translate-y-1"
          >
            {/* 3D Icon Box */}
            <div className="w-[140px] h-[140px] shrink-0 flex justify-center items-center relative">
              <feature.icon />
            </div>

            {/* Content */}
            <div className="ml-[30px] flex flex-col gap-2 z-10">
              <span className="text-[#d1a5ff] text-[18px] font-medium capitalize">
                {feature.label}
              </span>
              
              <h3 className="text-white text-[32px] font-semibold leading-[1.1] m-0">
                {feature.title.split(': ')[0]} <br/>
                <span className="text-[0.8em] opacity-80 font-normal text-gray-400">
                   {feature.title.split(': ')[1]}
                </span>
              </h3>

              {feature.status === "coming_soon" && (
                <div className="mt-[10px] w-fit px-3 py-1 rounded-[20px] border border-white/10 bg-white/5 text-[#88888e] text-[12px]">
                  Coming Soon
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="absolute bottom-[30px] right-[30px] w-[50px] h-[50px] bg-[#2a2a2c] rounded-full flex justify-center items-center transition-colors duration-300 group-hover:bg-white z-20 shadow-lg">
              <ArrowUpRight className="w-[24px] h-[24px] text-[#888] stroke-[2.5] transition-colors duration-300 group-hover:text-black" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
