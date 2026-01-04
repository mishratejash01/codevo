import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { 
  Globe, Shield, Users, ArrowRight, Building2, 
  Zap, Server, Cpu, Heart, Rocket, Lock 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '@/components/SEO';

const About = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    navigate('/');
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/30 font-sans overflow-x-hidden">
      <SEO 
        title="About Us" 
        description="We are forging the future of code. Learn about Codevo's mission to revolutionize developer education and practice."
        url="https://codevo.co.in/about"
      />
      <Header session={session} onLogout={handleLogout} />

      <main className="pt-24 pb-0">
        <section className="relative px-6 md:px-12 lg:px-24 py-12 md:py-20 max-w-7xl mx-auto">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
          
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="relative z-10"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-medium tracking-wider mb-6">
              <Globe className="w-3 h-3" />
              <span>GLOBAL HEADQUARTERS: USA</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Forging the <br />
              <span className="font-neuropol text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">
                Future of Code
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl leading-relaxed">
              CodeVo is an advanced development ecosystem built for the modern engineer. 
              Born in the United States, we are redefining how the world learns, compiles, and ships software.
            </p>
          </motion.div>
        </section>

        <section className="border-y border-white/5 bg-[#0c0c0e]">
          <div className="max-w-7xl mx-auto px-6 md:px-12 py-16 grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Building2, color: "text-primary", title: "Based in USA", desc: "Headquartered in the epicenter of tech innovation." },
              { icon: Users, color: "text-green-500", title: "100K+ Developers", desc: "A thriving community of engineers building the next generation." },
              { icon: Shield, color: "text-red-500", title: "Enterprise Grade", desc: "Secure, scalable infrastructure trusted by top institutions." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }} 
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col gap-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 md:px-12 py-24">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-4xl font-bold font-neuropol">Our Mission</h2>
              <div className="space-y-6 text-gray-300 leading-relaxed">
                <p>
                  At CodeVo, we believe that coding is the closest thing we have to a superpower. 
                  However, the tools used to teach and practice this skill have remained stagnant for decades.
                </p>
                <p>
                  We founded CodeVo in the US with a singular obsession: <b>latency</b>. We wanted to remove 
                  the friction between thought and execution. Whether you are compiling C++ or training a 
                  Python model, our infrastructure ensures that your browser feels like a local machine.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl -z-10 rounded-full" />
              <div className="relative aspect-square rounded-3xl overflow-hidden border border-white/10 bg-[#0c0c0e] shadow-2xl">
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
                 <div className="absolute inset-0 flex items-center justify-center opacity-40">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2c/US_map_blank.svg" alt="USA Map" className="w-3/4 h-3/4 object-contain invert opacity-50 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                 </div>
                 <div className="absolute top-1/3 left-1/4 flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping absolute" />
                    <div className="w-3 h-3 bg-blue-500 rounded-full relative z-10 border border-black shadow-[0_0_15px_#3b82f6]" />
                    <div className="mt-2 px-3 py-1 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-mono text-white">US-EAST-1</div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#050505] py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold font-neuropol mb-4">Core Principles</h2>
              <p className="text-gray-400 max-w-2xl mx-auto">The fundamental beliefs that drive our engineering culture.</p>
            </div>

            <motion.div 
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {[
                { icon: Zap, title: "Zero Latency", desc: "We optimize for milliseconds. Speed isn't a feature; it's a requirement." },
                { icon: Lock, title: "Security First", desc: "Sandboxed execution environments ensuring code safety at every level." },
                { icon: Heart, title: "Dev Centric", desc: "Built by developers, for developers. No fluff, just tools that work." },
                { icon: Rocket, title: "Future Proof", desc: "Constantly evolving stack using the latest in WebAssembly and Cloud tech." },
              ].map((val, i) => (
                <motion.div 
                  key={i}
                  variants={fadeInUp}
                  className="bg-[#0c0c0e] border border-white/5 p-6 rounded-2xl hover:border-white/10 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-white/10 transition-colors">
                    <val.icon className="w-5 h-5 text-gray-300 group-hover:text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{val.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{val.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="py-24 max-w-7xl mx-auto px-6 md:px-12 relative overflow-hidden">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />
           
           <div className="relative z-10 bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 md:p-12 overflow-hidden">
             <div className="grid md:grid-cols-2 gap-12 items-center">
               <div>
                 <div className="flex items-center gap-2 mb-6 text-purple-400 font-mono text-sm uppercase tracking-widest">
                   <Server className="w-4 h-4" /> Architecture
                 </div>
                 <h2 className="text-3xl font-bold mb-6">Powered by the Edge</h2>
                 <ul className="space-y-4">
                   {[
                     "Client-side execution via Pyodide & WebAssembly",
                     "Distributed content delivery via global CDNs",
                     "Real-time state synchronization with Supabase",
                     "Secure sandboxed environments for C++/Java compilation"
                   ].map((item, i) => (
                     <li key={i} className="flex items-start gap-3 text-gray-300">
                       <Cpu className="w-5 h-5 text-gray-500 mt-0.5 shrink-0" />
                       <span>{item}</span>
                     </li>
                   ))}
                 </ul>
               </div>
               <div className="bg-black/50 border border-white/10 rounded-xl p-6 font-mono text-xs text-gray-400 relative">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
                 <div className="flex gap-1.5 mb-4">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                   <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                 </div>
                 <p className="text-purple-400 mb-2">// Infrastructure Config</p>
                 <p><span className="text-blue-400">const</span> <span className="text-yellow-200">config</span> = {'{'}</p>
                 <p className="pl-4">region: <span className="text-green-300">"us-east-1"</span>,</p>
                 <p className="pl-4">runtime: <span className="text-green-300">"WASM_Edge_v2"</span>,</p>
                 <p className="pl-4">latency: <span className="text-green-300">"&lt;50ms"</span>,</p>
                 <p className="pl-4">security: <span className="text-green-300">"Grade_A+"</span></p>
                 <p>{'};'}</p>
                 <p className="mt-2 text-gray-600">// System operational</p>
               </div>
             </div>
           </div>
        </section>

        <section className="bg-gradient-to-b from-[#09090b] to-[#0c0c0e] py-20 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center px-6">
            <h2 className="text-4xl md:text-5xl font-bold font-neuropol text-white mb-6">Ready to Build?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-xl mx-auto">
              Join thousands of developers pushing the boundaries of what's possible on the web.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => navigate('/auth')} 
                className="h-14 px-8 bg-white text-black hover:bg-gray-200 font-bold rounded-xl text-lg w-full sm:w-auto"
              >
                Get Started Now
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/practice')} 
                className="h-14 px-8 border-white/10 hover:bg-white/5 text-white font-medium rounded-xl text-lg w-full sm:w-auto"
              >
                Try Practice Arena
              </Button>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default About;
