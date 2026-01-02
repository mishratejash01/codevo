import { ReactNode } from 'react';
import { useSectionAvailability } from '@/hooks/useWebsiteAvailability';
import MaintenancePage from './MaintenancePage';
import LoadingSpinner from '@/components/ui/snow-ball-loading-spinner';

interface AvailabilityGuardProps {
  sectionKey: string;
  children: ReactNode;
}

const AvailabilityGuard = ({ sectionKey, children }: AvailabilityGuardProps) => {
  const { isAvailable, sectionName, message, isLoading } = useSectionAvailability(sectionKey);

  // Show the Snow Ball Spinner while loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="scale-75 transform">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <MaintenancePage 
        sectionName={sectionName} 
        message={message || undefined}
        showBackButton={sectionKey !== 'main_website'}
      />
    );
  }

  return <>{children}</>;
};

export default AvailabilityGuard;
