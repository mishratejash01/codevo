import { Lock } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="flex items-center gap-1.5 select-none animate-in fade-in zoom-in duration-300">
      <Lock className="w-3.5 h-3.5 text-red-500" />
      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest font-mono">
        LOCKED
      </span>
    </div>
  );
};
