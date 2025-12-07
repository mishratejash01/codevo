import { Lock } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1a1a1c] border border-red-500/20 select-none shadow-sm">
      <Lock className="w-3 h-3 text-red-500" />
      <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider font-sans">
        Locked
      </span>
    </div>
  );
};
