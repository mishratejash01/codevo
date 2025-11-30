import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Shield, TrendingUp, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import DarkVeil from '@/components/DarkVeil';

const Landing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [session, setSession] = useState<any>(null);

  // Monitor Auth State & Clean URL Hash
  useEffect(() => {
    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      // Clean up URL if returning from Google OAuth with a hash
      if (session && window.location.hash && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
        toast({
          title: "Welcome back!",
          description: "Successfully logged in via Google.",
        });
      }
    });

    // 2. Listen for Auth Changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);

      // Clean up URL on sign-in event
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        description: "Logged out successfully",
      });
      setSession(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-primary/20 flex flex-col">
      {/* Header */}
      <Header session={session} onLogout={handleLogout} />

      <main className="flex-1 w-full">
        {/* Hero Section with DarkVeil Background */}
        <section className="relative w-full overflow-hidden pt-32 pb-48 text-center">
          {/* Absolute Background */}
          <div className="absolute inset-0 -z-10 h-full w-full">
             <DarkVeil />
             {/* Optional: Add a gradient overlay to ensure text readability */}
             <div className="absolute inset-0 bg-black/40" />
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-6xl mx-auto space-y-12">
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary animate-in fade-in slide-in-from-bottom-4 duration-1000">
                  <Zap className="w-4 h-4" />
                  <span>Official IIT Madras Portal</span>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-5 duration-1000 delay-100">
                  Choose Your <br />
                  <span className="bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
                    Environment
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
                  Select the appropriate mode for your session. Use the Learning Environment for practice and the Exam Portal for scheduled assessments.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                
                {/* Learning Environment Card */}
                <div className="group relative bg-[#0c0c0e]/80 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-primary/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col h-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 flex-1">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                      <Code2 className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">Learning Environment</h2>
                    <div className="text-muted-foreground leading-relaxed mb-6">
                      Standard practice console offering:
                      <ul className="mt-4 space-y-3 text-sm">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Instant Feedback & Scoring</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Unlimited Attempts</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_currentColor]"/> Access to Public Test Cases</li>
                      </ul>
                    </div>
                  </div>

                  <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                    <Button 
                      size="lg"
                      onClick={() => session ? navigate('/practice') : navigate('/auth')}
                      className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 h-12 text-base font-medium transition-all hover:scale-[1.02]"
                    >
                      {session ? "Enter Learning Mode" : "Login to Practice"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Proctored Environment Card */}
                <div className="group relative bg-[#0c0c0e]/80 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-red-500/50 transition-all duration-500 text-left hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col h-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative z-10 flex-1">
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-red-500/20">
                      <Lock className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">Exam Portal</h2>
                    <div className="text-muted-foreground leading-relaxed mb-6">
                      Secure proctored environment featuring:
                      <ul className="mt-4 space-y-3 text-sm">
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Strict Time Limits</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Full-screen Enforcement</li>
                        <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_currentColor]"/> Activity Monitoring</li>
                      </ul>
                    </div>
                  </div>

                  <div className="relative z-10 pt-8 mt-auto border-t border-white/5">
                    <Button 
                      size="lg"
                      variant="outline"
                      className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 hover:text-red-400 h-12 text-base font-medium transition-all hover:scale-[1.02]"
                      onClick={() => session ? navigate('/exam') : navigate('/auth')}
                    >
                      {session ? "Enter Exam Hall" : "Login to Exam"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="container mx-auto px-6 py-24 border-t border-white/10">
          <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Platform Features</h2>
              <p className="text-muted-foreground">Everything you need to master your coding skills</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
             <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Instant Evaluation</h3>
              <p className="text-muted-foreground leading-relaxed">
                Code is evaluated client-side using Pyodide WebAssembly for immediate feedback without server latency.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold mb-3">Secure & Scalable</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built on a robust infrastructure ensuring a secure, reliable, and consistent coding experience for all users.
              </p>
            </div>

            <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-8 hover:bg-white/5 transition-colors">
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-bold mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground leading-relaxed">
                Detailed breakdown of passed test cases, error logs, and execution outputs to help you debug faster.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-12 bg-[#0c0c0e]">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 IIT Madras. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="hover:text-white transition-colors cursor-pointer">Privacy</span>
              <span className="hover:text-white transition-colors cursor-pointer">Terms</span>
              <span className="hover:text-white transition-colors cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
