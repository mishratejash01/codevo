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
      // Calculate height only if visible
      const height = isVisible && announcements.length > 0 && bannerRef.current 
        ? bannerRef.current.offsetHeight 
        : 0;
      
      // Set the variable for Header.tsx to use
      document.documentElement.style.setProperty('--banner-height', `${height}px`);
    };

    // Update initially and on resize
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
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0 || !isVisible) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <StickyBanner 
      ref={bannerRef}
      onClose={() => setIsVisible(false)}
      // FIXED POSITION + ORIGINAL GRADIENT COLOR
      className="fixed top-0 left-0 right-0 z-[60] bg-gradient-to-b from-blue-500 to-blue-600 border-b border-white/10 shadow-lg"
    >
      <div className="flex w-full max-w-4xl items-center justify-between gap-4 overflow-hidden">
        
        {/* Animated Message */}
        <div className="flex-1 overflow-hidden relative h-8 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentAnnouncement.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute w-full flex items-center justify-center md:justify-start gap-3"
            >
              <span className="font-medium text-sm md:text-base text-white drop-shadow-md text-center md:text-left truncate">
                {currentAnnouncement.message}
              </span>
              
              {currentAnnouncement.link && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 px-3 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 ml-2 whitespace-nowrap hidden md:inline-flex"
                  asChild
                >
                  <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
                    {currentAnnouncement.button_text || "Check it out"}
                  </a>
                </Button>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile Button */}
        {currentAnnouncement.link && (
          <Button
            size="sm"
            variant="secondary"
            className="h-7 px-3 text-xs font-bold bg-white text-blue-600 hover:bg-blue-50 md:hidden whitespace-nowrap shrink-0"
            asChild
          >
            <a href={currentAnnouncement.link} target="_blank" rel="noreferrer">
              {currentAnnouncement.button_text || "View"}
            </a>
          </Button>
        )}
      </div>
    </StickyBanner>
  );
};
