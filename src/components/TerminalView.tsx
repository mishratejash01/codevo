import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

interface TerminalViewProps {
  output: string;
  onInput: (text: string) => void;
}

export const TerminalView = ({ output, onInput }: TerminalViewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const writtenCharsRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Initialize Xterm
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      theme: {
        background: '#0c0c0e',
        foreground: '#f8f8f2',
        cursor: '#f8f8f2',
        selectionBackground: 'rgba(255, 255, 255, 0.3)',
      },
      convertEol: true, 
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    fitAddon.fit();

    // 2. Handle User Typing (Ignored in Safe Mode, but kept for compatibility)
    term.onData((data) => {
      onInput(data);
    });

    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      term.dispose();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 3. Handle Output from Python (THE FIX IS HERE)
  useEffect(() => {
    if (!terminalRef.current) return;
    
    // DETECT RESET: If the new output is shorter than what we wrote, it means "Run" was clicked again.
    if (output.length < writtenCharsRef.current) {
        terminalRef.current.reset(); // clear() just wipes screen, reset() wipes scrollback too
        writtenCharsRef.current = 0;
    }

    // Write only the NEW content
    const newText = output.slice(writtenCharsRef.current);
    if (newText.length > 0) {
      terminalRef.current.write(newText);
      writtenCharsRef.current = output.length;
    }
  }, [output]);

  return (
    <div className="h-full w-full bg-[#0c0c0e] p-2 overflow-hidden" ref={containerRef} />
  );
};
