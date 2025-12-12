import { useState, useEffect } from "react";
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

  // 1. Fetch announcements from Supabase
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from("announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (!error && data) {
          // 2. Filter: Show if route is '*' (global) OR matches current path
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

  // 3. Carousel Logic ("Sidegoing" / Rotating)
  useEffect(() => {
    if (announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const currentAnnouncement = announcements[currentIndex];

  return (
    <StickyBanner className="bg-gradient-to-r from-blue-600 to-violet-600 border-b border-white/10 z-50">
      <div className="flex w-full max-w-4xl items-center justify-between gap-4 overflow-hidden">
        
        {/* Animated Message Container */}
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
              
              {/* Desktop Button (Only if link exists) */}
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

        {/* Mobile Button (Always visible if link exists, prevents layout jump) */}
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
