interface ScoreDisplayProps {
  score: number;
  maxScore: number;
}

export const ScoreDisplay = ({ score, maxScore }: ScoreDisplayProps) => {
  const percentage = (score / maxScore) * 100;
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-muted"
            strokeWidth="12"
            fill="none"
          />
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="stroke-success transition-all duration-1000"
            strokeWidth="12"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-success">{score}</span>
          <span className="text-sm text-muted-foreground">out of</span>
          <span className="text-2xl font-semibold text-muted-foreground">{maxScore}</span>
        </div>
      </div>
      <span className="text-sm font-medium text-muted-foreground">Score</span>
    </div>
  );
};
