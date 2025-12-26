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
      {/* The silhouette outline created using multiple drop-shadows 
        to mimic the off-white sticker edge from your design.
      */}
      <div className="filter 
        drop-shadow-[2px_0_0_#e0e0e0] 
        drop-shadow-[-2px_0_0_#e0e0e0] 
        drop-shadow-[0_2px_0_#e0e0e0] 
        drop-shadow-[0_-2px_0_#e0e0e0]
        drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]">
        
        <div className="relative h-[18px] w-[26px]">
          {/* Folder Tab:
             Matches: background #f39233, border #2d1d1a, and specific clip-path slant.
          */}
          <div 
            className="absolute -top-[4px] left-0 h-[6px] w-[16px] 
                       bg-[#f39233] border-[1px] border-b-0 border-[#2d1d1a] 
                       rounded-t-[3px]
                       [clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]"
          />

          {/* Folder Body:
             Matches: linear-gradient(160deg, #ffce8c 0%, #f7b65d 100%)
             Radius: 0 (top-left) to align with tab, others rounded.
          */}
          <div className="absolute inset-0 overflow-hidden 
                          rounded-tr-[3px] rounded-br-[3px] rounded-bl-[3px] 
                          border-[1px] border-[#2d1d1a] 
                          bg-[linear-gradient(160deg,#ffce8c_0%,#f7b65d_100%)]">
            
            {/* Interior section: matching the 20px height ratio from your HTML */}
            <div className="absolute top-0 left-0 h-[4px] w-full border-b-[1px] border-[#2d1d1a] bg-[#f39233]" />
          </div>
        </div>
      </div>
    </div>
  );
};
