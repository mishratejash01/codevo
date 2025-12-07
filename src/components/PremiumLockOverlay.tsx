import { LockKeyhole, ShieldAlert, Binary } from 'lucide-react';
import { cn } from '@/lib/utils';

export const PremiumLockOverlay = () => {
  return (
    <div className="absolute inset-0 z-50 overflow-hidden rounded-xl cursor-not-allowed group/lock select-none">
      
      {/* --- BACKGROUND LAYERS --- */}
      
      {/* 1. Deep Space Glass Background (Heavy Blur) */}
      <div className="absolute inset-0 bg-[#050505]/60 backdrop-blur-[8px] transition-all duration-700 group-hover/lock:bg-[#050505]/80 group-hover/lock:backdrop-blur-[12px]" />

      {/* 2. Cinematic Noise Texture */}
      <div className="absolute inset-0 opacity-[0.15] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay pointer-events-none" />

      {/* 3. Security Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

      {/* 4. Moving Scanline (Red laser effect) */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/10 to-transparent h-[20%] w-full animate-scanline pointer-events-none opacity-0 group-hover/lock:opacity-100 transition-opacity duration-500" />

      {/* --- CENTER CONTENT --- */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-10">
        
        {/* The "Vault" Circle */}
        <div className="relative mb-8 group-hover/lock:scale-105 transition-transform duration-500 ease-out">
          
          {/* Rotating Rings */}
          <div className="absolute -inset-6 rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]" />
          <div className="absolute -inset-6 rounded-full border border-white/5 border-t-transparent border-l-transparent animate-[spin_3s_linear_infinite_reverse] opacity-50" />
          
          {/* Glowing Red Pulse Ring (Active on Hover) */}
          <div className="absolute -inset-2 rounded-full border border-red-500/30 opacity-0 scale-75 group-hover/lock:opacity-100 group-hover/lock:scale-100 transition-all duration-500 blur-sm" />

          {/* Main Glass Icon Container */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-black border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] flex items-center justify-center overflow-hidden group-hover/lock:border-red-500/50 transition-colors duration-500">
            
            {/* Internal "Circuit" Reflection */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            
            <LockKeyhole className="w-8 h-8 text-white/40 group-hover/lock:text-red-500 transition-all duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover/lock:drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
          </div>
          
          {/* Floating Status Indicator Pill */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-black border border-red-500/30 rounded-full flex items-center gap-1.5 shadow-lg z-20">
             <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
             <span className="text-[9px] font-mono text-red-400 font-bold tracking-wider">LOCKED</span>
          </div>
        </div>

        {/* Text Stack */}
        <div className="space-y-4">
          <div className="overflow-hidden">
             <h3 className="text-2xl font-bold font-neuropol text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 tracking-[0.15em] translate-y-2 group-hover/lock:translate-y-0 transition-transform duration-500 drop-shadow-md">
               RESTRICTED
             </h3>
          </div>
          
          {/* Tech Specs / Details */}
          <div className="flex flex-col gap-1 items-center opacity-60 group-hover/lock:opacity-100 transition-opacity duration-500">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-[0.2em]">
              <ShieldAlert className="w-3 h-3" />
              <span>Secure::0x84</span>
            </div>
            {/* Divider Line */}
            <div className="h-px w-16 bg-gradient-to-r from-transparent via-white/20 to-transparent my-1" />
            <div className="flex items-center gap-2 text-[9px] text-red-400/80 font-mono">
              <Binary className="w-3 h-3" />
              <span>ENCRYPTION ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- DECORATIVE CORNERS (High-Tech Feel) --- */}
      {/* Top Left */}
      <svg className="absolute top-3 left-3 w-6 h-6 text-white/10 group-hover/lock:text-red-500/40 transition-colors duration-500 pointer-events-none" viewBox="0 0 24 24">
         <path fill="currentColor" d="M2 2v7h2V4h5V2H2z" />
      </svg>
      {/* Top Right */}
      <svg className="absolute top-3 right-3 w-6 h-6 text-white/10 group-hover/lock:text-red-500/40 transition-colors duration-500 rotate-90 pointer-events-none" viewBox="0 0 24 24">
         <path fill="currentColor" d="M2 2v7h2V4h5V2H2z" />
      </svg>
      {/* Bottom Left */}
      <svg className="absolute bottom-3 left-3 w-6 h-6 text-white/10 group-hover/lock:text-red-500/40 transition-colors duration-500 -rotate-90 pointer-events-none" viewBox="0 0 24 24">
         <path fill="currentColor" d="M2 2v7h2V4h5V2H2z" />
      </svg>
      {/* Bottom Right */}
      <svg className="absolute bottom-3 right-3 w-6 h-6 text-white/10 group-hover/lock:text-red-500/40 transition-colors duration-500 rotate-180 pointer-events-none" viewBox="0 0 24 24">
         <path fill="currentColor" d="M2 2v7h2V4h5V2H2z" />
      </svg>

      {/* Border Glow */}
      <div className="absolute inset-0 border border-white/5 rounded-xl group-hover/lock:border-red-500/20 transition-colors duration-500" />
    </div>
  );
};
