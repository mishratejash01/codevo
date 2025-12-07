import { LockKeyhole } from 'lucide-react';

export const PremiumLockOverlay = () => {
  return (
    <div className="absolute inset-0 z-50 rounded-xl overflow-hidden cursor-not-allowed group/lock select-none">
      
      {/* Background: Simple dark dimming (No Blur) */}
      <div className="absolute inset-0 bg-black/40 transition-colors duration-300 group-hover/lock:bg-black/50" />

      {/* Lock Icon: Top-Right, Red, No Circle/Background */}
      <div className="absolute top-5 right-5 z-10 transition-transform duration-300 group-hover/lock:scale-110">
        <LockKeyhole className="w-5 h-5 text-red-500/90 drop-shadow-md" />
      </div>

      {/* Subtle Red Border on Hover */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover/lock:border-red-500/10 transition-colors duration-300 pointer-events-none" />
      
    </div>
  );
};
