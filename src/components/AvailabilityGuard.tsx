import { ReactNode } from 'react';
import { useSectionAvailability } from '@/hooks/useWebsiteAvailability';
import MaintenancePage from './MaintenancePage';

interface AvailabilityGuardProps {
  sectionKey: string;
  children: ReactNode;
}

const AvailabilityGuard = ({ sectionKey, children }: AvailabilityGuardProps) => {
  const { isAvailable, sectionName, message, isLoading } = useSectionAvailability(sectionKey);

  // Show nothing while loading to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
