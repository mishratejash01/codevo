import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code2, Zap, Shield, TrendingUp, ArrowRight, Terminal, CheckCircle } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090b] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#09090b]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight">OPPE Practice</h1>
          </div>
          <Button 
            onClick={() => navigate('/practice')}
            variant="ghost"
            className="text-sm"
          >
            Launch Console
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 pt-24 pb-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-sm text-primary mb-4">
            <Zap className="w-4 h-4" />
            <span>Official IIT Madras Practice Environment</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight leading-tight">
            Master Python with{' '}
            <span className="bg-gradient-to-r from-primary via-accent to-success bg-clip-text text-transparent">
              Real-time Feedback
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The official practice environment for IIT Madras students. Write, test, and submit Python solutions with instant validation.
          </p>

          <div className="flex gap-4 justify-center pt-6">
            <Button 
              size="lg"
              onClick={() => navigate('/practice')}
              className="text-lg h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-[0_0_30px_rgba(147,51,234,0.3)] border-none"
            >
              Start Practicing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Code Preview Mock */}
          <div className="mt-16 bg-[#0c0c0e] border border-white/10 rounded-lg p-6 text-left shadow-2xl">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-4 text-xs text-muted-foreground font-mono">main.py</span>
            </div>
            <pre className="font-mono text-sm text-green-400/90">
              <code>{`def find_max(numbers):\n    """Find maximum in a list"""\n    return max(numbers)\n\n# Test cases passed: 5/5 ✓`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="bg-[#0c0c0e] border border-white/10 rounded-lg p-8 hover:border-primary/50 transition-colors">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Instant Feedback</h3>
            <p className="text-muted-foreground leading-relaxed">
              Run your code against real test cases and get immediate results. See exactly which test cases pass or fail.
            </p>
          </div>

          <div className="bg-[#0c0c0e] border border-white/10 rounded-lg p-8 hover:border-accent/50 transition-colors">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure Environment</h3>
            <p className="text-muted-foreground leading-relaxed">
              Client-side execution via Pyodide ensures your code runs safely in your browser without backend latency.
            </p>
          </div>

          <div className="bg-[#0c0c0e] border border-white/10 rounded-lg p-8 hover:border-success/50 transition-colors">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-xl font-bold mb-3">Progress Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Save your submissions and track scores across all assignments. Monitor your improvement over time.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-6 py-24 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">How It Works</h2>
          
          <div className="space-y-12">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">1</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Select a Problem</h3>
                <p className="text-muted-foreground">Choose from categorized assignments covering various Python concepts and difficulty levels.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center text-accent font-bold">2</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Write Your Solution</h3>
                <p className="text-muted-foreground">Use the Monaco editor with syntax highlighting and autocomplete to write clean Python code.</p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 bg-success/20 rounded-full flex items-center justify-center text-success font-bold">3</div>
              <div>
                <h3 className="text-xl font-bold mb-2">Test & Submit</h3>
                <p className="text-muted-foreground">Run against public test cases to validate your logic, then submit to be evaluated against all test cases.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-primary/10 via-accent/10 to-success/10 border border-white/10 rounded-2xl p-12 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Start Coding?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of IIT Madras students practicing Python
          </p>
          <Button 
            size="lg"
            onClick={() => navigate('/practice')}
            className="text-lg h-14 px-8 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Launch Practice Console
            <Code2 className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-24">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2024 IIT Madras OPPE Practice. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
