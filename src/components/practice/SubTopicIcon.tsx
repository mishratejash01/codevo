// src/components/practice/SubTopicIcon.tsx
import { cn } from "@/lib/utils";

interface SubTopicIconProps {
  active: boolean;
}

export const SubTopicIcon = ({ active }: SubTopicIconProps) => (
  <div className={cn(
    "relative w-4 h-4 shrink-0 transition-opacity duration-300", 
    active ? "opacity-100" : "opacity-30"
  )}>
    <div className="absolute left-[30%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute left-[65%] top-0 w-[2px] h-full bg-[#f39233] rounded-full" />
    <div className="absolute top-[30%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
    <div className="absolute top-[65%] left-0 w-full h-[2px] bg-[#ffce8c] rounded-full" />
  </div>
);
