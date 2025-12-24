import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2, Play, RefreshCw, Code2, Home, Terminal as TerminalIcon, 
  Download, Lock, Square, Clock, RotateCcw, Zap, Settings, 
  Wifi, Activity, Cpu, Maximize2, Minimize2, Keyboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';

// --- PREMIUM CONFIGURATION ---

const LANGUAGES_CONFIG = [
  { id: 'python', name: 'Python', color: 'text-yellow-400', icon: '🐍' },
  { id: 'javascript', name: 'JavaScript', color: 'text-yellow-300', icon: '⚡' },
  { id: 'java', name: 'Java', color: 'text-red-400', icon: '☕' },
  { id: 'cpp', name: 'C++', color: 'text-blue-400', icon: '🚀' },
  { id: 'c', name: 'C', color: 'text-blue-300', icon: '🔧' },
  { id: 'sql', name: 'SQL', color: 'text-purple-400', icon: '🗄️' },
  { id: 'bash', name: 'Bash', color: 'text-green-400', icon: '💻' },
] as const;

// --- EXPANDED STARTER TEMPLATES ---

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
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Refs for timing
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS ---
  const { 
    runCode: runPython, 
    output: pythonOutput, 
    isRunning: pythonRunning, 
    isReady: pythonReady, 
    isWaitingForInput: pythonWaitingForInput, 
    writeInputToWorker: writePythonInput, 
    stopExecution: stopPython, 
    hasSharedArrayBuffer
  } = usePyodide();

  const {
    runCode: runJS, 
    output: jsOutput, 
    isRunning: jsRunning, 
    isWaitingForInput: jsWaitingForInput, 
    writeInput: writeJSInput, 
    stopExecution: stopJS,
  } = useJavaScriptRunner();

  const {
    runCode: runInteractive, 
    output: interactiveOutput, 
    isRunning: interactiveRunning, 
    isWaitingForInput: interactiveWaitingForInput, 
    writeInput: writeInteractiveInput, 
    stopExecution: stopInteractive,
  } = useInteractiveRunner(activeLanguage);

  const isPython = activeLanguage === 'python';
  const isJavaScript = activeLanguage === 'javascript';
  
  // Unified Runner State
  const getCurrentRunnerState = useCallback(() => {
    if (isPython) {
      return { output: pythonOutput, isRunning: pythonRunning, isWaitingForInput: pythonWaitingForInput, isReady: pythonReady };
    } else if (isJavaScript) {
      return { output: jsOutput, isRunning: jsRunning, isWaitingForInput: jsWaitingForInput, isReady: true };
    } else {
      return { output: interactiveOutput, isRunning: interactiveRunning, isWaitingForInput: interactiveWaitingForInput, isReady: true };
    }
  }, [isPython, isJavaScript, pythonOutput, pythonRunning, pythonWaitingForInput, pythonReady, jsOutput, jsRunning, jsWaitingForInput, interactiveOutput, interactiveRunning, interactiveWaitingForInput]);

  const runnerState = getCurrentRunnerState();
  const isLoading = runnerState.isRunning || (isPython && !pythonReady);
  const isExecuting = runnerState.isRunning;

  // --- EFFECTS ---

  // Timer Logic
  useEffect(() => {
    if (isExecuting && executionStartRef.current === null) {
      executionStartRef.current = Date.now();
      timerIntervalRef.current = setInterval(() => {
        if (executionStartRef.current) {
          setExecutionTime(Date.now() - executionStartRef.current);
        }
      }, 50); // High precision update
    } else if (!isExecuting && executionStartRef.current !== null) {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      executionStartRef.current = null;
    }
    
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isExecuting]);

  // Fetch Locked Languages
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

  // Persist Code & Language
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
    toast({ 
      title: "System Reset", 
      description: "Codebase reverted to default operational parameters.",
      className: "bg-[#0c0c0e] border border-white/10 text-white"
    });
  };

  const handleRun = async () => {
    if (isLoading) return;
    
    if (lockedLanguages[activeLanguage]) {
        toast({ title: "Access Denied", description: "Language module locked.", variant: "destructive" });
        return;
    }

    setExecutionTime(null);
    executionStartRef.current = Date.now();

    if (isPython) {
      runPython(code);
    } else if (isJavaScript) {
      runJS(code);
    } else {
      runInteractive(code);
    }
  };

  const handleStop = () => {
    if (isPython) {
      stopPython();
    } else if (isJavaScript) {
      stopJS();
    } else {
      stopInteractive();
    }
    toast({ title: "Sequence Aborted", description: "Execution terminated manually.", variant: "destructive" });
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
      toast({ title: "Archive Saved", description: `${filename} downloaded successfully.` });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate file archive.", variant: "destructive" });
    }
  };

  const handleTerminalInput = useCallback((char: string) => {
    if (isPython) {
      writePythonInput(char);
    } else if (isJavaScript) {
      writeJSInput(char);
    } else {
      writeInteractiveInput(char);
    }
  }, [isPython, isJavaScript, writePythonInput, writeJSInput, writeInteractiveInput]);

  const handleClearTerminal = () => {
    if (!isExecuting) {
      if (isPython) {
        runPython(''); // Empty run to clear
      } else if (isJavaScript) {
        runJS('');
      } else {
        runInteractive('');
      }
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        setIsFullScreen(true);
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    }
  };

  const activeLangConfig = LANGUAGES_CONFIG.find(l => l.id === activeLanguage);

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white overflow-hidden font-sans selection:bg-primary/30 relative">
      
      {/* --- AMBIENT BACKGROUND FX --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] animate-pulse" />
         <div className="absolute bottom-[-20%] right-[10%] w-[600px] h-[600px] bg-purple-600/5 rounded-full blur-[150px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      </div>

      {/* --- HEADER: GLASS COCKPIT --- */}
      <header className="relative z-50 h-16 shrink-0 border-b border-white/5 bg-[#050505]/80 backdrop-blur-xl flex items-center justify-between px-6 shadow-2xl">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:text-white text-zinc-400 transition-all group">
            <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </Button>
          
          <div className="hidden md:flex items-center gap-3">
             <div className="h-8 w-px bg-white/10 mx-2" />
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 tracking-[0.2em] uppercase font-neuropol">Codevo // IDE</span>
                <div className="flex items-center gap-2">
                   <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", isExecuting ? "bg-green-500" : "bg-blue-500")} />
                   <span className="text-xs font-mono text-zinc-300">
                     {isExecuting ? 'SYSTEM ACTIVE' : 'SYSTEM READY'}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Central Command Cluster */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 p-1 rounded-full bg-[#0a0a0c] border border-white/10 shadow-inner">
           <Select value={activeLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="h-9 min-w-[140px] bg-transparent border-none text-xs font-bold text-white focus:ring-0 hover:bg-white/5 rounded-full transition-colors">
              <div className="flex items-center gap-2">
                <span className="text-sm">{activeLangConfig?.icon}</span>
                <span className="mb-0.5"><SelectValue /></span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#0c0c0e] border-white/10 text-white rounded-xl backdrop-blur-xl">
              {LANGUAGES_CONFIG.map((lang) => (
                <SelectItem 
                  key={lang.id} 
                  value={lang.id} 
                  disabled={lockedLanguages[lang.id]}
                  className="text-xs font-medium focus:bg-white/10 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.icon}</span>
                    <span className={cn(lang.color)}>{lang.name}</span>
                    {lockedLanguages[lang.id] && <Lock className="w-3 h-3 text-red-500 ml-auto" />}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="h-4 w-px bg-white/10" />

          {/* Timer Widget */}
          <div className="flex items-center gap-2 px-3">
             <Clock className={cn("w-3.5 h-3.5", isExecuting ? "text-green-400 animate-pulse" : "text-zinc-600")} />
             <span className="font-mono text-xs text-zinc-400 tabular-nums min-w-[40px]">
               {isExecuting ? formatTime(executionTime || 0) : executionTime !== null ? formatTime(executionTime) : '0.00s'}
             </span>
          </div>
        </div>

        {/* Right Action Deck */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/5">
             <Button onClick={handleReset} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-md hover:bg-white/10" title="Reset Code">
                <RotateCcw className="w-3.5 h-3.5" />
             </Button>
             <Button onClick={handleDownload} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-md hover:bg-white/10" title="Download Source">
                <Download className="w-3.5 h-3.5" />
             </Button>
             <Button onClick={toggleFullScreen} variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white rounded-md hover:bg-white/10 hidden sm:flex" title="Toggle Fullscreen">
                {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
             </Button>
          </div>

          <div className="h-8 w-px bg-white/10 hidden sm:block" />

          {isExecuting ? (
            <Button 
              onClick={handleStop}
              className="h-9 px-5 bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500/20 font-bold text-xs tracking-wide shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] animate-pulse"
            >
              <Square className="w-3.5 h-3.5 mr-2 fill-current" /> ABORT
            </Button>
          ) : (
            <Button 
              onClick={handleRun} 
              disabled={isLoading || lockedLanguages[activeLanguage]} 
              className={cn(
                "group relative h-9 px-6 font-bold text-xs tracking-wide overflow-hidden transition-all",
                isLoading ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" : "bg-white text-black hover:scale-105 shadow-[0_0_20px_-5px_rgba(255,255,255,0.5)]"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500 z-0" />
              <div className="relative z-10 flex items-center gap-2">
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                {isLoading ? "INITIALIZING..." : "EXECUTE"}
              </div>
            </Button>
          )}
        </div>
      </header>

      {/* --- WORKSPACE --- */}
      <div className="flex-1 overflow-hidden relative z-10 p-2 md:p-4">
        <div className="h-full w-full rounded-2xl border border-white/10 bg-[#0a0a0c]/80 backdrop-blur-md overflow-hidden shadow-2xl flex flex-col relative">
          
          {/* Decorative Corner Borders */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-primary/50 rounded-tl-xl pointer-events-none z-20" />
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-primary/50 rounded-tr-xl pointer-events-none z-20" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-primary/50 rounded-bl-xl pointer-events-none z-20" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-primary/50 rounded-br-xl pointer-events-none z-20" />

          <ResizablePanelGroup direction="vertical" className="h-full">
            
            {/* EDITOR PANEL */}
            <ResizablePanel defaultSize={isMobile ? 60 : 70} minSize={30} className="bg-[#09090b] relative group">
              <div className="absolute top-0 right-4 z-10 px-3 py-1 bg-[#0c0c0e] rounded-b-lg border border-t-0 border-white/10 text-[10px] font-mono text-zinc-500 flex items-center gap-2 shadow-xl transform -translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                 <Settings className="w-3 h-3 hover:text-white cursor-pointer" /> Editor Config
              </div>
              <CodeEditor 
                value={code} 
                onChange={setCode} 
                language={activeLanguage}
              />
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-[#050505] border-t border-b border-white/5 h-1.5 hover:bg-primary/50 transition-colors" />

            {/* TERMINAL PANEL */}
            <ResizablePanel defaultSize={isMobile ? 40 : 30} minSize={15} className="bg-[#08080a] flex flex-col min-h-[100px] relative">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 h-10 border-b border-white/5 bg-[#0a0a0c] shrink-0">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                    <TerminalIcon className="w-3.5 h-3.5 text-primary" /> 
                    Output Console
                  </div>
                  {isPython && !hasSharedArrayBuffer && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold text-amber-500 uppercase">
                      Restricted Mode
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isExecuting && (
                    <div className="flex items-center gap-2 px-2 py-0.5 rounded bg-green-500/5 border border-green-500/10">
                      <Zap className="w-3 h-3 text-green-400 fill-green-400 animate-pulse" />
                      <span className="text-[9px] font-bold text-green-400 tracking-wider">
                        {runnerState.isWaitingForInput ? 'AWAITING INPUT' : 'PROCESSING'}
                      </span>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleClearTerminal}
                    disabled={isExecuting}
                    className="p-1.5 rounded-md hover:bg-white/5 text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                    title="Clear Log"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              {/* Terminal Body */}
              <div className="flex-1 relative bg-[#050505] overflow-hidden">
                <div className="absolute inset-0 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 z-0" />
                {isPython && !pythonReady ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-4 z-10">
                    <div className="relative">
                       <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 animate-pulse" />
                       <Loader2 className="w-10 h-10 animate-spin text-blue-500 relative z-10" />
                    </div>
                    <div className="text-center space-y-1">
                       <p className="text-xs font-bold tracking-widest uppercase text-white">Initializing Environment</p>
                       <p className="text-[10px] font-mono">Loading Python Kernel...</p>
                    </div>
                  </div>
                ) : (
                  <TerminalView 
                    output={runnerState.output} 
                    onInput={handleTerminalInput}
                    isWaitingForInput={runnerState.isWaitingForInput}
                    language={activeLanguage}
                    isRunning={runnerState.isRunning}
                  />
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>

      {/* --- STATUS FOOTER --- */}
      <footer className="h-7 bg-[#08080a] border-t border-white/5 flex items-center justify-between px-4 shrink-0 text-[10px] font-mono text-zinc-500 select-none">
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help">
               <Wifi className="w-3 h-3 text-green-500" />
               <span>CONNECTED</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help">
               <Activity className="w-3 h-3 text-blue-500" />
               <span>LATENCY: 24ms</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-help hidden sm:flex">
               <Cpu className="w-3 h-3 text-purple-500" />
               <span>WORKER: {isPython ? 'PYODIDE' : isJavaScript ? 'V8' : 'PISTON'}</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <span className="hidden sm:inline">Ln 1, Col 1</span>
            <span className="hidden sm:inline">UTF-8</span>
            <span className="flex items-center gap-1.5 text-zinc-300">
               {activeLangConfig?.icon}
               <span className={cn(activeLangConfig?.color)}>{activeLangConfig?.name}</span>
            </span>
         </div>
      </footer>

    </div>
  );
};

export default Compiler;
