import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MaintenancePageProps {
  sectionName?: string;
  message?: string;
  showBackButton?: boolean;
}

const MaintenancePage = ({ 
  message = "We'll be back soon !", 
  showBackButton = true 
}: MaintenancePageProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-white/20">
      
      {/* Exact Clock Design from Image */}
      <svg 
        className="w-[110px] md:w-[150px] h-auto mb-[30px]" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Main Outer Circle */}
        <circle cx="50" cy="50" r="42" stroke="white" strokeWidth="6"/>
        
        {/* 12, 3, 6, 9 Markers */}
        <line x1="50" y1="8" x2="50" y2="16" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="50" y1="84" x2="50" y2="92" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="84" y1="50" x2="92" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <line x1="8" y1="50" x2="16" y2="50" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        
        {/* Clock Hands (Matching 10:08 position) */}
        <path d="M50 50L38 38" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        <path d="M50 50L62 30" stroke="white" strokeWidth="6" strokeLinecap="round"/>
        
        {/* Center Pivot Point */}
        <circle cx="50" cy="50" r="3" fill="white"/>
      </svg>

      <h1 className="text-[1.8rem] md:text-[2.5rem] font-semibold uppercase tracking-[1px] md:tracking-[2px] text-white text-center">
        {message}
      </h1>

      {showBackButton && (
        <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity duration-300">
            <Button 
                onClick={() => navigate('/')}
                variant="ghost" 
                className="text-white hover:text-white hover:bg-white/10 gap-2 font-mono text-[10px] md:text-xs uppercase tracking-widest h-8"
            >
                <ArrowLeft className="w-3 h-3" /> Return Home
            </Button>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
