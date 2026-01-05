import { useState } from 'react';
import { Play, Trash2, RotateCcw } from 'lucide-react';
import { EnhancedExecutionResult } from '@/hooks/useEnhancedCodeRunner';
import { cn } from '@/lib/utils';

interface CustomTestSandboxProps {
  defaultInput: string;
  onRunCustomTest: (input: string) => Promise<EnhancedExecutionResult>;
  isRunning: boolean;
}

export function CustomTestSandbox({ defaultInput, onRunCustomTest, isRunning }: CustomTestSandboxProps) {
  const [input, setInput] = useState(defaultInput);
  const [result, setResult] = useState<EnhancedExecutionResult | null>(null);

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
    <div className="flex flex-col items-center w-full h-full bg-[#050505] p-4 md:p-6 overflow-hidden font-inter">
      
      {/* --- MAIN CONTAINER (Sandbox Root) --- */}
      <div className="w-full max-w-[900px] flex flex-col bg-[#0A0A0C] border border-[#1A1A1C] shadow-2xl h-full max-h-[600px]">
        
        {/* --- HEADER ACTIONS --- */}
        <div className="h-[48px] px-5 flex justify-end items-center gap-3 border-b border-[#1A1A1C] bg-[#050505] shrink-0">
          <button 
            onClick={handleReset}
            className="h-[30px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer flex items-center gap-2 rounded-[2px] transition-all bg-transparent border border-[#1A1A1C] text-[#666666] hover:text-white hover:border-[#333333]"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
          
          <button 
            onClick={handleRun}
            disabled={isRunning || !input.trim()}
            className="h-[30px] px-4 text-[10px] font-bold uppercase tracking-[0.1em] cursor-pointer flex items-center gap-2 rounded-[2px] transition-all bg-white border border-white text-[#050505] hover:bg-[#E2E2E2] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-3 h-3 fill-current" />
            {isRunning ? 'Running' : 'Run'}
          </button>
        </div>

        {/* --- TWO COLUMN BODY --- */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 min-h-0 divide-y md:divide-y-0 md:divide-x divide-[#1A1A1C]">
          
          {/* LEFT COLUMN: INPUT */}
          <div className="flex flex-col p-5 bg-[#0A0A0C]">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Input</span>
              <div className="flex gap-[6px]">
                {['Empty', 'Null', 'Zero'].map((type) => (
                  <button 
                    key={type}
                    onClick={() => handleTemplate(type as any)}
                    className="bg-transparent border border-[#1A1A1C] text-[#666666] text-[8px] font-bold uppercase px-[6px] py-[2px] cursor-pointer transition-all hover:text-white hover:border-[#333333] rounded-[2px]"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            
            <textarea 
              className="flex-1 w-full bg-[#050505] border border-[#1A1A1C] text-[#E2E2E2] p-3 font-mono text-[12px] leading-relaxed resize-none outline-none focus:border-[#333333] placeholder:text-[#333]"
              spellCheck={false}
              placeholder='S="aabbcc"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </div>

          {/* RIGHT COLUMN: OUTPUT */}
          <div className="flex flex-col p-5 bg-[#0A0A0C]">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#666666]">Output</span>
              {result && (
                <span className="font-mono text-[10px] font-semibold text-[#3B82F6]">
                  {result.runtime_ms}ms
                </span>
              )}
            </div>
            
            <div className={cn(
              "flex-1 border p-3 font-mono text-[12px] whitespace-pre-wrap overflow-auto",
              result?.errorDetails 
                ? "bg-[#100505] border-[#2D1A1A] text-[#EF4444]" 
                : "bg-[#0D0D0F] border-[#1A1A1C] text-[#CCC]"
            )}>
              {result ? (
                result.errorDetails || result.output
              ) : (
                <span className="text-[#333] italic">Output will appear here...</span>
              )}
            </div>
          </div>

        </div>

        {/* --- FOOTER --- */}
        <div className="h-[32px] px-5 flex items-center justify-between bg-[#050505] border-t border-[#1A1A1C] shrink-0">
          <span className="text-[9px] font-medium text-[#444444] truncate mr-2">
            Manual verification mode active. Metrics are for reference only.
          </span>
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#222222]">
            CODéVO
          </span>
        </div>

      </div>
    </div>
  );
}
