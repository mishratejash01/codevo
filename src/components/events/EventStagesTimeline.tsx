import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Circle, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface Stage {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  order_index: number;
  stage_type: string;
  is_active: boolean;
}

interface EventStagesTimelineProps {
  eventId: string;
  eventStartDate: string;
  eventEndDate: string;
  registrationDeadline?: string | null;
}

export function EventStagesTimeline({ 
  eventId, 
  eventStartDate, 
  eventEndDate,
  registrationDeadline 
}: EventStagesTimelineProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [eventId]);

  async function fetchStages() {
    const { data, error } = await supabase
      .from('event_stages')
      .select('*')
      .eq('event_id', eventId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setStages(data);
    }
    setLoading(false);
  }

  const getStageStatus = (startDate: string, endDate: string | null) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) return 'upcoming';
    if (end && now > end) return 'completed';
    return 'active';
  };

  // If no custom stages, show default timeline
  const defaultStages = [
    {
      id: 'registration',
      title: 'Registration Opens',
      description: 'Register for the event and secure your spot.',
      start_date: eventStartDate,
      end_date: registrationDeadline,
      status: getStageStatus(eventStartDate, registrationDeadline),
    },
    {
      id: 'event',
      title: 'Event Begins',
      description: 'The main event kicks off.',
      start_date: eventStartDate,
      end_date: eventEndDate,
      status: getStageStatus(eventStartDate, eventEndDate),
    },
    {
      id: 'end',
      title: 'Event Ends',
      description: 'Final submissions and event conclusion.',
      start_date: eventEndDate,
      end_date: null,
      status: getStageStatus(eventEndDate, null),
    },
  ];

  const displayStages = stages.length > 0 
    ? stages.map(s => ({ ...s, status: getStageStatus(s.start_date, s.end_date) }))
    : defaultStages;

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
        <div className="w-1 h-6 bg-purple-500 rounded-full" />
        Stages & Timeline
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-purple-500/50 to-white/10" />

        <div className="space-y-8">
          {displayStages.map((stage, index) => (
            <div key={stage.id} className="relative pl-12">
              {/* Timeline dot */}
              <div className="absolute left-0 w-9 flex items-center justify-center">
                {stage.status === 'completed' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-500 bg-[#09090b] rounded-full" />
                ) : stage.status === 'active' ? (
                  <div className="relative">
                    <Circle className="w-8 h-8 text-purple-500 fill-purple-500/20 bg-[#09090b] rounded-full" />
                    <div className="absolute inset-0 animate-ping">
                      <Circle className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                  </div>
                ) : (
                  <Clock className="w-8 h-8 text-gray-500 bg-[#09090b] rounded-full" />
                )}
              </div>

              {/* Stage content */}
              <div className={`bg-[#151518] border rounded-xl p-6 transition-all hover:border-purple-500/50 ${
                stage.status === 'active' 
                  ? 'border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
                  : 'border-white/10'
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h4 className="text-lg font-semibold text-white">{stage.title}</h4>
                    {stage.description && (
                      <p className="text-gray-400 mt-1 text-sm">{stage.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-400">
                      {format(new Date(stage.start_date), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {format(new Date(stage.start_date), 'h:mm a')}
                    </div>
                  </div>
                </div>

                {stage.status === 'active' && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="inline-flex items-center gap-2 text-sm text-green-400">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      Currently Active
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
