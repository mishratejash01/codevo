import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { HelpCircle, ChevronDown, Loader2, MessageSquarePlus } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
        <Loader2 className="animate-spin h-6 w-6 text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-blue-500 rounded-full" />
        Frequently Asked Questions
      </h3>

      {faqs.length > 0 ? (
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="bg-[#151518] border border-white/10 rounded-xl overflow-hidden px-6"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <div className="flex items-start gap-3">
                  <span className="text-purple-400 font-mono text-sm mt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-white font-medium">{faq.question}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 pb-5 pl-9">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="text-center py-12 bg-[#151518] rounded-2xl border border-white/10">
          <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No FAQs added yet</p>
          <p className="text-gray-500 text-sm">Check back later for answers to common questions.</p>
        </div>
      )}
    </div>
  );
}
