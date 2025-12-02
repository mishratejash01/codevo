import { useState, useEffect, useRef } from 'react';
import { Heart, Trophy, MousePointer2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";

export const AsteroidGameFrame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  
  // Inactivity state
  const [inactive, setInactive] = useState(false);
  const lastActivity = useRef(Date.now());

  // Game State
  const gameState = useRef({
    player: { x: 0, y: 0, angle: 0 },
    bullets: [] as { x: number; y: number; dx: number; dy: number; life: number }[],
    asteroids: [] as { x: number; y: number; dx: number; dy: number; size: number; color: string }[],
    stars: [] as { x: number; y: number; s: number; alpha: number }[],
    keys: { a: false, d: false },
    particles: [] as { x: number; y: number; dx: number; dy: number; life: number; color: string }[]
  });

  // Helper: Fire Bullet
  const fireBullet = () => {
    const state = gameState.current;
    state.bullets.push({
      x: state.player.x + Math.sin(state.player.angle) * 15,
      y: state.player.y - Math.cos(state.player.angle) * 15,
      dx: Math.sin(state.player.angle) * 8, 
      dy: -Math.cos(state.player.angle) * 8,
      life: 80
    });
  };

  // Input Handling
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') gameState.current.keys.a = true;
      if (key === 'd' || key === 'arrowright') gameState.current.keys.d = true;
      if (e.code === 'Space') {
        e.preventDefault();
        fireBullet();
      }
      lastActivity.current = Date.now();
      setInactive(false);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'a' || key === 'arrowleft') gameState.current.keys.a = false;
      if (key === 'd' || key === 'arrowright') gameState.current.keys.d = false;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (canvasRef.current && canvasRef.current.contains(e.target as Node)) {
        fireBullet();
        lastActivity.current = Date.now();
        setInactive(false);
      }
    };

    const handleMouseMove = () => {
      if (inactive) {
        lastActivity.current = Date.now();
        setInactive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [inactive, gameStarted]);

  // Game Loop
  useEffect(() => {
    if (!gameStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    // --- SPAWN HELPERS ---
    const spawnAsteroid = (canvasW: number, canvasH: number, size?: number, x?: number, y?: number) => {
      let startX = x, startY = y;
      
      if (x === undefined || y === undefined) {
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
          case 0: startX = Math.random() * canvasW; startY = -40; break;
          case 1: startX = canvasW + 40; startY = Math.random() * canvasH; break;
          case 2: startX = Math.random() * canvasW; startY = canvasH + 40; break;
          case 3: startX = -40; startY = Math.random() * canvasH; break;
        }
      }

      // MONOCHROME AESTHETIC
      const colors = ['#ffffff', '#e5e5e5', '#d4d4d4', '#a3a3a3']; 
      const color = colors[Math.floor(Math.random() * colors.length)];

      return {
        x: startX || 0,
        y: startY || 0,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        size: size || Math.random() * 15 + 25,
        color
      };
    };

    // Only init stars if empty (prevent re-init on restarts if we wanted that logic)
    if (gameState.current.stars.length === 0) {
      for (let i = 0; i < 50; i++) {
        gameState.current.stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          s: Math.random() * 1.5,
          alpha: Math.random()
        });
      }
    }

    // Init Asteroids
    if (gameState.current.asteroids.length === 0) {
      for (let i = 0; i < 5; i++) {
        gameState.current.asteroids.push(spawnAsteroid(canvas.width, canvas.height));
      }
    }

    const update = () => {
      if (!canvas) return;
      
      // Resize
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const state = gameState.current;

      // --- RENDER BACKGROUND (Premium Faded B&W) ---
      const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, width);
      gradient.addColorStop(0, '#1a1a1a');  
      gradient.addColorStop(1, '#000000'); 
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw Stars
      ctx.fillStyle = '#ffffff';
      state.stars.forEach(star => {
        ctx.globalAlpha = star.alpha * 0.2 + 0.05; 
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.s, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // --- UPDATE STATE ---

      // 1. Player
      state.player.x = width / 2;
      state.player.y = height / 2;
      if (state.keys.a) state.player.angle -= 0.08;
      if (state.keys.d) state.player.angle += 0.08;

      // 2. Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.dx;
        b.y += b.dy;
        b.life--;
        
        if (b.life <= 0 || b.x < -50 || b.x > width + 50 || b.y < -50 || b.y > height + 50) {
          state.bullets.splice(i, 1);
        }
      }

      // 3. Asteroids
      for (let i = state.asteroids.length - 1; i >= 0; i--) {
        const a = state.asteroids[i];
        a.x += a.dx;
        a.y += a.dy;

        // Wrap
        if (a.x < -a.size - 10) a.x = width + a.size;
        if (a.x > width + a.size + 10) a.x = -a.size;
        if (a.y < -a.size - 10) a.y = height + a.size;
        if (a.y > height + a.size + 10) a.y = -a.size;

        // Collision Logic
        for (let j = state.bullets.length - 1; j >= 0; j--) {
          const b = state.bullets[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          if (dist < a.size + 5) { 
            // Explosion particles
            for (let k = 0; k < 8; k++) {
               state.particles.push({
                 x: a.x, y: a.y,
                 dx: (Math.random() - 0.5) * 5,
                 dy: (Math.random() - 0.5) * 5,
                 life: 25,
                 color: '#ffffff'
               });
            }
            
            state.bullets.splice(j, 1);
            state.asteroids.splice(i, 1);
            setScore(s => s + (a.size > 20 ? 50 : 100));
            
            // Split Logic
            if (a.size > 20) {
              state.asteroids.push(spawnAsteroid(width, height, a.size / 1.6, a.x, a.y));
              state.asteroids.push(spawnAsteroid(width, height, a.size / 1.6, a.x, a.y));
            }

            // Respawn Check
            if (state.asteroids.length < 3) {
               setTimeout(() => {
                 if (gameState.current.asteroids.length < 5) {
                    gameState.current.asteroids.push(spawnAsteroid(width, height));
                 }
               }, 500);
            }
            break; 
          }
        }
      }

      // 4. Particles
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.dx;
        p.y += p.dy;
        p.life--;
        if (p.life <= 0) state.particles.splice(i, 1);
      }

      // --- DRAWING ---

      // Particles
      state.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 25;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Asteroids
      state.asteroids.forEach(a => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = 'rgba(255,255,255,0.1)';
        
        ctx.strokeStyle = 'rgba(255,255,255,0.9)';
        ctx.lineWidth = 1.5;
        
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255,255,255,0.02)'; 
        ctx.fill();
        
        ctx.shadowBlur = 0;
      });

      // Bullets
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#ffffff';
      ctx.fillStyle = '#ffffff';
      state.bullets.forEach(b => {
        ctx.beginPath();
        ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Player
      ctx.save();
      ctx.translate(state.player.x, state.player.y);
      ctx.rotate(state.player.angle);
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(255,255,255,0.3)';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fillStyle = '#000';
      
      ctx.beginPath();
      ctx.moveTo(0, -12);
      ctx.lineTo(8, 12);
      ctx.lineTo(0, 8);
      ctx.lineTo(-8, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [gameStarted]);

  return (
    <div className={cn(
      "relative w-full h-[400px] md:h-[600px] bg-[#050505] rounded-[2rem] border-[12px] border-white/5 overflow-hidden shadow-2xl group select-none",
      inactive && gameStarted && "border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.2)]"
    )}>
      
      {/* Start Game Overlay */}
      {!gameStarted && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
            <h3 className="text-3xl md:text-4xl font-bold text-white font-neuropol tracking-wide">
              ASTEROID DEFENSE
            </h3>
            <p className="text-gray-400 text-sm max-w-md mx-auto px-4">
              Defend your station from incoming debris. <br/> Use <span className="text-white border border-white/20 px-1 rounded">A</span> <span className="text-white border border-white/20 px-1 rounded">D</span> to rotate and <span className="text-white border border-white/20 px-1 rounded">SPACE</span> to fire.
            </p>
            <Button 
              onClick={() => setGameStarted(true)}
              className="bg-white text-black hover:bg-white/90 font-bold px-8 py-6 rounded-full text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:scale-105"
            >
              <Play className="w-5 h-5 mr-2 fill-current" />
              START MISSION
            </Button>
          </div>
        </div>
      )}

      {/* Faded Effect Mask at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#000000] via-[#000000cc] to-transparent z-20 pointer-events-none" />

      {/* HUD (Only visible when started) */}
      <div className={cn("transition-opacity duration-500", gameStarted ? "opacity-100" : "opacity-0")}>
        <div className="absolute top-8 left-10 z-30 flex items-center gap-4 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
            <Heart className="w-4 h-4 text-white fill-white" />
            <span className="text-xs font-mono text-white font-bold">100%</span>
          </div>
        </div>
        
        <div className="absolute top-8 right-10 z-30 pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 backdrop-blur-md rounded-full border border-white/5">
            <Trophy className="w-4 h-4 text-white" />
            <span className="text-xs font-mono text-white font-bold">{score.toString().padStart(6, '0')}</span>
          </div>
        </div>
      </div>

      {/* Inactivity Warning */}
      {inactive && gameStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-40 bg-red-950/20 backdrop-blur-[1px] pointer-events-none">
          <div className="bg-black/90 border border-red-500 px-8 py-4 rounded text-red-500 font-mono text-lg animate-bounce shadow-[0_0_30px_rgba(220,38,38,0.5)]">
            SYSTEM_IDLE // WAKE_UP_PILOT
          </div>
        </div>
      )}

      {/* Canvas */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block cursor-crosshair" 
      />

      {/* Bottom Bar (Controls) */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-between px-8 z-30 pointer-events-none opacity-80">
         <div className="flex items-center gap-6">
            <div className="flex gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest items-center">
               <div className="flex gap-1">
                 <span className="border border-white/10 bg-white/5 px-2 py-1 rounded text-gray-300">W</span>
                 <span className="border border-white/10 bg-white/5 px-2 py-1 rounded text-gray-300">A</span>
                 <span className="border border-white/10 bg-white/5 px-2 py-1 rounded text-gray-300">D</span>
               </div>
               <span className="hidden sm:inline">Move</span>
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest items-center">
               <div className="flex items-center gap-1 border border-white/10 bg-white/5 px-3 py-1 rounded text-gray-300">
                 <MousePointer2 className="w-3 h-3" /> <span>Click</span>
               </div>
               <span className="hidden sm:inline">/ Space to Fire</span>
            </div>
         </div>
         
         <div className="flex items-center gap-2 text-gray-600 text-xs">
           <span className="hidden sm:inline">Built by</span>
           <span className="text-gray-300 font-bold">Neural AI</span>
         </div>
      </div>
    </div>
  );
};
