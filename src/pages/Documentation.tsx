import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Home, Code2, Terminal, GraduationCap, Trophy, Shield, User, FileText, Map } from 'lucide-react';

const Documentation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-12 font-sans selection:bg-primary/20 pt-24">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="space-y-6 text-center md:text-left">
          <Button variant="ghost" onClick={() => navigate('/')} className="pl-0 hover:text-primary text-muted-foreground group">
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Return to Base
          </Button>
          <div>
            <h1 className="text-4xl md:text-6xl font-bold font-neuropol tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              System Cartography
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed mt-4">
              Lost in the void? Here is the definitive map of the <span className="font-neuropol text-white">CODéVO</span> ecosystem. 
              Everything you need to know about where to go and what to do.
            </p>
          </div>
        </div>

        {/* Navigation Breakdown */}
        <Tabs defaultValue="platform" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 bg-white/5 border border-white/10 h-auto p-1 rounded-xl">
            <TabsTrigger value="platform" className="data-[state=active]:bg-primary data-[state=active]:text-white h-10 rounded-lg">Platform Core</TabsTrigger>
            <TabsTrigger value="academic" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white h-10 rounded-lg">Academic Zone</TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white h-10 rounded-lg">Dev Tools</TabsTrigger>
            <TabsTrigger value="meta" className="data-[state=active]:bg-green-600 data-[state=active]:text-white h-10 rounded-lg">Meta & Legal</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[600px] mt-8 rounded-2xl border border-white/10 bg-[#0c0c0e]/50 backdrop-blur-sm p-6 shadow-2xl">
            
            {/* PLATFORM CORE */}
            <TabsContent value="platform" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section 
                icon={<Home className="w-6 h-6 text-primary" />}
                title="Landing / Home"
                route="/"
                desc="The Launchpad. Your entry point to the ecosystem. Features a showcase of our capabilities, quick access via the Dock, and the gateway to authentication."
                features={["Hero Section", "Feature Showcase", "Quick Navigation Dock"]}
                action={() => navigate('/')}
              />
              <Section 
                icon={<User className="w-6 h-6 text-primary" />}
                title="Authentication"
                route="/auth"
                desc="The Gatekeeper. Secure access using Google OAuth. This is where your journey begins, sessions are tracked, and progress is saved."
                features={["Google Login", "Session Management", "Secure Access"]}
                action={() => navigate('/auth')}
              />
              <Section 
                icon={<Trophy className="w-6 h-6 text-yellow-500" />}
                title="Leaderboard"
                route="/leaderboard"
                desc="The Hall of Fame. Check your global ranking based on practice scores and exam performance. Filter by current month or all-time records."
                features={["Global Rankings", "Monthly Filters", "User Statistics"]}
                action={() => navigate('/leaderboard')}
              />
            </TabsContent>

            {/* ACADEMIC ZONE */}
            <TabsContent value="academic" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section 
                icon={<GraduationCap className="w-6 h-6 text-blue-400" />}
                title="Degree Dashboard"
                route="/degree"
                desc="The IITM BS Command Center. Specifically designed for students to explore their curriculum. Filter subjects by level (Foundation, Diploma, Degree)."
                features={["Level Filtering", "Subject Search", "Curriculum Access"]}
                action={() => navigate('/degree')}
              />
              <Section 
                icon={<Map className="w-6 h-6 text-blue-400" />}
                title="Subject Navigation"
                route="/degree/sets/..."
                desc="The Pathfinder. Once a subject is selected, drill down into specific modes: Practice (Learning Environment) or Exams (Proctored)."
                features={["Mode Selection", "Topic Filtering", "Exam Sets"]}
              />
              <Section 
                icon={<Shield className="w-6 h-6 text-red-500" />}
                title="Exam Hall"
                route="/exam"
                desc="The Proving Ground. A strictly proctored environment with full-screen enforcement, webcam monitoring, and audio detection. No cheating allowed."
                features={["AI Proctoring", "Fullscreen Lock", "Submission Analytics"]}
                action={() => navigate('/exam')}
              />
            </TabsContent>

            {/* DEV TOOLS */}
            <TabsContent value="tools" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section 
                icon={<Code2 className="w-6 h-6 text-purple-400" />}
                title="Practice Arena"
                route="/practice"
                desc="The Dojo. Your daily training ground. Select problems from the sidebar, write code in the Monaco editor, and run test cases instantly."
                features={["Monaco Editor", "Test Case Runner", "Problem Sidebar", "Real-time Output"]}
                action={() => navigate('/practice')}
              />
              <Section 
                icon={<Terminal className="w-6 h-6 text-purple-400" />}
                title="Online Compiler"
                route="/compiler"
                desc="The Sandbox. A distraction-free environment to prototype code in multiple languages (Python, Java, C++, etc.). Just you and the code."
                features={["Multi-language", "Instant Execution", "Download Code", "Clean UI"]}
                action={() => navigate('/compiler')}
              />
            </TabsContent>

            {/* META */}
            <TabsContent value="meta" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Section 
                icon={<FileText className="w-6 h-6 text-green-400" />}
                title="Documentation"
                route="/docs"
                desc="You Are Here. The recursive manual explaining where everything is. Meta-knowledge for the meta-developer."
                features={["Site Map", "Navigation Guide", "System Overview"]}
              />
              {/* Future legal pages can go here */}
            </TabsContent>

          </ScrollArea>
        </Tabs>

        {/* Footer Note */}
        <div className="text-center pt-8 border-t border-white/5">
          <p className="text-sm text-muted-foreground/60 font-mono">
            // End of File. System cartography complete.
          </p>
        </div>
      </div>
    </div>
  );
};

// Helper Component for Sections
const Section = ({ icon, title, route, desc, features, action }: any) => (
  <Card className="bg-[#0f0f11] border-white/10 hover:border-primary/30 transition-all duration-300 hover:bg-white/5 group cursor-default">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 group-hover:scale-110 transition-transform duration-300 shadow-lg">
            {icon}
          </div>
          <div>
            <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">{title}</CardTitle>
            <div className="flex items-center gap-2 mt-1.5">
              <code className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded font-mono border border-primary/20">
                {route}
              </code>
            </div>
          </div>
        </div>
        {action && (
          <Button variant="outline" size="sm" onClick={action} className="opacity-0 group-hover:opacity-100 transition-opacity bg-transparent border-white/20 hover:bg-white/10 text-xs">
            Visit
          </Button>
        )}
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <CardDescription className="text-gray-400 leading-relaxed text-sm">
        {desc}
      </CardDescription>
      <div className="flex flex-wrap gap-2">
        {features.map((f: string, i: number) => (
          <span key={i} className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 bg-white/5 px-2.5 py-1 rounded-md border border-white/5 hover:border-white/10 transition-colors">
            {f}
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default Documentation;
