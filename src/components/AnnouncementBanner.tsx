import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StickyBanner } from "@/components/ui/sticky-banner";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

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

  // 2. Sync Height to CSS Variable (This shifts the header)
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
    }, 10000); // Increased duration for reading scrolling text
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <>
      {/* CSS for Marquee Animation */}
      <style>{`
        @keyframes marquee-scroll {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee-scroll {
          display: inline-block;
          white-space: nowrap;
          animation: marquee-scroll 15s linear infinite;
        }
        /* Pause on hover for readability */
        .animate-marquee-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      <StickyBanner 
        ref={bannerRef}
        onClose={() => setIsVisible(false)}
        // UPDATED: Gradient Top-to-Bottom (Violet -> Black)
        className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-b from-violet-600 to-black border-b border-white/10 shadow-lg transition-all duration-300"
      >
        <div className="flex w-full max-w-4xl items-center justify-between gap-4">
          
          {/* Animated Message Container */}
          <div className="flex-1 relative flex items-center overflow-hidden h-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentAnnouncement.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full relative"
              >
                {/* Marquee Text */}
                <div className="w-full h-full absolute inset-0 flex items-center">
                  <span className="font-medium text-sm md:text-base text-white drop-shadow-md animate-marquee-scroll">
                    {currentAnnouncement.message} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {currentAnnouncement.message}
                  </span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Buttons (Desktop & Mobile) */}
          {currentAnnouncement.link && (
            <div className="shrink-0 z-10 bg-inherit pl-2">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 px-3 text-[10px] md:text-xs font-bold bg-white text-violet-900 hover:bg-violet-50 shadow-sm whitespace-nowrap"
                asChild
              >
                <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
                  {currentAnnouncement.button_text || "Check it out"}
                </a>
              </Button>
            </div>
          )}
        </div>
      </StickyBanner>
    </>
  );
};
