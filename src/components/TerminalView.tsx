import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalViewProps {
  output: string;
  onInput: (text: string) => void;
  isWaitingForInput?: boolean;
}

export const TerminalView = ({ output, onInput, isWaitingForInput = false }: TerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCharsRef = useRef<number>(0);
  const currentLineRef = useRef<string>("");
  const isInitializedRef = useRef(false);

  // Initialize terminal once
  useEffect(() => {
    if (!containerRef.current || isInitializedRef.current) return;
    
    isInitializedRef.current = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
      theme: {
        background: '#0c0c0e',
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
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    
    // Initial fit with delay
    requestAnimationFrame(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // Ignore fit errors during initialization
      }
    });

    // Handle user input
    term.onData((data) => {
      // Enter key
      if (data === '\r') {
        term.write('\r\n');
        onInput('\r');
        currentLineRef.current = "";
      } 
      // Backspace
      else if (data === '\x7f' || data === '\b') {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write('\b \b');
          onInput('\b');
        }
      }
      // Ctrl+C
      else if (data === '\x03') {
        term.write('^C\r\n');
        onInput('\x03');
        currentLineRef.current = "";
      }
      // Ctrl+D (EOF)
      else if (data === '\x04') {
        onInput('\r'); // Send what we have
        currentLineRef.current = "";
      }
      // Arrow keys and other escape sequences - ignore
      else if (data.startsWith('\x1b')) {
        return;
      }
      // Regular printable characters
      else if (data >= ' ' || data === '\t') {
        term.write(data);
        currentLineRef.current += data;
        onInput(data);
      }
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    // Handle resize
    const handleResize = () => {
      requestAnimationFrame(() => {
        try {
          fitAddon.fit();
        } catch (e) {
          // Ignore
        }
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
  }, [onInput]);

  // Handle output changes
  useEffect(() => {
    const term = terminalRef.current;
    if (!term) return;
    
    // Detect reset (new run) - output cleared means start fresh
    if (output.length === 0) {
      term.reset();
      term.write('\x1b[38;5;242m$ python main.py\x1b[0m\r\n');
      writtenCharsRef.current = 0;
      currentLineRef.current = "";
      return;
    }
    
    // If output is shorter than what we've written, reset
    if (output.length < writtenCharsRef.current) {
      term.reset();
      term.write('\x1b[38;5;242m$ python main.py\x1b[0m\r\n');
      writtenCharsRef.current = 0;
      currentLineRef.current = "";
    }

    // Write new content
    const newText = output.slice(writtenCharsRef.current);
    if (newText.length > 0) {
      term.write(newText);
      writtenCharsRef.current = output.length;
    }
  }, [output]);

  // Focus terminal when waiting for input
  useEffect(() => {
    if (isWaitingForInput && terminalRef.current) {
      terminalRef.current.focus();
    }
  }, [isWaitingForInput]);

  return (
    <div 
      ref={containerRef}
      className="h-full w-full bg-[#0c0c0e] overflow-hidden"
      style={{ 
        minHeight: '100px',
        padding: '8px'
      }}
    />
  );
};
