import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from '@/components/CodeEditor';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { explainCodeWithGroq } from '@/services/groq'; // Make sure you created Step 2!
import { Loader2, Play, RefreshCw, Code2, FileCode, Home, Terminal, Download, Sparkles, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper Functions
const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}';
    case 'cpp': return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}';
    case 'c': return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}';
    case 'javascript': return 'console.log("Hello, World!");';
    case 'sql': return '-- SQL Query\nCREATE TABLE demo (id INTEGER, message TEXT);\nINSERT INTO demo VALUES (1, "Hello World");\nSELECT * FROM demo;';
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

  // AI & UI State
  const [isExplaining, setIsExplaining] = useState(false);
  const [explanation, setExplanation] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setOutput('// Language changed. Output cleared.');
  };

  const handleRun = async () => {
    if (loading) return;
    setOutput('Running...');
    
    const result = await executeCode(activeLanguage, code, "");
    
    if (result.success) {
      setOutput(result.output);
    } else {
      setOutput(result.error || "An unknown error occurred.");
    }
  };

  // The AI Logic
  const handleExplain = async () => {
    if (!code.trim()) return;
    
    setIsExplaining(true);
    setIsDialogOpen(true);
    setExplanation(""); 

    try {
      const contextOutput = output.includes("//") ? "No output yet" : output;
      const result = await explainCodeWithGroq(code, contextOutput, activeLanguage);
      setExplanation(result);
    } catch (error: any) {
      setExplanation("Failed to connect to AI Tutor.");
    } finally {
      setIsExplaining(false);
    }
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
      toast({ title: "Downloaded", description: filename });
    } catch (err) {
      toast({ title: "Error", description: "Download failed.", variant: "destructive" });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#09090b] text-white overflow-hidden">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0c0e] px-4 py-3 flex items-center justify-between shrink-0 h-16">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-white hover:bg-white/10">
            <Home className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Terminal className="w-4 h-4 text-purple-400" />
            <h1 className="text-sm font-bold tracking-tight text-purple-400">CodeVo Compiler</h1>
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

          {/* AI Explain Button */}
          <Button 
            onClick={handleExplain} 
            variant="secondary"
            size="sm" 
            className="h-9 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Explain</span>
          </Button>

          <Button onClick={handleDownload} variant="outline" size="sm" className="h-9 border-white/10 bg-white/5 hover:bg-white/10 text-white">
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>

          <Button onClick={handleRun} disabled={loading} size="sm" className="h-9 bg-green-600 hover:bg-green-500 text-white px-6 font-bold">
            {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <><Play className="w-4 h-4 mr-2 fill-current"/> Run</>}
          </Button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={70} className="bg-[#09090b]">
            <CodeEditor value={code} onChange={setCode} language={activeLanguage} />
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-black border-t border-b border-white/10 h-2 hover:bg-purple-500/20 transition-colors" />
          <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col min-h-[100px]">
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-3 h-3" /> Console Output
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setOutput('// Output cleared.')}>
                <RefreshCw className="w-3 h-3"/>
              </Button>
            </div>
            <div className="flex-1 p-4 font-mono text-sm overflow-auto custom-scrollbar">
              <pre className={cn("whitespace-pre-wrap", output.includes('Error') ? "text-red-400" : "text-blue-300")}>{output}</pre>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* AI Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-400">
              <Bot className="w-6 h-6" /> AI Tutor
            </DialogTitle>
            <DialogDescription>Analyzing your code logic...</DialogDescription>
          </DialogHeader>
          <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 min-h-[100px] max-h-[400px] overflow-y-auto">
            {isExplaining ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-sm animate-pulse">Thinking...</p>
              </div>
            ) : (
              <div className="prose prose-invert prose-sm text-gray-300 whitespace-pre-wrap">{explanation}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compiler;
