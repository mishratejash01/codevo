import { Play } from 'lucide-react';

export const CodevoShowcase = () => {
  return (
    <section className="w-full bg-[#050505] py-24 relative overflow-hidden border-t border-white/5">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="max-w-xl">
            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.1]">
              Code on <span className="font-neuropol text-white">CODéVO</span>
            </h2>
          </div>
          <div className="max-w-sm">
            <p className="text-lg text-gray-400 leading-relaxed">
              Experience the future of coding. Featuring frontier capabilities in real-time execution, secure proctoring, and global competition.
            </p>
          </div>
        </div>

        {/* Screens Container (Black Frame with Mobile Overlay) */}
        <div className="relative w-full h-[450px] md:h-[700px] mt-12">
          
          {/* Desktop IDE View */}
          <div className="absolute left-0 top-0 w-[85%] md:w-[80%] h-[90%] bg-[#0f0f11] rounded-2xl border border-white/10 shadow-2xl overflow-hidden z-10">
             <div className="w-full h-full flex flex-col bg-[#0c0c0e] rounded-xl border border-white/5 overflow-hidden">
                <div className="h-12 border-b border-white/5 flex items-center px-6 justify-between bg-[#151517]">
                   <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                      <div className="w-3 h-3 rounded-full bg-white/10" />
                   </div>
                   <div className="text-sm text-gray-500 font-mono">codevo_ide_v2.tsx</div>
                   <div className="w-20 h-8 bg-white/5 rounded-md" />
                </div>
                <div className="flex-1 p-8 font-mono text-sm md:text-base text-gray-400 space-y-4">
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">1</span>
                      <span className="text-purple-400">import</span> <span className="text-white">React</span> <span className="text-purple-400">from</span> <span className="text-green-400">'react'</span>;
                   </div>
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">2</span>
                      <span className="text-blue-400">const</span> <span className="text-yellow-200">App</span> = () <span className="text-blue-400">=&gt;</span> {'{'}
                   </div>
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">3</span>
                      <span className="pl-8 text-pink-400">return</span> (
                   </div>
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">4</span>
                      <span className="pl-12 text-gray-300">&lt;<span className="text-blue-300">CodevoEnvironment</span> mode=<span className="text-green-300">"pro"</span> /&gt;</span>
                   </div>
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">5</span>
                      <span className="pl-8">);</span>
                   </div>
                   <div className="flex gap-4">
                      <span className="text-gray-600 select-none">6</span>
                      <span>{'}'};</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Mobile Phone Overlay */}
          <div className="absolute right-[5%] bottom-[50px] md:bottom-[-20px] w-[140px] md:w-[300px] aspect-[9/19] bg-black rounded-[2rem] md:rounded-[3rem] border-[6px] md:border-[8px] border-[#1a1a1a] shadow-[0_25px_50px_-12px_rgba(0,0,0,1)] z-30 overflow-hidden transform md:translate-y-10">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-5 md:h-7 bg-black rounded-b-xl z-40" />
             <div className="h-full w-full bg-[#0c0c0e] pt-12 px-3 md:px-5 pb-8 flex flex-col relative">
                <div className="flex justify-between items-center mb-6">
                   <div className="w-8 h-8 rounded-full bg-white/10" />
                   <div className="w-20 h-4 bg-white/10 rounded-full" />
                </div>
                <div className="bg-white/5 rounded-2xl p-4 mb-3 border border-white/5 backdrop-blur-md">
                   <div className="h-2 w-1/2 bg-blue-500/40 rounded mb-2" />
                   <div className="h-2 w-3/4 bg-white/10 rounded mb-1" />
                   <div className="h-2 w-full bg-white/10 rounded" />
                </div>
                <div className="bg-white/10 rounded-2xl p-4 mb-3 border border-blue-500/20 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
                   <div className="relative z-10">
                      <div className="flex justify-between items-center mb-3">
                         <div className="h-3 w-12 bg-green-500/40 rounded" />
                         <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                         <div className="h-2 w-full bg-white/20 rounded" />
                         <div className="h-2 w-5/6 bg-white/20 rounded" />
                      </div>
                   </div>
                </div>
                <div className="mt-auto w-full h-10 md:h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-xs md:text-sm shadow-lg cursor-pointer hover:scale-105 transition-transform">
                   Start Coding
                </div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
             </div>
          </div>
        </div>
      </div>
    </section>
  );
};
