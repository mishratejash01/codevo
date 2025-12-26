import { cn } from "@/lib/utils";

interface FolderStickerProps {
  active: boolean;
  className?: string;
}

export const FolderSticker = ({ active, className }: FolderStickerProps) => {
  return (
    <div className={cn(
      "relative transition-all duration-300 shrink-0", 
      active ? "scale-110 opacity-100" : "opacity-40 hover:opacity-70",
      className
    )}>
      {/* Sticker Border: 5px layered shadows for the thick "Premium" die-cut edge */}
      <div className="filter 
        drop-shadow-[5px_0_0_#e0e0e0] 
        drop-shadow-[-5px_0_0_#e0e0e0] 
        drop-shadow-[0_5px_0_#e0e0e0] 
        drop-shadow-[0_-5px_0_#e0e0e0]
        drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)]">
        
        <div className="relative h-[100px] w-[140px]">
          {/* Folder Tab (The Back Section) */}
          <div 
            className="absolute -top-[22px] left-0 h-[28px] w-[85px] 
                       bg-[#f39233] border-[4px] border-b-0 border-[#2d1d1a] 
                       rounded-t-[12px]
                       [clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]"
          />

          {/* Folder Body (The Front Section) */}
          <div className="absolute inset-0 overflow-hidden 
                          rounded-tr-[14px] rounded-br-[14px] rounded-bl-[14px] rounded-tl-0
                          border-[4px] border-[#2d1d1a] 
                          bg-[linear-gradient(160deg,#ffce8c_0%,#f7b65d_100%)]">
            
            {/* Interior Section: Orange horizontal bar */}
            <div className="absolute top-0 left-0 h-[20px] w-full border-b-[4px] border-[#2d1d1a] bg-[#f39233]" />
            
            {/* Subtle Inner Highlight for Premium Feel */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_3px_3px_0px_rgba(255,255,255,0.3)]" />
          </div>
        </div>
      </div>
    </div>
  );
};
