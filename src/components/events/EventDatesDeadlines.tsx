import { format, isPast } from 'date-fns';
import { Check, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EventDatesDeadlinesProps {
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
}

export function EventDatesDeadlines({ 
  startDate, 
  endDate, 
  registrationDeadline 
}: EventDatesDeadlinesProps) {
  
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;

  // Map the dates to the "Protocol" format used in the design
  const items = [
    {
      id: '01',
      name: 'Registration Deadline',
      date: regDeadline,
      description: 'Final cutoff for onboarding and credential verification.',
    },
    {
      id: '02',
      name: 'Event Execution Starts',
      date: start,
      description: 'Protocol initiation and main assembly kick-off.',
    },
    {
      id: '03',
      name: 'Final Conclusion',
      date: end,
      description: 'Termination of event activities and submission closing.',
    }
  ].filter(item => item.date !== null);

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans">
      {/* Technical Header */}
      <div className="flex items-center gap-[15px] mb-[40px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h2 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Dates & Deadlines
        </h2>
      </div>

      {/* Timeline Schematic */}
      <div className="relative pl-[40px] before:content-[''] before:absolute before:left-[10px] before:top-[5px] before:bottom-[5px] before:w-[1px] before:bg-[#1a1a1a]">
        {items.map((item) => {
          const isCompleted = isPast(item.date!);
          // Logic for "Active": If it's the next upcoming event or currently happening
          const isActive = !isCompleted && item.id === '02'; 

          return (
            <div key={item.id} className="relative mb-[30px] last:mb-0">
              {/* Markers: Square & Industrial */}
              <div 
                className={cn(
                  "absolute left-[-35px] top-[4px] width-[21px] height-[21px] w-[21px] h-[21px] bg-black border flex items-center justify-center z-[2]",
                  isCompleted ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a]",
                  isActive && "border-white"
                )}
              >
                {isCompleted ? (
                  <Check className="w-[12px] h-[12px] stroke-[3]" />
                ) : isActive ? (
                  <div className="w-[4px] h-[4px] bg-white" />
                ) : null}
              </div>

              {/* Step Card Styling */}
              <div 
                className={cn(
                  "bg-[#050505] border border-[#1a1a1a] p-[30px] flex flex-col md:flex-row justify-between items-start transition-all",
                  isCompleted && "opacity-50"
                )}
              >
                <div className="flex-1">
                  <h4 className="text-[0.65rem] uppercase tracking-[3px] text-[#555555] mb-[12px]">
                    Protocol {item.id}
                  </h4>
                  <h3 className="font-serif text-[1.4rem] font-normal text-white mb-[10px]">
                    {item.name}
                  </h3>
                  <p className="text-[#555555] text-[0.85rem] font-light max-w-[350px] leading-relaxed">
                    {item.description}
                  </p>

                  {/* LED STATUS BLOCK */}
                  {isActive && (
                    <div className="mt-[25px] inline-flex items-center gap-[12px] padding-[8px_16px] border border-[#1a1a1a] bg-white/5 px-4 py-2">
                      <div className="w-[6px] h-[6px] bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88] animate-pulse" />
                      <span className="text-[0.6rem] uppercase tracking-[2px] text-white font-semibold">
                        Currently Active
                      </span>
                    </div>
                  )}
                </div>

                {/* Date Information */}
                <div className="mt-5 md:mt-0 text-left md:text-right min-w-[120px]">
                  <span className={cn(
                    "block text-[0.8rem] tracking-[1px] mb-1 font-medium",
                    isCompleted ? "text-[#555555]" : "text-[#e0e0e0]"
                  )}>
                    {format(item.date!, 'MMM dd, yyyy')}
                  </span>
                  <span className="block text-[0.65rem] text-[#555555] uppercase tracking-[1px]">
                    {format(item.date!, 'HH:mm OOOO')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
