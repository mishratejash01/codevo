import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { ArrowUpRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

// --- Custom SVG Graphics ---

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
  const navigate = useNavigate();
  
  // Autoplay config: 3s delay, pauses on hover/interaction
  const plugin = React.useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false })
  );

  const features = [
    {
      title: "SEAL Leaderboards",
      subtitle: "Expert Evaluations",
      label: "Leaderboards",
      icon: LeaderboardIcon,
      status: "active",
      path: "/leaderboard"
    },
    {
      title: "Maintain Streak",
      subtitle: "Keep Code Alive",
      label: "Consistency",
      icon: StreakIcon,
      status: "active",
      path: "/practice"
    },
    {
      title: "Online Compiler",
      subtitle: "Instant Execution",
      label: "IDE",
      icon: CompilerIcon,
      status: "active",
      path: "/compiler"
    },
    {
      title: "Competitions",
      subtitle: "Win Rewards",
      label: "Challenges",
      icon: CompetitionsIcon,
      status: "active",
      path: "/events"
    },
    {
      title: "Tech Blog",
      subtitle: "Community Tutorials",
      label: "Insights",
      icon: BlogIcon,
      status: "coming_soon",
      path: "#"
    },
    {
      title: "Profile Card",
      subtitle: "Showcase Stats",
      label: "Identity",
      icon: ProfileIcon,
      status: "active",
      path: "/profile"
    }
  ];

  const handleCardClick = (path: string, status: string) => {
    if (status !== "coming_soon") {
      navigate(path);
    }
  };

  return (
    <div className="w-full py-16 bg-black border-t border-white/5 relative overflow-hidden">
      
      {/* Container constrained to standard max-width.
        The Carousel automatically handles responsive resizing.
      */}
      <div className="container mx-auto px-4 max-w-7xl">
        <Carousel
          opts={{
            align: "start",
            loop: true,
            dragFree: true, // Enables smooth manual scrolling/swiping
          }}
          plugins={[plugin.current]}
          className="w-full"
        >
          <CarouselContent className="-ml-4 pb-4">
            {features.map((feature, index) => (
              /* RESPONSIVE BASIS:
                 - md:basis-1/2  -> Shows 2 cards on Tablets
                 - lg:basis-1/3  -> Shows exactly 3 cards on Desktop
              */
              <CarouselItem key={index} className="pl-4 basis-[85%] md:basis-1/2 lg:basis-1/3">
                <div 
                  onClick={() => handleCardClick(feature.path, feature.status)}
                  className={`
                    group relative 
                    h-[220px] w-full
                    bg-[#0d0d0e] rounded-[24px] border border-[#1f1f21] 
                    flex items-center px-6 
                    cursor-pointer transition-colors duration-300 
                    hover:border-[#333]
                    ${feature.status === 'coming_soon' ? 'opacity-80' : ''}
                  `}
                >
                  {/* Icon Box */}
                  <div className="w-[80px] h-[80px] md:w-[100px] md:h-[100px] shrink-0 flex justify-center items-center relative">
                    <feature.icon />
                  </div>

                  {/* Content */}
                  <div className="ml-5 flex flex-col gap-1 z-10 flex-1 min-w-0">
                    <span className="text-[#d1a5ff] text-xs md:text-sm font-medium capitalize truncate">
                      {feature.label}
                    </span>
                    
                    <h3 className="text-white text-lg md:text-xl font-semibold leading-tight m-0 truncate">
                      {feature.title}
                    </h3>
                    <span className="block text-xs md:text-sm font-normal text-gray-500 truncate">
                      {feature.subtitle}
                    </span>

                    {feature.status === "coming_soon" && (
                      <div className="mt-2 w-fit px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-[#88888e] text-[10px]">
                        Coming Soon
                      </div>
                    )}
                  </div>

                  {/* Action Button - Zoom effect only here */}
                  <div className="absolute bottom-[16px] right-[16px] w-[36px] h-[36px] bg-[#2a2a2c] rounded-full flex justify-center items-center transition-all duration-300 group-hover:bg-white group-hover:scale-110 z-20 shadow-lg">
                    <ArrowUpRight className="w-[18px] h-[18px] text-[#888] stroke-[2.5] transition-colors duration-300 group-hover:text-black" />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </div>
  )
}
