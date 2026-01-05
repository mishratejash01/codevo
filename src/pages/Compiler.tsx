import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { Language } from '@/hooks/useCodeRunner';
import { usePyodide } from '@/hooks/usePyodide';
import { useJavaScriptRunner } from '@/hooks/useJavaScriptRunner';
import { useInteractiveRunner } from '@/hooks/useInteractiveRunner';
import { TerminalView } from '@/components/TerminalView';
import { 
  Loader2, Play, RefreshCw, Terminal as TerminalIcon, 
  Download, Square, Clock, Plus, Minus, Maximize2, Minimize2, 
  ChevronUp, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from '@/hooks/use-mobile';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIGURATION (PRESERVED) ---

const LANGUAGES_CONFIG = [
  { id: 'python', name: 'Python', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg' },
  { id: 'javascript', name: 'JavaScript', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
  { id: 'java', name: 'Java', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg' },
  { id: 'cpp', name: 'C++', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
  { id: 'c', name: 'C', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg' },
  { id: 'sql', name: 'SQL', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
  { id: 'bash', name: 'Bash', logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg' },
] as const;

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return `import java.util.*;\nimport java.io.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(">> JAVA RUNTIME ACTIVE");\n    }\n}`;
    case 'cpp': return `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << ">> SYSTEM INITIALIZED." << endl;\n    return 0;\n}`;
    case 'c': return `#include <stdio.h>\n\nint main() {\n    printf(">> C KERNEL LOADED.\\n");\n    return 0;\n}`;
    case 'javascript': return `console.log(">> V8 ENGINE ONLINE");`;
    case 'sql': return `SELECT 'SQL MATRIX ACTIVE' as status;`;
    case 'bash': return `echo ">> BASH SHELL ACTIVE"`;
    default: return `print(">> PYTHON NEURAL INTERFACE READY")\n\n# Try writing code here`;
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
  
  // Mobile Console State
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  
  const executionStartRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // --- CODE RUNNERS ---
  const { 
    runCode: runPython, output: pythonOutput, isRunning: pythonRunning, 
    isReady: pythonReady, isWaitingForInput: pythonWaitingForInput, 
    writeInputToWorker: writePythonInput, stopExecution: stopPython,
    initError: pythonInitError, retryInit: retryPythonInit
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

  // Auto-expand console on execution (Mobile)
  useEffect(() => {
    if (isExecuting && isMobile) {
      setIsConsoleOpen(true);
    }
  }, [isExecuting, isMobile]);

  // --- EFFECTS ---
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

  const EditorComponent = (
    <div className="flex-1 flex flex-col h-full bg-[#050505]">
       {/* Toolbar */}
       <div className="h-[48px] px-4 flex items-center justify-between bg-[#080808] border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <img src={activeLangConfig.logo} alt={activeLangConfig.name} className="w-4 h-4 opacity-80" />
            
            <div className="relative group">
              <select 
                value={activeLanguage}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-transparent border border-white/10 text-[10px] text-[#e0e0e0] font-mono py-1 px-2 pr-6 appearance-none cursor-pointer hover:border-white/20 focus:outline-none transition-colors uppercase tracking-wider rounded-sm max-w-[120px] sm:max-w-none"
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

            {!isMobile && (
              <>
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
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isMobile && (
              <div className="flex items-center border border-white/10 rounded overflow-hidden mr-2">
                <button onClick={() => handleZoom('left', -1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                  <Minus className="w-3 h-3" />
                </button>
                <div className="w-[1px] h-3 bg-white/10" />
                <button onClick={() => handleZoom('left', 1)} className="w-6 h-6 flex items-center justify-center text-[#666] hover:text-white hover:bg-white/5 transition-colors">
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            )}

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
    </div>
  );

  const TerminalComponent = (
    <div className="flex-1 flex flex-col h-full bg-[#050505]">
       {/* Desktop Toolbar */}
       {!isMobile && (
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
       )}

       {/* Terminal Area */}
       <div className="flex-1 bg-[#010409] relative overflow-hidden flex flex-col">
          {isPython && pythonInitError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666] gap-4 p-6">
              <div className="text-red-400 text-center">
                <span className="text-2xl mb-2 block">⚠️</span>
                <span className="text-[11px] uppercase tracking-widest block mb-4">Kernel Error</span>
                <p className="text-[10px] text-[#888] mb-4 max-w-xs">{pythonInitError}</p>
              </div>
              <Button 
                onClick={retryPythonInit}
                className="h-8 bg-white/10 text-white hover:bg-white/20 text-[10px] uppercase tracking-wider"
              >
                <RefreshCw className="w-3 h-3 mr-2" /> Retry Kernel
              </Button>
            </div>
          ) : isPython && !pythonReady ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#666] gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-white/20" />
              <span className="text-[10px] uppercase tracking-widest">Initializing Python...</span>
              <span className="text-[9px] text-[#555]">This may take a few seconds</span>
            </div>
          ) : (
            <TerminalView 
              output={runnerState.output} 
              onInput={handleTerminalInput}
              isWaitingForInput={runnerState.isWaitingForInput}
              language={activeLanguage}
              isRunning={runnerState.isRunning}
              fontSize={fontSizeRight}
            />
          )}
       </div>
    </div>
  );

  // --- RENDER ---
  return (
    <div className="h-screen w-full bg-[#050505] text-[#e0e0e0] font-sans flex flex-col overflow-hidden selection:bg-white/20">
      
      {/* HEADER */}
      <header className="h-[60px] flex items-center justify-between px-4 md:px-6 border-b border-white/10 bg-[#050505] z-50 relative shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[#666666] hover:text-white transition-colors duration-300">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
               <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z"/>
            </svg>
          </Link>
        </div>
        
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="font-neuropol text-xl md:text-2xl tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            CODéVO
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
        {isMobile ? (
          // --- MOBILE LAYOUT ---
          <div className="w-full h-full flex flex-col relative">
             {/* Editor takes remaining space above the console handle */}
             <div className="flex-1 relative pb-[60px]"> 
                {EditorComponent}
             </div>
             
             {/* Sliding Console Panel */}
             <motion.div 
                initial={false}
                animate={{ height: isConsoleOpen ? '60%' : '60px' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-[#080808] border-t border-white/10 z-20 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
             >
                {/* Panel Handle / Toolbar */}
                <div 
                   className="h-[60px] px-4 flex items-center justify-between bg-[#121212] shrink-0 cursor-pointer"
                   onClick={() => setIsConsoleOpen(!isConsoleOpen)} // Clicking the bar toggles it
                >
                   <div className="flex items-center gap-2 w-full">
                       {/* EXECUTE BUTTON - Stops Propagation to prevent toggling when clicked */}
                       {isExecuting ? (
                          <Button 
                             onClick={(e) => { e.stopPropagation(); handleStop(); }} 
                             className="flex-1 h-9 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-bold text-xs uppercase tracking-widest"
                          >
                             <Square className="w-3 h-3 mr-2 fill-current" /> Stop
                          </Button>
                       ) : (
                          <Button 
                             onClick={(e) => { e.stopPropagation(); handleRun(); }} 
                             disabled={isLoading}
                             className="flex-1 h-9 bg-white text-black hover:bg-gray-200 border-none font-bold text-xs uppercase tracking-widest"
                          >
                             {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Play className="w-3 h-3 mr-2 fill-current" />}
                             Execute
                          </Button>
                       )}
                       
                       {/* DOWNLOAD BUTTON */}
                       <Button 
                          onClick={(e) => { e.stopPropagation(); handleDownload(); }} 
                          variant="outline" 
                          size="icon" 
                          className="h-9 w-9 border-white/10 bg-white/5"
                       >
                          <Download className="w-4 h-4" />
                       </Button>

                       {/* TOGGLE INDICATOR */}
                       <div className="w-9 h-9 flex items-center justify-center text-zinc-500">
                          {isConsoleOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                       </div>
                   </div>
                </div>

                {/* Console Content (Hidden when collapsed) */}
                <div className="flex-1 overflow-hidden bg-[#010409] relative">
                   {TerminalComponent}
                </div>
             </motion.div>
          </div>
        ) : (
          // --- DESKTOP LAYOUT ---
          <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={60} minSize={30} className="bg-[#050505] flex flex-col">
              {EditorComponent}
            </ResizablePanel>

            <ResizableHandle className="w-1 bg-[#050505] border-x border-white/5 hover:bg-white/10 transition-colors" />

            <ResizablePanel defaultSize={40} minSize={20} className="bg-[#050505] flex flex-col">
              {TerminalComponent}
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      {/* FOOTER */}
      {!isMobile && (
        <footer className="h-[32px] border-t border-white/10 bg-[#050505] flex items-center justify-between px-6 text-[9px] text-[#666] uppercase tracking-widest shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn("w-1 h-1 rounded-full shadow-[0_0_6px]", isReady ? "bg-[#3fb950] shadow-[#3fb950]" : "bg-yellow-500 shadow-yellow-500")} />
            <span>{isReady ? "Connected / encrypted_v2" : "Initializing..."}</span>
          </div>
          <div>Codevo 2025</div>
        </footer>
      )}
    </div>
  );
};

export default Compiler;
