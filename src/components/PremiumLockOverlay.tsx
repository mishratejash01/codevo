import { Lock } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="animate-in fade-in zoom-in duration-300 select-none" title="Locked">
      <Lock className="w-4 h-4 text-red-500" />
    </div>
  );
};
