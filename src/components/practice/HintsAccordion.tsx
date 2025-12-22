import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Lightbulb, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HintsAccordionProps {
  hints: string[];
  hasAttempted: boolean;
}

export function HintsAccordion({ hints, hasAttempted }: HintsAccordionProps) {
  const [revealedHints, setRevealedHints] = useState<number[]>([]);

  if (!hints || hints.length === 0) return null;

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints(prev => [...prev, index]);
    }
  };

  return (
    <div className="space-y-2 pt-4 border-t border-white/5">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
        <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
        <span className="font-medium">Hints ({hints.length})</span>
      </div>
      
      <Accordion type="single" collapsible className="space-y-2">
        {hints.map((hint, index) => {
          const isRevealed = revealedHints.includes(index);
          const canReveal = hasAttempted || index === 0;
          
          return (
            <AccordionItem
              key={index}
              value={`hint-${index}`}
              className="border border-white/5 rounded-lg bg-[#151515] overflow-hidden"
            >
              <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-white/5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] flex items-center justify-center font-bold">
                    {index + 1}
                  </span>
                  <span className="text-muted-foreground">Hint {index + 1}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-3 pb-3">
                {isRevealed ? (
                  <p className="text-sm text-gray-300 leading-relaxed">{hint}</p>
                ) : canReveal ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revealHint(index)}
                    className="h-8 text-xs text-yellow-400 hover:text-yellow-300"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Reveal Hint
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Submit at least one attempt to unlock</span>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
