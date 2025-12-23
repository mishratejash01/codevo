import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface AvailabilityRecord {
  section_key: string;
  section_name: string;
  is_available: boolean;
  message: string | null;
}

export const useWebsiteAvailability = () => {
  return useQuery({
    queryKey: ['website-availability'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('website_availability')
        .select('section_key, section_name, is_available, message');
      
      if (error) throw error;
      
      // Convert to a map for easy lookup
      const availabilityMap: Record<string, AvailabilityRecord> = {};
      data?.forEach((record) => {
        availabilityMap[record.section_key] = record as AvailabilityRecord;
      });
      
      return availabilityMap;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    refetchOnWindowFocus: true,
  });
};

export const useSectionAvailability = (sectionKey: string) => {
  const { data: availability, isLoading } = useWebsiteAvailability();
  
  const section = availability?.[sectionKey];
  const mainWebsite = availability?.['main_website'];
  
  // If main website is unavailable, everything is unavailable
  if (mainWebsite && !mainWebsite.is_available) {
    return {
      isAvailable: false,
      sectionName: mainWebsite.section_name,
      message: mainWebsite.message,
      isLoading,
      isMaintenanceMode: true,
    };
  }
  
  return {
    isAvailable: section?.is_available ?? true,
    sectionName: section?.section_name ?? sectionKey,
    message: section?.message ?? 'We are building something interesting for you!',
    isLoading,
    isMaintenanceMode: false,
  };
};
