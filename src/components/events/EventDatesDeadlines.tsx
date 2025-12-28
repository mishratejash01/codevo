import { format, isPast } from 'date-fns';
import { Check } from 'lucide-react';
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
  
  const regDeadlineDate = registrationDeadline ? new Date(registrationDeadline) : null;
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);

  const items = [
    {
      id: '01',
      name: 'Registration Deadline',
      date: regDeadlineDate,
      description: 'Final cutoff for onboarding and credential verification.',
    },
    {
      id: '02',
      name: 'Event Execution Starts',
      date: startDateObj,
      description: 'Protocol initiation and main assembly kick-off.',
    },
    {
      id: '03',
      name: 'Final Conclusion',
      date: endDateObj,
      description: 'Termination of event activities and submission closing.',
    }
  ].filter(item => item.date !== null);

  return (
    <div className="w-full max-w-[800px] mx-auto font-sans">
      <div className="flex items-center gap-[15px] mb-[40px]">
        <div className="w-[2px] h-6 bg-[#ff8c00]" />
        <h2 className="font-serif text-[2.2rem] font-normal tracking-tight text-white">
          Dates & Deadlines
        </h2>
      </div>

      <div className="relative pl-10 before:content-[''] before:absolute before:left-[10px] before:top-1 before:bottom-1 before:w-px before:bg-[#1a1a1a]">
        {items.map((item) => {
          const isCompleted = isPast(item.date!);
          // Active logic: Ongoing or next immediate step
          const isActive = !isCompleted && item.id === '02'; 

          return (
            <div key={item.id} className="relative mb-8 last:mb-0">
              {/* Square Industrial Marker */}
              <div 
                className={cn(
                  "absolute -left-[35px] top-1 w-5 h-5 bg-black border flex items-center justify-center z-10",
                  isCompleted ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a]",
                  isActive && "border-white"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : isActive ? (
                  <div className="w-1 h-1 bg-white" />
                ) : null}
              </div>

              {/* Protocol Card */}
              <div 
                className={cn(
                  "bg-[#050505] border border-[#1a1a1a] p-8 flex flex-col md:flex-row justify-between items-start transition-all",
                  isCompleted && "opacity-50"
                )}
              >
                <div className="flex-1">
                  <h4 className="text-[10px] uppercase tracking-[3px] text-[#555555] mb-3">
                    Protocol {item.id}
                  </h4>
                  <h3 className="font-serif text-2xl font-normal text-white mb-2">
                    {item.name}
                  </h3>
                  <p className="text-[#555555] text-sm font-light max-w-[350px] leading-relaxed">
                    {item.description}
                  </p>

                  {isActive && (
                    <div className="mt-6 inline-flex items-center gap-3 border border-[#1a1a1a] bg-white/5 px-4 py-2">
                      <div className="w-1.5 h-1.5 bg-[#00ff88] rounded-full shadow-[0_0_10px_#00ff88] animate-pulse" />
                      <span className="text-[10px] uppercase tracking-wider text-white font-semibold">
                        Currently Active
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-6 md:mt-0 text-left md:text-right min-w-[140px]">
                  <span className={cn(
                    "block text-sm tracking-wider mb-1 font-medium",
                    isCompleted ? "text-[#555555]" : "text-[#e0e0e0]"
                  )}>
                    {format(item.date!, 'MMM dd, yyyy')}
                  </span>
                  <span className="block text-[10px] text-[#555555] uppercase tracking-widest">
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
