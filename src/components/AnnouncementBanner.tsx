import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

// Define the shape of your announcement data
type Announcement = {
  id: string;
  message: string;
  link: string | null;
  button_text: string | null;
  page_route: string;
  is_active: boolean | null;
};

export const AnnouncementBanner = () => {
  const location = useLocation();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  // 1. Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          const filtered = data.filter(
            (item) =>
              item.page_route === "*" || item.page_route === location.pathname
          );
          setAnnouncements(filtered as Announcement[]);
        }
      } catch (err) {
        console.error("Failed to fetch announcements", err);
      }
    };

    fetchAnnouncements();
  }, [location.pathname]);

  // 2. Sync Height to CSS Variable
  useEffect(() => {
    const updateHeight = () => {
      const height = isVisible && announcements.length > 0 && bannerRef.current 
        ? bannerRef.current.offsetHeight 
        : 0;
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    };

    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (bannerRef.current) resizeObserver.observe(bannerRef.current);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.setProperty('--banner-height', '0px');
    };
  }, [isVisible, announcements, currentIndex]);

  // 3. Carousel Logic
  useEffect(() => {
    if (announcements.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 45000); 
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      <style>{`
        @keyframes marquee-infinite {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-infinite {
          display: flex;
          width: fit-content;
          animation: marquee-infinite 60s linear infinite; /* Slow, smooth speed */
        }
        .animate-marquee-infinite:hover {
          animation-play-state: paused;
        }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent);
        }
      `}</style>

      <StickyBanner 
        ref={bannerRef}
        onClose={() => setIsVisible(false)}
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-300",
          "border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-md",
          // Premium Color: Deep Black/Violet blend
          "bg-[#030305]/80 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-[#030305]/90 to-black"
        )}
      >
        {/* Reduced padding (py-1.5) for smaller height */}
        <div className="flex w-full items-center justify-between gap-6 px-4 py-1.5 h-8">
          
          {/* SCROLLING TEXT AREA (Flexible width, but contained) */}
          <div className="flex-1 overflow-hidden relative h-full flex items-center mask-fade-edges">
             <div className="animate-marquee-infinite">
                {/* We repeat the text to create a seamless infinite loop that starts VISIBLE immediately */}
                {[0, 1, 2, 3].map((i) => (
                  <span 
                    key={i} 
                    className="mx-8 font-mono text-xs md:text-sm font-medium text-violet-100/90 tracking-[0.15em] uppercase whitespace-nowrap flex items-center"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mr-3 animate-pulse" />
                    {currentAnnouncement.message}
                  </span>
                ))}
             </div>
          </div>

          {/* FIXED BUTTON AREA (Pinned to right, never moves) */}
          {currentAnnouncement.link && (
            <div className="shrink-0 z-20 flex items-center">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-3 text-[10px] font-bold uppercase tracking-wider rounded border border-white/10 bg-white/5 hover:bg-violet-500/20 text-violet-200 hover:text-white transition-all group"
                asChild
              >
                <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
                  {currentAnnouncement.button_text || "View"}
                  <ChevronRight className="w-3 h-3 ml-1 opacity-50 group-hover:opacity-100 transition-opacity" />
                </a>
              </Button>
            </div>
          )}
        </div>
      </StickyBanner>
    </>
  );
};
