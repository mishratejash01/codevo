// src/components/practice/FolderSticker.tsx
import { cn } from "@/lib/utils";

interface FolderStickerProps {
  active: boolean;
  className?: string;
}

export const FolderSticker = ({ active, className }: FolderStickerProps) => {
  return (
    <div className={cn(
      "relative transition-all duration-300 shrink-0", 
      active ? "scale-105 opacity-100" : "opacity-50",
      className
    )}>
      <div className="filter 
        drop-shadow-[1px_0_0_#e0e0e0] 
        drop-shadow-[-1px_0_0_#e0e0e0] 
        drop-shadow-[0_1px_0_#e0e0e0] 
        drop-shadow-[0_-1px_0_#e0e0e0]
        drop-shadow-[0_0_1px_rgba(255,255,255,0.2)]">
        
        <div className="relative h-[16px] w-[22px]">
          {/* Folder Tab */}
          <div 
            className="absolute -top-[3px] left-0 h-[5px] w-[12px] 
                       bg-[#f39233] border-[1px] border-b-0 border-[#2d1d1a] 
                       rounded-t-[2px] 
                       [clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]"
          />

          {/* Folder Body */}
          <div className="absolute inset-0 overflow-hidden rounded-tr-[2px] rounded-bl-[2px] rounded-br-[2px] 
                          border-[1px] border-[#2d1d1a] 
                          bg-gradient-to-br from-[#ffce8c] to-[#f7b65d]">
            {/* Interior section */}
            <div className="absolute top-0 left-0 h-[4px] w-full border-b-[1px] border-[#2d1d1a] bg-[#f39233]" />
          </div>
        </div>
      </div>
    </div>
  );
};
