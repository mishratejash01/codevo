import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, Loader2, HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order_index: number;
  is_pinned: boolean;
}

interface EventFAQsProps {
  eventId: string;
}

export function EventFAQs({ eventId }: EventFAQsProps) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFAQs();
  }, [eventId]);

  async function fetchFAQs() {
    const { data, error } = await supabase
      .from('event_faqs')
      .select('*')
      .eq('event_id', eventId)
      .order('is_pinned', { ascending: false })
      .order('order_index', { ascending: true });

    if (!error && data) {
      setFaqs(data);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-6 w-6 text-[#ff8c00]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[850px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- Section Header --- */}
      <div className="flex items-center gap-[15px] mb-[50px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Questions & Answers
        </h3>
      </div>

      {faqs.length > 0 ? (
        <Accordion type="single" collapsible className="border-t border-[#1a1a1a]">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border-b border-[#1a1a1a] transition-all duration-300"
            >
              <AccordionTrigger 
                className={cn(
                  "flex items-center justify-between py-[35px] hover:no-underline transition-all duration-300 group",
                  "data-[state=open]:text-[#ff8c00] hover:pl-[10px]"
                )}
              >
                <div className="flex items-center gap-[25px] text-left">
                  <span className="text-[0.7rem] text-[#666666] font-mono tracking-[1px] mt-1">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-serif text-[1.3rem] font-normal group-data-[state=open]:text-[#ff8c00] transition-colors">
                    {faq.question}
                  </span>
                </div>
                <ChevronDown className="h-[12px] w-[12px] text-[#666666] group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#ff8c00] transition-transform duration-400" />
              </AccordionTrigger>
              
              <AccordionContent className="pl-[55px] pb-[35px]">
                <p className="text-[#666666] text-[0.95rem] leading-[1.7] font-light max-w-[700px]">
                  {faq.answer}
                </p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="py-[100px] text-center border border-dashed border-[#1a1a1a] bg-[#050505]/50">
          <HelpCircle className="w-8 h-8 text-[#1a1a1a] mx-auto mb-4" />
          <p className="text-[0.8rem] text-[#666666] uppercase tracking-[2px] font-bold">
            No Intel Logged
          </p>
          <p className="text-[#333] text-sm mt-2">Check the mission brief for standard protocols.</p>
        </div>
      )}
    </div>
  );
}
