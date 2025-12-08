import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Textarea } from "@/components/ui/textarea"; 
import { CodeEditor } from '@/components/CodeEditor';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { Loader2, Play, RefreshCw, Code2, Home, Terminal, Download, Keyboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case 'cpp': return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}';
    case 'c': return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
    case 'javascript': return 'console.log("Hello, World!");';
    case 'sql': return '-- Write your SQL Query here\nCREATE TABLE demo (id INTEGER, message TEXT);\nINSERT INTO demo VALUES (1, "Hello World");\nSELECT * FROM demo;';
    case 'bash': return '#!/bin/bash\necho "Hello, World!"';
    default: return '# Python 3\n# Inputs are read from the Input tab\nname = input("Enter your name: ")\nprint(f"Hello, {name}!")';
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
  
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [inputData, setInputData] = useState<string>(""); 
  const [output, setOutput] = useState<string>('// Output will appear here...');
  const [activeTab, setActiveTab] = useState("output"); 
  
  const { executeCode, loading } = useCodeRunner();

  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setOutput('// Language changed. Output cleared.');
  };

  const handleRun = async () => {
    if (loading) return;
    
    // 1. Switch to Output Tab
    setActiveTab("output"); 
    
    // 2. HARD RESET OUTPUT
    // We clear it here, but we also wait 50ms to ensure React updates the UI 
    // before the main thread gets busy with Pyodide.
    setOutput(''); 
    
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // 3. Define Streaming Handler
    const handleStreamOutput = (text: string) => {
        setOutput((prev) => prev + text);
    };

    // 4. Run Code
    const result = await executeCode(activeLanguage, code, inputData, handleStreamOutput);
    
    // 5. Handle Final Result / Errors
    if (activeLanguage !== 'python') {
        // Piston (Non-streaming)
        if (result.success) {
            setOutput(result.output);
        } else {
            // FIX: Show the error message (which we now get from data.run.output)
            setOutput(result.error || "An unknown error occurred.");
        }
    } else {
        // Python (Streaming)
        // If there was an error (like SyntaxError), append it to whatever was printed
        if (!result.success) {
            setOutput((prev) => prev + "\n" + (result.error || ""));
        }
    }
  };

  // Helper to determine if output is an error
  const isError = (text: string) => {
     const lower = text.toLowerCase();
     return lower.includes('error') || lower.includes('exception') || lower.includes('traceback') || lower.includes('failed');
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
      {/* Header Bar */}
      <header className="border-b border-white/10 bg-[#0c0c0e] px-4 py-3 flex items-center justify-between shrink-0 h-16">
         <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10">
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h1 className="text-sm font-bold tracking-tight text-purple-400">
              CodeVo Compiler
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Select value={activeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-9 w-[140px] bg-white/5 border-white/10 text-xs font-medium">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-blue-400" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
              <SelectItem value="python">Python</SelectItem>
              <SelectItem value="java">Java</SelectItem>
              <SelectItem value="cpp">C++</SelectItem>
              <SelectItem value="c">C</SelectItem>
              <SelectItem value="javascript">JavaScript</SelectItem>
              <SelectItem value="sql">SQL</SelectItem>
              <SelectItem value="bash">Bash</SelectItem>
            </SelectContent>
          </Select>
          
           <Button 
            onClick={handleDownload} 
            variant="outline"
            size="sm" 
            className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white"
            title="Download Source Code"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Save File</span>
          </Button>

          <Button 
            onClick={handleRun} 
            disabled={loading} 
            size="sm" 
            className="h-9 bg-green-600 hover:bg-green-500 text-white px-6 font-bold shadow-[0_0_15px_rgba(22,163,74,0.4)]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Play className="w-4 h-4 mr-2 fill-current"/> Run Code</>}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="vertical" className="h-full">
          
          {/* Top Panel: Editor */}
          <ResizablePanel defaultSize={70} className="bg-[#09090b]">
            <CodeEditor 
              value={code} 
              onChange={setCode} 
              language={activeLanguage}
            />
          </ResizablePanel>

          <ResizableHandle withHandle className="bg-black border-t border-b border-white/10 h-2 hover:bg-purple-500/20 transition-colors" />

          {/* Bottom Panel: Output & Input */}
          <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col min-h-[100px] relative">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 border-b border-white/10 bg-black/20 shrink-0">
                    <TabsList className="bg-transparent h-10 p-0 gap-4">
                        <TabsTrigger 
                            value="output" 
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-400 rounded-none h-10 px-2 text-xs uppercase tracking-wider font-bold text-muted-foreground"
                        >
                            <Terminal className="w-3 h-3 mr-2" /> Console Output
                        </TabsTrigger>
                        <TabsTrigger 
                            value="input" 
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-400 rounded-none h-10 px-2 text-xs uppercase tracking-wider font-bold text-muted-foreground"
                        >
                            <Keyboard className="w-3 h-3 mr-2" /> Standard Input (Stdin)
                        </TabsTrigger>
                    </TabsList>

                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setOutput('// Output cleared.')}>
                        <RefreshCw className="w-3 h-3"/>
                    </Button>
                </div>

                <TabsContent value="output" className="flex-1 p-0 m-0 overflow-hidden relative group">
                     <div className="absolute inset-0 p-4 font-mono text-sm overflow-auto custom-scrollbar">
                        <pre className={cn("whitespace-pre-wrap font-mono", isError(output) ? "text-red-400" : "text-blue-300")}>
                            {output || <span className="text-white/20 italic">Run code to see output...</span>}
                        </pre>
                     </div>
                </TabsContent>

                <TabsContent value="input" className="flex-1 p-0 m-0 overflow-hidden">
                    <Textarea 
                        value={inputData}
                        onChange={(e) => setInputData(e.target.value)}
                        placeholder="Enter input here (e.g., numbers for scanf, or text for input()). The code will read this when it runs."
                        className="w-full h-full bg-[#1e1e20] text-white border-none resize-none rounded-none p-4 font-mono focus-visible:ring-0"
                    />
                </TabsContent>
            </Tabs>

            {/* WATERMARK */}
            <div className="absolute bottom-2 right-3 pointer-events-none select-none z-50 flex items-center justify-end opacity-40">
              <span className="font-neuropol text-[10px] font-bold tracking-widest text-white">
                COD
                <span className="text-[1.2em] lowercase relative top-[0.5px] mx-[0.5px] inline-block">é</span>
                VO
              </span>
            </div>
          </ResizablePanel>

        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Compiler;
