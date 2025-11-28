import { cn } from "@/lib/utils";

interface ScoreDisplayProps {
  score: number;
  maxScore: number;
}

export const ScoreDisplay = ({ score, maxScore }: ScoreDisplayProps) => {
  // SAFETY CHECK: Prevent division by zero or invalid numbers
  const validMaxScore = maxScore > 0 ? maxScore : 100;
  const validScore = isNaN(score) ? 0 : score;
  
  const percentage = Math.min(100, Math.max(0, (validScore / validMaxScore) * 100));
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-40 h-40 group">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-green-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        <svg className="w-full h-full -rotate-90 relative z-10">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-muted/20"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-green-500 transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={isNaN(strokeDashoffset) ? 0 : strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className="text-4xl font-bold text-green-500 animate-in zoom-in duration-500">
            {validScore.toFixed(0)}
          </span>
          <div className="flex flex-col items-center">
            <span className="text-xs text-muted-foreground uppercase tracking-widest mt-1">out of</span>
            <span className="text-lg font-semibold text-foreground/80">{validMaxScore}</span>
          </div>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground border border-white/10 px-3 py-1 rounded-full bg-white/5">
        Assignment Score
      </span>
    </div>
  );
};
