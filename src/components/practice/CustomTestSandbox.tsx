import { useState, useEffect } from 'react';
import { Play, Trash2, RotateCcw, Copy } from 'lucide-react';
import { EnhancedExecutionResult } from '@/hooks/useEnhancedCodeRunner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CustomTestSandboxProps {
  defaultInput: string;
  onRunCustomTest: (input: string) => Promise<EnhancedExecutionResult>;
  isRunning: boolean;
}

export function CustomTestSandbox({ defaultInput, onRunCustomTest, isRunning }: CustomTestSandboxProps) {
  const [input, setInput] = useState(defaultInput);
  const [result, setResult] = useState<EnhancedExecutionResult | null>(null);

  // Update input if defaultInput changes (e.g. switching problems)
  useEffect(() => {
    if (defaultInput) setInput(defaultInput);
  }, [defaultInput]);

  const handleRun = async () => {
    if (!input.trim()) return;
    const executionResult = await onRunCustomTest(input);
    setResult(executionResult);
  };

  const handleReset = () => {
    setInput('');
    setResult(null);
  };

  const handleTemplate = (type: 'Empty' | 'Null' | 'Zero') => {
    switch (type) {
      case 'Empty': setInput('""'); break;
      case 'Null': setInput('null'); break;
      case 'Zero': setInput('0'); break;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-[#050505] p-4 font-sans overflow-y-auto">
      
      {/* --- SANDBOX ROOT CARD --- */}
      <div className="w-full max-w-[900px] bg-[#0A0A0C] border border-[#1A1A1C] flex flex-col shadow-2xl relative">
        
        {/* --- HEADER ACTIONS --- */}
        <div className="h-[48px] px-5 flex justify-end items-center gap-3 border-b border-[#1A1A1C] bg-[#050505] shrink-0">
          <button 
            onClick={handleReset}
            className="group h-[30px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer flex items-center gap-2 rounded-[2px] transition-all bg-transparent border border-[#1A1A1C] text-[#666666] hover:text-white hover:border-[#333333]"
          >
            <Trash2 className="w-3 h-3 group-hover:text-red-400 transition-colors" />
            Clear
          </button>
          
          <button 
            onClick={handleRun}
            disabled={isRunning || !input.trim()}
            className="h-[30px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer flex items-center gap-2 rounded-[2px] transition-all bg-white border border-white text-[#050505] hover:bg-[#E2E2E2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <span className="animate-spin w-3 h-3 border-2 border-black border-t-transparent rounded-full"/>
            ) : (
              <Play className="w-3 h-3 fill-current" />
            )}
            {isRunning ? 'Running' : 'Run'}
          </button>
        </div>

        {/* --- TWO COLUMN BODY --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[300px] divide-y md:divide-y-0 md:divide-x divide-[#1A1A1C]">
          
          {/* LEFT COLUMN: INPUT */}
          <div className="flex flex-col p-5 bg-[#0A0A0C]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Input Stream</span>
              <div className="flex gap-[6px]">
                {['Empty', 'Null', 'Zero'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => handleTemplate(type as any)}
                    className="bg-transparent border border-[#1A1A1C] text-[#666666] text-[8px] font-bold uppercase px-[6px] py-[2px] cursor-pointer transition-all hover:text-white hover:border-[#333333] hover:bg-white/5 rounded-[2px]"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea 
              className="flex-1 w-full bg-[#050505] border border-[#1A1A1C] text-[#E2E2E2] p-4 font-mono text-[12px] leading-relaxed resize-none outline-none focus:border-[#333333] focus:ring-1 focus:ring-[#333333]/50 placeholder:text-[#333] transition-all rounded-sm"
              spellCheck={false}
              placeholder='Enter your test case input here...&#10;Ex: S="aabbcc"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* RIGHT COLUMN: OUTPUT */}
          <div className="flex flex-col p-5 bg-[#0A0A0C]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Output Log</span>
              {result && (
                <div className="flex items-center gap-2">
                   <span className={cn(
                     "text-[9px] px-1.5 py-0.5 rounded border font-mono",
                     result.errorDetails 
                       ? "border-red-500/30 text-red-400 bg-red-500/10"
                       : "border-blue-500/30 text-blue-400 bg-blue-500/10"
                   )}>
                     {result.runtime_ms}ms
                   </span>
                </div>
              )}
            </div>
            
            <div className={cn(
              "flex-1 border p-4 font-mono text-[12px] whitespace-pre-wrap overflow-auto rounded-sm transition-colors custom-scrollbar",
              result?.errorDetails 
                ? "bg-[#1a0505] border-red-900/30 text-red-300" 
                : "bg-[#0D0D0F] border-[#1A1A1C] text-[#CCC]"
            )}>
              {result ? (
                result.errorDetails || result.output
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#333] select-none">
                  <span className="text-2xl opacity-20 mb-2">⌘</span>
                  <span className="text-[10px] uppercase tracking-wider">Ready to Execute</span>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="h-[32px] px-5 flex items-center justify-between bg-[#050505] border-t border-[#1A1A1C] shrink-0">
          <span className="text-[9px] font-medium text-[#444444] flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
            Manual verification mode active
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#222222]">
            CODéVO
          </span>
        </div>

      </div>
    </div>
  );
}
