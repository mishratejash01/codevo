import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Textarea } from "@/components/ui/textarea"; 
import { CodeEditor } from '@/components/CodeEditor';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { usePyodide } from '@/hooks/usePyodide';
import { TerminalView } from '@/components/TerminalView';
import { Loader2, Play, RefreshCw, Code2, Home, Terminal as TerminalIcon, Download, Keyboard, Lock, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

const LANGUAGES_CONFIG = [
  { id: 'python', name: 'Python' },
  { id: 'java', name: 'Java' },
  { id: 'cpp', name: 'C++' },
  { id: 'c', name: 'C' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'sql', name: 'SQL' },
  { id: 'bash', name: 'Bash' },
] as const;

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case 'cpp': return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}';
    case 'c': return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
    case 'javascript': return 'console.log("Hello, World!");';
    case 'sql': return '-- Write your SQL Query here\nCREATE TABLE demo (id INTEGER, message TEXT);\nINSERT INTO demo VALUES (1, "Hello World");\nSELECT * FROM demo;';
    case 'bash': return '#!/bin/bash\necho "Hello, World!"';
    default: return '# Python 3\n# Inputs are read directly from the terminal below!\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")';
  }
};

const getFileName = (lang: Language) => {
    switch(lang) {
    case 'java': return 'Main.java';
    case 'cpp': return 'main.cpp';
    case 'c': return 'main.c';
    case 'javascript': return 'index.js';
    case 'sql': return 'query.sql';
    case 'bash': return 'script.sh';
    default: return 'main.py';
  }
};

const Compiler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [lockedLanguages, setLockedLanguages] = useState<Record<string, boolean>>({});
  const [inputData, setInputData] = useState<string>(""); 
  const [output, setOutput] = useState<string>('// Output will appear here...');
  const [activeTab, setActiveTab] = useState("output");
  const [isError, setIsError] = useState(false);
  const [isOutputExpanded, setIsOutputExpanded] = useState(true);
  
  const { executeCode, loading: pistonLoading } = useCodeRunner();
  const { 
      runCode: runPython, 
      output: pythonOutput, 
      isRunning: pythonRunning, 
      isReady: pythonReady, 
      writeInputToWorker 
  } = usePyodide();

  const isLoading = pistonLoading || pythonRunning || (activeLanguage === 'python' && !pythonReady);

  useEffect(() => {
    const fetchLanguages = async () => {
      const { data, error } = await supabase
        .from('languages')
        .select('id, is_locked');

      if (!error && data) {
        const statusMap: Record<string, boolean> = {};
        data.forEach((lang: any) => {
          statusMap[lang.id] = lang.is_locked;
        });
        setLockedLanguages(statusMap);
      }
    };

    fetchLanguages();
  }, []);

  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    
    if (lockedLanguages[newLang]) {
        toast({ title: "Locked", description: "This language is currently disabled.", variant: "destructive" });
        return;
    }

    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setOutput('// Language changed. Output cleared.');
    setIsError(false);
  };

  const handleRun = async () => {
    if (isLoading) return;
    
    if (lockedLanguages[activeLanguage]) {
        toast({ title: "Locked", description: "This language is currently disabled.", variant: "destructive" });
        return;
    }

    if (activeLanguage === 'python') {
        runPython(code);
    } else {
        setActiveTab("output"); 
        setOutput(""); 
        setIsError(false); 
        
        const result = await executeCode(activeLanguage, code, inputData);
        
        if (!result.success) setIsError(true);
        setOutput(result.output || result.error || "Unknown Error");
    }
    
    setIsOutputExpanded(true);
  };

  const handleDownload = () => {
      try {
      const filename = getFileName(activeLanguage);
      const blob = new Blob([code], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Download Started", description: `Downloading ${filename}`, duration: 2000 });
    } catch (err) {
      toast({ title: "Download Failed", description: "Could not generate file.", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] px-3 md:px-4 py-2 md:py-3 flex items-center justify-between shrink-0 h-14 md:h-16">
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10 h-8 w-8 md:h-9 md:w-9">
            <Home className="w-4 md:w-5 h-4 md:h-5" />
          </Button>
          <div className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <TerminalIcon className="w-3 md:w-4 h-3 md:h-4 text-purple-400" />
            <h1 className="text-xs md:text-sm font-bold tracking-tight text-purple-400">
              CodeVo
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Select value={activeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-8 md:h-9 w-[100px] md:w-[140px] bg-white/5 border-white/10 text-[10px] md:text-xs font-medium">
              <div className="flex items-center gap-1.5 md:gap-2">
                <Code2 className="w-3 md:w-3.5 h-3 md:h-3.5 text-blue-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
              {LANGUAGES_CONFIG.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  value={lang.id} 
                  disabled={lockedLanguages[lang.id]}
                  className="flex items-center justify-between text-xs md:text-sm"
                >
                  <div className="flex items-center gap-2 w-full">
                    {lang.name}
                    {lockedLanguages[lang.id] && <Lock className="w-3 h-3 ml-2 text-red-400" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={handleDownload} variant="outline" size="sm" className="h-8 md:h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white px-2 md:px-3">
            <Download className="w-3.5 md:w-4 h-3.5 md:h-4" />
            <span className="hidden md:inline ml-2">Save</span>
          </Button>

          <Button 
            onClick={handleRun} 
            disabled={isLoading || lockedLanguages[activeLanguage]} 
            size="sm" 
            className={cn(
                "h-8 md:h-9 px-3 md:px-6 font-bold text-white transition-all text-xs md:text-sm",
                isLoading || lockedLanguages[activeLanguage] ? "bg-red-600 hover:bg-red-500" : "bg-green-600 hover:bg-green-500 shadow-[0_0_15px_rgba(22,163,74,0.4)]"
            )}
          >
            {isLoading ? (
                <>
                  <Loader2 className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2 animate-spin"/> 
                  <span className="hidden sm:inline">{!pythonReady && activeLanguage === 'python' ? "Booting..." : "Running..."}</span>
                  <span className="sm:hidden">...</span>
                </>
            ) : lockedLanguages[activeLanguage] ? (
                <><Lock className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2"/> <span className="hidden sm:inline">Locked</span></>
            ) : (
                <><Play className="w-3.5 md:w-4 h-3.5 md:h-4 mr-1.5 md:mr-2 fill-current"/> Run</>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#09090b]">
            <CodeEditor 
              value={code} 
              onChange={setCode} 
              language={activeLanguage}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-black border-t border-b border-white/10 h-2 hover:bg-purple-500/20 transition-colors" />

          <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#0c0c0e] flex flex-col min-h-[100px] relative">
            
            {activeLanguage === 'python' ? (
              <div className="flex-1 flex flex-col min-h-0 relative">
                <div className="flex items-center justify-between px-3 md:px-4 border-b border-white/10 bg-black/20 h-9 md:h-10 shrink-0">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <TerminalIcon className="w-3 h-3" /> Interactive Terminal
                  </div>
                  {pythonRunning && (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-[8px] md:text-[10px] text-green-400 font-mono">ACTIVE</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 relative">
                  {!pythonReady ? (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs md:text-sm font-mono">
                      <div className="flex flex-col items-center gap-3 p-4 text-center">
                        <Loader2 className="w-6 md:w-8 h-6 md:h-8 animate-spin text-purple-500" />
                        <span className="text-[10px] md:text-xs">Initializing Python...</span>
                      </div>
                    </div>
                  ) : (
                    <TerminalView 
                      output={pythonOutput} 
                      onInput={writeInputToWorker} 
                    />
                  )}
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-3 md:px-4 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="bg-transparent h-9 md:h-10 p-0 gap-2 md:gap-4">
                    <TabsTrigger value="output" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 rounded-none h-9 md:h-10 px-1.5 md:px-2 text-[10px] md:text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      <TerminalIcon className="w-3 h-3 mr-1.5 md:mr-2" /> Output
                    </TabsTrigger>
                    <TabsTrigger value="input" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-400 rounded-none h-9 md:h-10 px-1.5 md:px-2 text-[10px] md:text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      <Keyboard className="w-3 h-3 mr-1.5 md:mr-2" /> Input
                    </TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setOutput('// Output cleared.')}>
                    <RefreshCw className="w-3 h-3"/>
                  </Button>
                </div>

                <TabsContent value="output" className="flex-1 p-0 m-0 overflow-hidden relative group">
                  <div className="absolute inset-0 p-3 md:p-4 font-mono text-xs md:text-sm overflow-auto custom-scrollbar">
                    <pre className={cn("whitespace-pre-wrap font-mono", isError ? "text-red-400" : "text-blue-300")}>
                      {output || (!pistonLoading && <span className="text-white/20 italic">Run code to see output...</span>)}
                    </pre>
                  </div>
                </TabsContent>

                <TabsContent value="input" className="flex-1 p-0 m-0 overflow-hidden">
                  <Textarea 
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder="Enter input here..."
                    className="w-full h-full bg-[#1e1e20] text-white border-none resize-none rounded-none p-3 md:p-4 font-mono text-xs md:text-sm focus-visible:ring-0"
                  />
                </TabsContent>
              </Tabs>
            )}

            <div className="absolute bottom-2 right-3 pointer-events-none select-none z-50 flex items-center justify-end opacity-40">
              <span className="font-neuropol text-[8px] md:text-[10px] font-bold tracking-widest text-white">
                COD<span className="text-[1.2em] lowercase relative top-[0.5px] mx-[0.5px] inline-block">é</span>VO
              </span>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Compiler;
