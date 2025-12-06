import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from '@/components/CodeEditor';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { Loader2, Play, RefreshCw, Code2, FileCode, Home, Terminal, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// --- Helper Functions (Reused from AssignmentView) ---
const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return 'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case 'cpp': return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}';
    case 'c': return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
    case 'javascript': return 'console.log("Hello, World!");';
    case 'sql': return '-- Write your SQL Query here\nCREATE TABLE demo (id INTEGER, message TEXT);\nINSERT INTO demo VALUES (1, "Hello World");\nSELECT * FROM demo;';
    case 'bash': return '#!/bin/bash\necho "Hello, World!"';
    default: return '# Python 3\nprint("Hello, World!")';
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
  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  const [code, setCode] = useState<string>(getStarterTemplate('python'));
  const [output, setOutput] = useState<string>('// Output will appear here...');
  const { executeCode, loading } = useCodeRunner();

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setOutput('// Language changed. Output cleared.');
  };

  const handleRun = async () => {
    if (loading) return;
    setOutput('Running...');
    
    // For standard compiler, we don't need hidden input logic
    const result = await executeCode(activeLanguage, code, "");
    
    if (result.success) {
      setOutput(result.output);
    } else {
      setOutput(result.error || "An unknown error occurred.");
    }
  };

  // --- NEW: Client-Side Download Logic ---
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
      
      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: `Downloading ${filename}`,
        duration: 2000,
      });
    } catch (err) {
      toast({
        title: "Download Failed",
        description: "Could not generate file.",
        variant: "destructive",
      });
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

        {/* Toolbar */}
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

          <div className="hidden sm:flex items-center text-xs text-muted-foreground bg-white/5 px-3 py-2 rounded border border-white/10">
            <FileCode className="w-3 h-3 mr-2" /> 
            {getFileName(activeLanguage)}
          </div>

          {/* Download Button */}
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

          {/* Bottom Panel: Output */}
          <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col min-h-[100px] relative">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Console Output
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setOutput('// Output cleared.')}>
                <RefreshCw className="w-3 h-3"/>
              </Button>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar">
              <pre className={cn("whitespace-pre-wrap", output.includes('Error') ? "text-red-400" : "text-blue-300")}>
                {output}
              </pre>
            </div>

            {/* WATERMARK */}
            <div className="absolute bottom-2 right-3 pointer-events-none select-none z-50 flex items-center justify-end opacity-20">
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
