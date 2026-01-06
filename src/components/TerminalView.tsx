import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalViewProps {
  output: string;
  onInput: (text: string) => void;
  isWaitingForInput?: boolean;
  language?: string;
  isRunning?: boolean;
  fontSize?: number;
}

export const TerminalView = ({ 
  output, 
  onInput, 
  isWaitingForInput = false, 
  language = 'python',
  isRunning = false,
  fontSize = 14
}: TerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCharsRef = useRef<number>(0);
  const isInitializedRef = useRef(false);
  
  // Ref to track current language inside the closure
  const languageRef = useRef(language);

  // Update language ref when prop changes
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Update Font Size dynamically
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.fontSize = fontSize;
      if (fitAddonRef.current) {
        fitAddonRef.current.fit();
      }
    }
  }, [fontSize]);

  const getCommandPrompt = useCallback(() => {
    switch(language) {
      case 'java': return '$ java Main.java';
      case 'cpp': return '$ ./main.cpp';
      case 'c': return '$ ./main.c';
      case 'javascript': return '$ node index.js';
      case 'typescript': return '$ ts-node index.ts';
      case 'bash': return '$ bash script.sh';
      case 'sql': return '$ sqlite3';
      default: return '$ python main.py';
    }
  }, [language]);

  // Initialize terminal once
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    isInitializedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: fontSize,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: '#010409',
        foreground: '#e4e4e7',
        cursor: '#22c55e',
        cursorAccent: '#0c0c0e',
        selectionBackground: 'rgba(34, 197, 94, 0.3)',
        black: '#18181b',
        red: '#ef4444',
        green: '#22c55e',
        yellow: '#eab308',
        blue: '#3b82f6',
        magenta: '#a855f7',
        cyan: '#06b6d4',
        white: '#f4f4f5',
        brightBlack: '#3f3f46',
        brightRed: '#f87171',
        brightGreen: '#4ade80',
        brightYellow: '#facc15',
        brightBlue: '#60a5fa',
        brightMagenta: '#c084fc',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
      convertEol: true,
      scrollback: 5000,
      allowTransparency: true,
      lineHeight: 1.5,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch (e) { }
    });

    // --- FIX IS HERE ---
    // JavaScript/TypeScript runners typically echo input back (Remote Echo).
    // Python (Pyodide) typically does NOT echo input back (requires Local Echo).
    // We conditionally apply local echo to avoid double typing in JS/TS.
    term.onData((data) => {
      const currentLang = languageRef.current || 'python';
      
      // Languages where the runner handles echo (remote echo)
      // - JavaScript: useJavaScriptRunner echoes via appendToOutput
      // - TypeScript: same as JavaScript
      // - Bash: Piston returns echoed output
      // 
      // Languages where terminal must echo locally:
      // - Python: usePyodide doesn't echo
      // - C: useCRunner doesn't echo (relies on terminal)
      // - C++: useInteractiveRunner doesn't echo
      // - Java: useInteractiveRunner doesn't echo
      const remoteEchoLanguages = ['javascript', 'typescript', 'bash'];

      // Only do local echo if the language runner doesn't echo for us
      if (!remoteEchoLanguages.includes(currentLang)) {
        term.write(data);
      }
      
      onInput(data);
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (e) { }
      });
    };
    
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      isInitializedRef.current = false;
    };
  }, [onInput]); // Removed unnecessary dependencies to prevent re-init

  // Handle output changes
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    
    // If output was cleared (e.g. re-run)
    if (output.length === 0) {
      term.reset();
      term.write(`\x1b[38;5;242m${getCommandPrompt()}\x1b[0m\r\n`);
      writtenCharsRef.current = 0;
      return;
    }
    
    // If output shrunk (e.g. Backspace was pressed), we must reset to sync
    if (output.length < writtenCharsRef.current) {
      term.reset();
      term.write(`\x1b[38;5;242m${getCommandPrompt()}\x1b[0m\r\n`);
      term.write(output); // Rewrite correct content
      writtenCharsRef.current = output.length;
      return;
    }

    // Normal case: append new characters
    const newText = output.slice(writtenCharsRef.current);
    if (newText.length > 0) {
      term.write(newText);
      writtenCharsRef.current = output.length;
    }
  }, [output, getCommandPrompt]);

  // Show input indicator when waiting
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    
    if (isWaitingForInput) {
      term.options.cursorStyle = 'underline';
      term.options.cursorBlink = true;
    } else {
      term.options.cursorStyle = 'bar';
    }
  }, [isWaitingForInput]);

  // Focus terminal when needed
  useEffect(() => {
    if ((isWaitingForInput || isRunning) && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isWaitingForInput, isRunning]);

  return (
    <div className="relative h-full w-full">
      <div 
        ref={containerRef}
        className="h-full w-full bg-[#010409] overflow-hidden"
        style={{ minHeight: '100px', padding: '8px' }}
      />
      
      {/* Input waiting indicator */}
      {isWaitingForInput && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2 px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded text-xs text-yellow-400 pointer-events-none">
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          Waiting for input...
        </div>
      )}
    </div>
  );
};
