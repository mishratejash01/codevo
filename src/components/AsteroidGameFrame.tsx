import { useState, useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { cn } from "@/lib/utils";

export const AsteroidGameFrame = () => {
  const [inactive, setInactive] = useState(false);
  const lastActivity = useRef(Date.now());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Inactivity Checker
  useEffect(() => {
    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity.current > 40000) { // 40 seconds
        setInactive(true);
      }
    }, 1000);

    const handleActivity = () => {
      lastActivity.current = Date.now();
      setInactive(false);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('scroll', handleActivity);

    return () => {
      clearInterval(checkActivity);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Canvas Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    const asteroids: {x: number, y: number, s: number, dx: number, dy: number}[] = [];

    // Init asteroids
    for(let i=0; i<15; i++) {
      asteroids.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        s: Math.random() * 20 + 10,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5
      });
    }

    const render = () => {
      // Resize logic
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Player
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx - 10, cy + 15);
      ctx.lineTo(cx, cy + 5);
      ctx.lineTo(cx + 10, cy + 15);
      ctx.closePath();
      ctx.stroke();

      // Draw Asteroids
      ctx.strokeStyle = '#444';
      asteroids.forEach(a => {
        a.x += a.dx;
        a.y += a.dy;
        
        // Wrap
        if (a.x < 0) a.x = canvas.width;
        if (a.x > canvas.width) a.x = 0;
        if (a.y < 0) a.y = canvas.height;
        if (a.y > canvas.height) a.y = 0;

        ctx.beginPath();
        ctx.arc(a.x, a.y, a.s, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationFrame = requestAnimationFrame(render);
    };
    render();

    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <div className={cn(
      "relative w-full aspect-video bg-black rounded-3xl border-2 border-white/10 overflow-hidden shadow-2xl transition-all duration-500",
      inactive && "border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-pulse"
    )}>
      {/* Screen Glare */}
      <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-white/5 to-transparent pointer-events-none z-10" />
      
      {/* Game UI Overlay */}
      <div className="absolute top-6 left-8 z-20 opacity-50">
        <div className="w-12 h-12 border-2 border-white/30 rounded-full border-t-white animate-spin" />
      </div>
      <div className="absolute top-6 right-8 z-20 flex gap-2">
        <Heart className="w-5 h-5 text-white fill-white" />
        <Heart className="w-5 h-5 text-white fill-white" />
        <Heart className="w-5 h-5 text-white/30" />
      </div>

      {/* Red Alert Overlay */}
      {inactive && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-red-900/10 backdrop-blur-[1px]">
          <div className="bg-black/80 border border-red-500 px-6 py-3 rounded text-red-500 font-mono animate-bounce">
            SYSTEM_IDLE // WAKE_UP_PILOT
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block" />

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-black/80 backdrop-blur border-t border-white/10 flex items-center justify-between px-6 z-20">
         <div className="flex gap-4 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            <span className="border border-white/20 px-2 py-0.5 rounded">A</span>
            <span className="border border-white/20 px-2 py-0.5 rounded">W</span>
            <span className="border border-white/20 px-2 py-0.5 rounded">D</span>
            <span>Move</span>
         </div>
         
         <div className="text-sm font-mono text-white">Score: 0</div>
         
         <div className="flex items-center gap-2 text-gray-500 text-xs">
           <span>Built by</span>
           <span className="text-white font-bold">Neural AI</span>
         </div>
      </div>
    </div>
  );
};
