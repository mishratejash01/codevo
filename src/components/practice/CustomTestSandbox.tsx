import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Beaker, Trash2, Clock, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface CustomTestSandboxProps {
  defaultInput?: string;
  onRunCustomTest: (input: string) => Promise<{
    output: string;
    error?: string;
    runtime_ms: number;
  }>;
  isRunning: boolean;
}

const EDGE_CASE_TEMPLATES = [
  { label: 'Empty', value: '' },
  { label: 'Zero', value: '0' },
  { label: 'Negative', value: '-1' },
  { label: 'Large', value: '999999999' },
  { label: 'Null/None', value: 'null' },
];

const LOCAL_STORAGE_KEY = 'practice_custom_inputs';

export const CustomTestSandbox = ({ 
  defaultInput = '', 
  onRunCustomTest,
  isRunning 
}: CustomTestSandboxProps) => {
  const [customInput, setCustomInput] = useState(defaultInput);
  const [customResult, setCustomResult] = useState<{
    output: string;
    error?: string;
    runtime_ms: number;
  } | null>(null);
  const [recentInputs, setRecentInputs] = useState<string[]>([]);
  const [showRecent, setShowRecent] = useState(false);

  // Load recent inputs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecentInputs(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  const saveToRecent = (input: string) => {
    if (!input.trim()) return;
    
    const updated = [input, ...recentInputs.filter(i => i !== input)].slice(0, 5);
    setRecentInputs(updated);
    
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // Ignore localStorage errors
    }
  };

  const handleRunCustom = async () => {
    saveToRecent(customInput);
    const result = await onRunCustomTest(customInput);
    setCustomResult(result);
  };

  const handleClear = () => {
    setCustomInput('');
    setCustomResult(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sandbox header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Beaker className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-medium text-gray-300">Custom Test Sandbox</span>
        </div>
        <div className="flex items-center gap-2">
          {recentInputs.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowRecent(!showRecent)}
              className="h-7 text-[10px] text-muted-foreground hover:text-white"
            >
              Recent ({recentInputs.length})
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 text-[10px] text-muted-foreground hover:text-white"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Recent inputs dropdown */}
      <AnimatePresence>
        {showRecent && recentInputs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-2 rounded-lg bg-white/5 border border-white/10"
          >
            <p className="text-[10px] text-muted-foreground mb-2">Recent inputs:</p>
            <div className="flex flex-wrap gap-1">
              {recentInputs.map((input, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCustomInput(input);
                    setShowRecent(false);
                  }}
                  className="px-2 py-1 text-[10px] font-mono bg-white/5 rounded hover:bg-white/10 transition-colors truncate max-w-[100px]"
                >
                  {input}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              Custom Input
            </label>
            {/* Edge case templates */}
            <div className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              {EDGE_CASE_TEMPLATES.map((template) => (
                <button
                  key={template.label}
                  onClick={() => setCustomInput(template.value)}
                  className="px-1.5 py-0.5 text-[9px] font-mono bg-white/5 rounded hover:bg-white/10 transition-colors text-muted-foreground hover:text-white"
                >
                  {template.label}
                </button>
              ))}
            </div>
          </div>
          
          <Textarea
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Wondering if that edge case will break you? Type it here and find out."
            className="min-h-[80px] bg-[#151515] border-white/10 font-mono text-sm text-gray-300 placeholder:text-gray-600 resize-none focus:ring-purple-500/30"
          />
          
          <p className="text-[10px] text-muted-foreground">
            Give it a spin. Toss in your own inputs to see how your logic holds up before you face the Judge.
          </p>
        </div>

        {/* Run button */}
        <Button
          onClick={handleRunCustom}
          disabled={isRunning || !customInput.trim()}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2 fill-current" />
              Run Custom Test
            </>
          )}
        </Button>

        {/* Result display */}
        <AnimatePresence>
          {customResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Output
                </span>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{customResult.runtime_ms}ms</span>
                </div>
              </div>
              
              {customResult.error ? (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-500/20 font-mono text-xs text-red-300 whitespace-pre-wrap">
                  {customResult.error}
                </div>
              ) : (
                <div className={cn(
                  "p-3 rounded-lg border font-mono text-xs whitespace-pre-wrap",
                  "bg-[#1a1a1a] border-white/10 text-gray-300"
                )}>
                  {customResult.output || <span className="italic opacity-50">No output</span>}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!customResult && !customInput && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Beaker className="w-8 h-8 text-purple-500/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Test your code with custom inputs
            </p>
            <p className="text-xs text-muted-foreground/50 mt-1">
              Results won't affect your submission stats
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
