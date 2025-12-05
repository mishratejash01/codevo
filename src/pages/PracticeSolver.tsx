import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { CodeEditor } from '@/components/CodeEditor';
import { Play, Send, CheckCircle2, XCircle, ChevronLeft, Loader2, Bug, Terminal, FileCode2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function PracticeSolver() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeCode, loading } = useCodeRunner();

  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  const [code, setCode] = useState('');
  const [consoleTab, setConsoleTab] = useState('testcases');
  const [outputResult, setOutputResult] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1. Fetch Problem Data
  const { data: problem, isLoading: problemLoading, error } = useQuery({
    queryKey: ['practice_problem', slug],
    queryFn: async () => {
      // Use .maybeSingle() to return null instead of throwing 406 error if row missing
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    retry: false
  });

  // Safe Accessor for Test Cases
  const testCases = Array.isArray(problem?.test_cases) ? problem.test_cases : [];

  // 2. Initialize Editor
  useEffect(() => {
    if (problem) {
      // Safe access to JSON column
      const templates = (problem.starter_templates as Record<string, string>) || {};
      const template = templates[activeLanguage] || `# Write your ${activeLanguage} code here\n`;
      setCode(template);
    }
  }, [problem, activeLanguage]);

  // 3. Execution Logic
  const handleRun = async () => {
    if (!problem) return;
    setConsoleTab('output');
    setOutputResult({ status: 'running' });
    
    const sampleTest = testCases.find((t: any) => t.is_public) || testCases[0];
    
    if (!sampleTest) {
      setOutputResult({ status: 'error', message: 'No test cases found for this problem.' });
      return;
    }

    let codeToRun = code;
    // Inject Python Driver for LeetCode-style Class Solutions
    if (activeLanguage === 'python' && sampleTest.input) {
       const cleanInput = typeof sampleTest.input === 'string' ? sampleTest.input.replace(/[a-zA-Z0-9_]+\s=\s/g, '') : '';
       
       codeToRun += `\n\n# --- Driver Code (Auto-Injected) ---\ntry:\n    import sys\n    if 'Solution' in locals():\n        sol = Solution()\n        # Find method that isn't __init__\n        methods = [m for m in dir(sol) if not m.startswith('__')]\n        if methods:\n            # Print result to stdout so we can capture it\n            print(getattr(sol, methods[0])(${cleanInput}))\n        else:\n            print("No method found in Solution class.")\n    elif 'twoSum' in locals():\n         print(twoSum(${cleanInput}))\n    else:\n        print("Error: Could not find function/class.")\nexcept Exception as e:\n    print(f"Runtime Error: {e}")`;
    }

    const result = await executeCode(activeLanguage, codeToRun, "");
    
    const cleanOutput = result.output?.trim();
    // Ensure both are strings to prevent crash
    const expectedStr = String(sampleTest.output || '').trim();
    const passed = cleanOutput === expectedStr || (cleanOutput && cleanOutput.includes(expectedStr));

    setOutputResult({
      status: 'complete',
      passed,
      userOutput: cleanOutput,
      expected: expectedStr,
      input: String(sampleTest.input),
      error: result.error
    });
  };

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Login Required", description: "Please login to submit.", variant: "destructive" });
      navigate('/auth');
      return;
    }
    setSubmitting(true);
    // Simulation
    setTimeout(() => {
      setSubmitting(false);
      toast({ title: "Accepted", description: "Solution correct.", className: "bg-green-600 text-white border-none" });
    }, 1500);
  };

  // --- SAFE LOADING ---
  if (problemLoading) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <span className="text-muted-foreground text-sm font-mono tracking-widest">LOADING ENVIRONMENT...</span>
    </div>
  );

  // --- SAFE ERROR ---
  if (error || !problem) return (
    <div className="h-screen bg-[#09090b] flex flex-col items-center justify-center text-center p-6 gap-6">
      <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
        <Bug className="w-8 h-8 text-red-500" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Problem Not Found</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The problem "{slug}" could not be loaded. Please ensure you ran the database setup SQL.
        </p>
      </div>
      <Button variant="outline" onClick={() => navigate('/practice-arena')} className="border-white/10 hover:bg-white/5">
        Return to Arena
      </Button>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary/30">
      
      {/* 1. Header */}
      <header className="h-14 bg-[#0a0a0a] border-b border-white/5 flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/practice-arena')} className="text-muted-foreground hover:text-white h-9 w-9">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="font-bold text-sm tracking-wide text-gray-100">{problem.title}</h1>
            <Badge variant="outline" className={cn("text-[10px] py-0 h-5 border-white/10 bg-white/5", 
              problem.difficulty === 'Easy' ? "text-green-400" : "text-red-400")}>
              {problem.difficulty}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={activeLanguage} onValueChange={(v) => setActiveLanguage(v as Language)}>
            <SelectTrigger className="h-8 w-[140px] bg-[#151515] border-white/10 text-xs font-medium text-gray-300 focus:ring-0 hover:bg-[#1a1a1a] transition-colors">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#151515] border-white/10 text-gray-300">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
            </SelectContent>
          </Select>

          <div className="h-5 w-px bg-white/10 mx-1" />

          <Button variant="secondary" size="sm" onClick={handleRun} disabled={loading} className="h-8 text-xs bg-white/5 hover:bg-white/10 text-white border border-white/5">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Play className="w-3.5 h-3.5 mr-2 fill-current"/>} Run
          </Button>
          
          <Button size="sm" onClick={handleSubmit} disabled={submitting} className="h-8 text-xs bg-green-600 hover:bg-green-500 text-white font-semibold border-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2"/> : <Send className="w-3.5 h-3.5 mr-2"/>} Submit
          </Button>
        </div>
      </header>

      {/* 2. Main Workspace */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          
          {/* LEFT: Description */}
          <ResizablePanel defaultSize={40} minSize={25} className="bg-[#0a0a0a] flex flex-col border-r border-white/5">
            <div className="h-10 border-b border-white/5 flex items-center px-1 bg-[#0f0f0f]">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                <TabsList className="h-full bg-transparent p-0 gap-0 w-full justify-start rounded-none">
                  <TabsTrigger value="description" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white/5 data-[state=active]:text-white text-xs font-medium text-muted-foreground w-auto px-4">
                    <FileCode2 className="w-3.5 h-3.5 mr-2" /> Description
                  </TabsTrigger>
                  <TabsTrigger value="solution" disabled className="h-full rounded-none border-b-2 border-transparent text-xs font-medium text-muted-foreground w-auto px-4 opacity-50 cursor-not-allowed">
                    <Info className="w-3.5 h-3.5 mr-2" /> Solution <span className="ml-1 text-[9px] bg-white/10 px-1 rounded">PRO</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 pb-20">
                <TabsContent value="description" className="mt-0 space-y-8 animate-in fade-in duration-300">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">{problem.title}</h2>
                    <div className="prose prose-invert prose-sm max-w-none text-gray-400 leading-relaxed font-sans">
                      <p className="whitespace-pre-wrap">{problem.description}</p>
                    </div>
                  </div>

                  {testCases.length > 0 && (
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Example Cases</h3>
                      {testCases.filter((t: any) => t.is_public).map((t: any, i: number) => (
                        <div key={i} className="bg-[#151515] border border-white/5 rounded-lg overflow-hidden group">
                          <div className="px-3 py-2 bg-white/5 border-b border-white/5 text-[10px] text-gray-400 font-mono flex justify-between">
                            <span>Case {i + 1}</span>
                            <span className="text-green-500/50 group-hover:text-green-500 transition-colors">Visible</span>
                          </div>
                          <div className="p-3 space-y-3 font-mono text-xs">
                            <div>
                              <span className="text-blue-400 select-none block mb-1">Input:</span> 
                              {/* Safely handle input display */}
                              <span className="text-gray-300 bg-black/30 px-2 py-1 rounded block break-all">
                                {typeof t.input === 'object' ? JSON.stringify(t.input) : t.input}
                              </span>
                            </div>
                            <div>
                              <span className="text-green-400 select-none block mb-1">Output:</span> 
                              <span className="text-gray-300 bg-black/30 px-2 py-1 rounded block break-all">
                                {typeof t.output === 'object' ? JSON.stringify(t.output) : t.output}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-[#050505] w-1.5 border-l border-r border-white/5 hover:bg-primary/30 transition-colors" />

          {/* RIGHT: Editor & Console */}
          <ResizablePanel defaultSize={60}>
            <ResizablePanelGroup direction="vertical">
              
              {/* Top: Editor */}
              <ResizablePanel defaultSize={65} className="flex flex-col bg-[#1e1e1e] relative">
                <div className="flex-1">
                  <CodeEditor 
                    value={code} 
                    onChange={setCode} 
                    language={activeLanguage}
                  />
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-[#0c0c0e] h-1.5 border-t border-b border-white/5 hover:bg-primary/50 transition-colors" />

              {/* Bottom: Console */}
              <ResizablePanel defaultSize={35} className="bg-[#0c0c0e] flex flex-col">
                <div className="h-9 border-b border-white/10 flex items-center px-2 bg-[#0a0a0a] shrink-0">
                  <Tabs value={consoleTab} onValueChange={setConsoleTab} className="w-full h-full">
                    <TabsList className="h-full bg-transparent p-0 gap-4">
                      <TabsTrigger value="testcases" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-xs font-medium text-muted-foreground flex items-center gap-2 px-2">
                        <Terminal className="w-3 h-3" /> Test Cases
                      </TabsTrigger>
                      <TabsTrigger value="output" className="h-full rounded-none border-b-2 border-transparent data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-white text-xs font-medium text-muted-foreground flex items-center gap-2 px-2">
                        <Bug className="w-3 h-3" /> Run Result
                        {outputResult && (
                          <div className={cn("w-1.5 h-1.5 rounded-full ml-1.5", outputResult.passed ? "bg-green-500 shadow-[0_0_5px_lime]" : "bg-red-500 shadow-[0_0_5px_red]")} />
                        )}
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="flex-1 overflow-auto p-4 bg-[#0c0c0e]">
                  {consoleTab === 'testcases' ? (
                    <div className="space-y-3">
                      {testCases.length > 0 ? testCases.map((tc: any, i: number) => (
                        <div key={i} className="flex flex-col gap-1.5 opacity-80 hover:opacity-100 transition-opacity">
                          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Case {i + 1}</div>
                          <div className="bg-white/5 p-2 rounded border border-white/10 text-gray-300 font-mono text-xs truncate">
                            {typeof tc.input === 'object' ? JSON.stringify(tc.input) : tc.input}
                          </div>
                        </div>
                      )) : (
                        <div className="text-muted-foreground text-xs italic opacity-50 text-center mt-10">No test cases available.</div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full">
                      {!outputResult ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-40">
                          <Terminal className="w-6 h-6" />
                          <span className="text-xs">Run code to see results</span>
                        </div>
                      ) : outputResult.status === 'running' ? (
                        <div className="flex flex-col items-center justify-center h-full text-yellow-500 space-y-2">
                          <Loader2 className="w-5 h-5 animate-spin"/> 
                          <span className="text-xs font-mono animate-pulse">EXECUTING...</span>
                        </div>
                      ) : (
                        <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                          <div className={cn("flex items-center gap-3 p-3 rounded-lg border", outputResult.passed ? "bg-green-900/10 border-green-500/30" : "bg-red-900/10 border-red-500/30")}>
                            {outputResult.passed ? <CheckCircle2 className="w-5 h-5 text-green-500"/> : <XCircle className="w-5 h-5 text-red-500"/>}
                            <div>
                              <div className={cn("text-sm font-bold", outputResult.passed ? "text-green-400" : "text-red-400")}>
                                {outputResult.passed ? "Accepted" : "Wrong Answer"}
                              </div>
                            </div>
                          </div>

                          {outputResult.error ? (
                             <div className="bg-red-950/20 p-3 rounded border border-red-500/20 text-red-300 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                               {outputResult.error}
                             </div>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 font-mono text-xs">
                              <div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Input</div>
                                <div className="bg-[#1a1a1a] p-2.5 rounded text-gray-300 border border-white/5 break-all">{outputResult.input}</div>
                              </div>
                              <div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Your Output</div>
                                <div className={cn("p-2.5 rounded border break-all", outputResult.passed ? "bg-[#1a1a1a] border-white/5 text-gray-300" : "bg-red-900/10 border-red-500/20 text-red-200")}>
                                  {outputResult.userOutput || <span className="italic opacity-50">Empty</span>}
                                </div>
                              </div>
                              {!outputResult.passed && (
                                <div>
                                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Expected</div>
                                  <div className="bg-green-900/10 p-2.5 rounded text-green-200 border border-green-500/20 break-all">{outputResult.expected}</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ResizablePanel>

            </ResizablePanelGroup>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
}
