import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from '@/components/CodeEditor';
import { Language } from '@/hooks/useCodeRunner';
import { usePyodide } from '@/hooks/usePyodide';
import { useJavaScriptRunner } from '@/hooks/useJavaScriptRunner';
import { useInteractiveRunner } from '@/hooks/useInteractiveRunner';
import { TerminalView } from '@/components/TerminalView';
import { 
  Loader2, Play, RefreshCw, Terminal as TerminalIcon, 
  Download, Lock, Square, Clock, Plus, Minus, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

// --- PREMIUM CONFIGURATION WITH REAL LOGOS (PRESERVED) ---

const LANGUAGES_CONFIG = [
  { 
    id: 'python', 
    name: 'Python', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    color: 'text-blue-400',
    gradient: 'from-blue-400/20 to-yellow-400/20'
  },
  { 
    id: 'javascript', 
    name: 'JavaScript', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    color: 'text-yellow-300',
    gradient: 'from-yellow-300/20 to-orange-500/20'
  },
  { 
    id: 'java', 
    name: 'Java', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    color: 'text-red-400',
    gradient: 'from-red-400/20 to-orange-500/20'
  },
  { 
    id: 'cpp', 
    name: 'C++', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  { 
    id: 'c', 
    name: 'C', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    color: 'text-blue-400',
    gradient: 'from-blue-400/20 to-indigo-500/20'
  },
  { 
    id: 'sql', 
    name: 'SQL', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg',
    color: 'text-purple-400',
    gradient: 'from-purple-400/20 to-pink-500/20'
  },
  { 
    id: 'bash', 
    name: 'Bash', 
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg',
    color: 'text-zinc-300',
    gradient: 'from-zinc-500/20 to-zinc-300/20'
  },
] as const;

// --- EXPANDED STARTER TEMPLATES (PRESERVED) ---

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': 
      return `import java.util.*;
import java.io.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        // --- MISSION START ---
        System.out.println(">> JAVA RUNTIME ENVIRONMENT ACTIVE");
        System.out.print(">> Enter Agent Name: ");
        
        String name = sc.nextLine();
        
        System.out.println(">> Authenticating " + name + "...");
        System.out.println(">> Access Granted.");
        
        // Your logic here
        
        sc.close();
    }
}`;
    case 'cpp': 
      return `#include <iostream>
#include <string>
#include <vector>
#include <algorithm>

using namespace std;

int main() {
    // --- C++ OPTIMIZED CORE ---
    string input_data;
    
    cout << ">> SYSTEM INITIALIZED." << endl;
    cout << ">> Awaiting Input Command: ";
    
    getline(cin, input_data);
    
    cout << ">> Processing: " << input_data << endl;
    cout << ">> Execution Complete." << endl;
    
    return 0;
}`;
    case 'c': 
      return `#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char buffer[100];
    
    printf(">> C KERNEL LOADED.\\n");
    printf(">> Enter command sequence: ");
    
    fgets(buffer, 100, stdin);
    // Remove newline
    buffer[strcspn(buffer, "\\n")] = 0; 
    
    printf(">> Received: %s\\n", buffer);
    printf(">> Memory cleared.\\n");
    
    return 0;
}`;
    case 'javascript': 
      return `// --- JAVASCRIPT ASYNC RUNTIME ---

console.log(">> V8 ENGINE ONLINE");

// Interactive Input Wrapper
const userInput = await prompt(">> Enter system parameters: ");

console.log(\`>> Analyzing \${userInput}...\`);

const metrics = [
  { id: 1, status: 'OK' },
  { id: 2, status: 'OPTIMIZED' }
];

console.table(metrics);
console.log(">> Process terminated.");`;
    case 'sql': 
      return `-- --- SQL DATA MATRIX ---

-- 1. Initialize Schema
CREATE TABLE missions (
    id INTEGER PRIMARY KEY,
    codename TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    priority INTEGER
);

-- 2. Inject Data
INSERT INTO missions (codename, status, priority) VALUES 
    ('PROJECT_GENESIS', 'ACTIVE', 1),
    ('OPERATION_NIGHTFALL', 'COMPLETED', 2),
    ('PROTOCOL_OMEGA', 'CLASSIFIED', 5);

-- 3. Query Matrix
SELECT * FROM missions 
WHERE priority <= 2
ORDER BY priority ASC;`;
    case 'bash': 
      return `#!/bin/bash

echo ">> BASH SHELL ACCESS GRANTED"
echo ">> Current User: $USER"

read -p ">> Enter target directory: " target

if [ -z "$target" ]; then
    echo ">> No target specified. Defaulting to root."
else
    echo ">> Navigating to $target..."
fi

echo ">> Script execution finished."`;
    default: 
      return `# --- PYTHON 3 NEURAL INTERFACE ---
import time
import sys

def boot_system():
    print(">> LOADING KERNEL MODULES...")
    time.sleep(0.5)
    print(">> READY.")

boot_system()

# Interactive Input
user_cmd = input(">> Enter Python Expression: ")

try:
    result = eval(user_cmd)
    print(f">> Result: {result}")
except Exception as e:
    print(f">> Error: {e}")

print(">> Session Closed.")`;
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

const formatTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  const seconds = (ms / 1000).toFixed(2);
  return `${seconds}s`;
};

// --- MAIN COMPONENT ---

const Compiler = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  // --- STATE ---
  const [activeLanguage, setActiveLanguage] = useState<Language>(() => {
    return (localStorage.getItem('codevo-lang') as Language) || 'python';
  });
  
  const [code, setCode] = useState<string>(() => {
    return localStorage.getItem('codevo-code') || getStarterTemplate('python');
  });

  const [lockedLanguages, setLockedLanguages] = useState<Record<string, boolean>>({});
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  
  // Design State
  const [fontSizeLeft, setFontSizeLeft] = useState(14);
  const [fontSizeRight, setFontSizeRight] = useState(14);
  const [isReady, setIsReady] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS ---
  const { 
    runCode: runPython, output: pythonOutput, isRunning: pythonRunning, 
    isReady: pythonReady, isWaitingForInput: pythonWaitingForInput, 
    writeInputToWorker: writePythonInput, stopExecution: stopPython, hasSharedArrayBuffer
  } = usePyodide();

  const {
    runCode: runJS, output: jsOutput, isRunning: jsRunning, 
    isWaitingForInput: jsWaitingForInput, writeInput: writeJSInput, stopExecution: stopJS,
  } = useJavaScriptRunner();

  const {
    runCode: runInteractive, output: interactiveOutput, isRunning: interactiveRunning, 
    isWaitingForInput: interactiveWaitingForInput, writeInput: writeInteractiveInput, stopExecution: stopInteractive,
  } = useInteractiveRunner(activeLanguage);

  const isPython = activeLanguage === 'python';
  const isJavaScript = activeLanguage === 'javascript';
  
  const getCurrentRunnerState = useCallback(() => {
    if (isPython) return { output: pythonOutput, isRunning: pythonRunning, isWaitingForInput: pythonWaitingForInput, isReady: pythonReady };
    else if (isJavaScript) return { output: jsOutput, isRunning: jsRunning, isWaitingForInput: jsWaitingForInput, isReady: true };
    else return { output: interactiveOutput, isRunning: interactiveRunning, isWaitingForInput: interactiveWaitingForInput, isReady: true };
  }, [isPython, isJavaScript, pythonOutput, pythonRunning, pythonWaitingForInput, pythonReady, jsOutput, jsRunning, jsWaitingForInput, interactiveOutput, interactiveRunning, interactiveWaitingForInput]);

  const runnerState = getCurrentRunnerState();
  const isLoading = runnerState.isRunning || (isPython && !pythonReady);
  const isExecuting = runnerState.isRunning;

  // --- EFFECTS ---
  
  // Design Ready Effect
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) setExecutionTime(Date.now() - executionStartRef.current);
      }, 50);
    } else if (!isExecuting && executionStartRef.current !== null) {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      executionStartRef.current = null;
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [isExecuting]);

  useEffect(() => {
    supabase.from('languages').select('id, is_locked').then(({ data, error }) => {
      if (!error && data) {
        const statusMap: Record<string, boolean> = {};
        data.forEach((lang: any) => statusMap[lang.id] = lang.is_locked);
        setLockedLanguages(statusMap);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('codevo-code', code);
    localStorage.setItem('codevo-lang', activeLanguage);
  }, [code, activeLanguage]);

  // --- HANDLERS ---
  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    if (lockedLanguages[newLang]) {
        toast({ title: "Module Locked", description: "This language protocol is currently disabled.", variant: "destructive" });
        return;
    }
    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
    setExecutionTime(null);
  };

  const handleReset = () => {
    setCode(getStarterTemplate(activeLanguage));
    setExecutionTime(null);
    toast({ title: "System Reset", description: "Codebase reverted.", className: "bg-[#0c0c0e] border border-white/10 text-white" });
  };

  const handleRun = async () => {
    if (isLoading) return;
    if (lockedLanguages[activeLanguage]) { toast({ title: "Access Denied", description: "Language locked.", variant: "destructive" }); return; }
    setExecutionTime(null);
    executionStartRef.current = Date.now();
    if (isPython) runPython(code);
    else if (isJavaScript) runJS(code);
    else runInteractive(code);
  };

  const handleStop = () => {
    if (isPython) stopPython(); else if (isJavaScript) stopJS(); else stopInteractive();
    toast({ title: "Sequence Aborted", description: "Execution terminated.", variant: "destructive" });
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
      toast({ title: "Archive Saved", description: `${filename} downloaded.` });
    } catch { toast({ title: "Error", description: "Download failed.", variant: "destructive" }); }
  };

  const handleTerminalInput = useCallback((char: string) => {
    if (isPython) writePythonInput(char);
    else if (isJavaScript) writeJSInput(char);
    else writeInteractiveInput(char);
  }, [isPython, isJavaScript, writePythonInput, writeJSInput, writeInteractiveInput]);

  const handleClearTerminal = () => {
    if (!isExecuting) {
      if (isPython) runPython(''); else if (isJavaScript) runJS(''); else runInteractive('');
    }
  };

  // Zoom Handler
  const handleZoom = (side: 'left' | 'right', delta: number) => {
    if (side === 'left') {
      setFontSizeLeft(prev => Math.max(10, Math.min(32, prev + delta)));
    } else {
      setFontSizeRight(prev => Math.max(10, Math.min(32, prev + delta)));
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
        setIsFullScreen(false);
    }
  };

  const activeLangConfig = LANGUAGES_CONFIG.find(l => l.id === activeLanguage) || LANGUAGES_CONFIG[0];

  // --- RENDER (Nexus Design with Codevo branding) ---
  return (
    <div className="h-screen w-full bg-[#050505] text-[#e0e0e0] font-sans flex flex-col overflow-hidden selection:bg-white/20">
      
      {/* HEADER */}
      <header className="h-[60px] flex items-center justify-between px-6 border-b border-white/10 bg-[#050505] z-50 relative shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[#666666] hover:text-white transition-colors duration-300">
            {/* USER REQUESTED HOME ICON */}
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
               <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
            </svg>
          </Link>
        </div>
        
        {/* BRANDING: "Codevo" (e is small, no uppercase) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="font-neuropol text-2xl tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Codevo
          </span>
        </div>

        <div className="flex items-center gap-3">
           <button onClick={toggleFullScreen} className="text-[#666] hover:text-white transition-colors" title="Toggle Fullscreen">
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
           </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <div className="flex-1 flex relative bg-[#0a0a0a] overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
          
          {/* EDITOR COLUMN */}
          <ResizablePanel defaultSize={60} minSize={30} className="bg-[#050505] flex flex-col">
            
            {/* Toolbar */}
            <div className="h-[48px] px-4 flex items-center justify-between bg-[#080808] border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3">
                <img src={activeLangConfig.logo} alt={activeLangConfig.name} className="w-4 h-4 opacity-80" />
                
                <div className="relative group">
                  <select 
                    value={activeLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="bg-transparent border border-white/10 text-[10px] text-[#e0e0e0] font-mono py-1 px-2 pr-6 appearance-none cursor-pointer hover:border-white/20 focus:outline-none transition-colors uppercase tracking-wider rounded-sm"
                  >
                    {LANGUAGES_CONFIG.map(lang => (
                      <option key={lang.id} value={lang.id} disabled={lockedLanguages[lang.id]} className="bg-[#080808] text-gray-300">
                        {lang.name} {lockedLanguages[lang.id] ? '(LOCKED)' : ''}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                    <span className="text-[8px] text-[#666]">▼</span>
                  </div>
                </div>

                <div className="h-4 w-[1px] bg-white/10 mx-1" />
                <span className="font-mono text-[10px] text-[#666666] flex items-center gap-2">
                  {isExecuting ? (
                    <>
                      <Clock className="w-3 h-3 text-yellow-500 animate-spin" />
                      <span className="text-yellow-500">{formatTime(executionTime || 0)}</span>
                    </>
                  ) : (
                    <span>{executionTime ? formatTime(executionTime) : '0.00s'}</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center border border-white/10 rounded overflow-hidden mr-2">
                  <button onClick={() => handleZoom('left', -1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <button onClick={() => handleZoom('left', 1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button 
                  onClick={handleReset}
                  className="p-1.5 text-[#666] hover:text-white hover:bg-white/5 rounded transition-all" 
                  title="Reset Code"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-hidden relative">
              <CodeEditor 
                value={code}
                onChange={setCode}
                language={activeLanguage}
                fontSize={fontSizeLeft}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-[#050505] border-x border-white/5 hover:bg-white/10 transition-colors" />

          {/* TERMINAL COLUMN */}
          <ResizablePanel defaultSize={40} minSize={20} className="bg-[#050505] flex flex-col">
            
            {/* Toolbar */}
            <div className="h-[48px] px-4 flex items-center justify-between bg-[#080808] border-b border-white/10 shrink-0">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#666666] flex items-center gap-2">
                <TerminalIcon className="w-3 h-3" /> Display Console
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center border border-white/10 rounded overflow-hidden">
                  <button onClick={() => handleZoom('right', -1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                    <Minus className="w-3 h-3" />
                  </button>
                  <div className="w-[1px] h-3 bg-white/10" />
                  <button onClick={() => handleZoom('right', 1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button 
                  onClick={handleDownload}
                  className="p-1.5 text-[#666] hover:text-white hover:bg-white/5 rounded transition-all" 
                  title="Download Source"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {isExecuting ? (
                  <Button 
                    onClick={handleStop}
                    className="h-7 rounded-none bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-[10px] uppercase tracking-widest px-4"
                  >
                    <Square className="w-3 h-3 mr-2 fill-current" /> Terminate
                  </Button>
                ) : (
                  <Button 
                    onClick={handleRun}
                    disabled={isLoading}
                    className="h-7 rounded-none bg-white text-black hover:bg-gray-200 border-none font-bold text-[10px] uppercase tracking-widest px-4"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2 fill-current" />}
                    Execute
                  </Button>
                )}
              </div>
            </div>

            {/* Terminal Area */}
            <div className="flex-1 bg-[#010409] relative overflow-hidden flex flex-col">
              {isPython && !pythonReady ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666] gap-4">
                  <Loader2 className="w-6 h-6 animate-spin text-white/20" />
                  <span className="text-[10px] uppercase tracking-widest">Initializing Kernel...</span>
                </div>
              ) : (
                <>
                  <div className="p-2 border-b border-white/5 bg-[#010409]">
                    <div className="flex items-center gap-2 text-green-500/80 mb-1 font-mono text-[10px]">
                      <span>[SYSTEM]</span>
                      <span className="text-[#666]">Local Node Ready.</span>
                    </div>
                    {isReady && (
                      <div className="flex items-center gap-2 text-green-500/80 animate-in fade-in slide-in-from-left-2 duration-500 font-mono text-[10px]">
                        <span>[SYSTEM]</span>
                        <span className="text-[#666]">Handshake latency: 12ms</span>
                      </div>
                    )}
                  </div>
                  <TerminalView 
                    output={runnerState.output} 
                    onInput={handleTerminalInput}
                    isWaitingForInput={runnerState.isWaitingForInput}
                    language={activeLanguage}
                    isRunning={runnerState.isRunning}
                    fontSize={fontSizeRight}
                  />
                </>
              )}
            </div>

          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* FOOTER */}
      <footer className="h-[32px] border-t border-white/10 bg-[#050505] flex items-center justify-between px-6 text-[9px] text-[#666] uppercase tracking-widest shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn("w-1 h-1 rounded-full shadow-[0_0_6px]", isReady ? "bg-[#3fb950] shadow-[#3fb950]" : "bg-yellow-500 shadow-yellow-500")} />
          <span>{isReady ? "Connected / encrypted_v2" : "Initializing..."}</span>
        </div>
        <div>Codevo 2025</div>
      </footer>

    </div>
  );
};

export default Compiler;
