import { format, differenceInDays, differenceInHours, isPast } from 'date-fns';
import { Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface EventDatesDeadlinesProps {
  startDate: string;
  endDate: string;
  registrationDeadline?: string | null;
}

export function EventDatesDeadlines({ startDate, endDate, registrationDeadline }: EventDatesDeadlinesProps) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  const regDeadline = registrationDeadline ? new Date(registrationDeadline) : null;

  const getTimeRemaining = (date: Date) => {
    if (isPast(date)) return { text: 'Ended', isPast: true };
    
    const days = differenceInDays(date, now);
    const hours = differenceInHours(date, now) % 24;
    
    if (days > 0) {
      return { text: `${days} day${days !== 1 ? 's' : ''} ${hours} hr${hours !== 1 ? 's' : ''}`, isPast: false };
    }
    return { text: `${differenceInHours(date, now)} hours`, isPast: false };
  };

  const regRemaining = regDeadline ? getTimeRemaining(regDeadline) : null;
  const eventRemaining = getTimeRemaining(start);

  const dates = [
    {
      label: 'Registration Deadline',
      date: regDeadline,
      remaining: regRemaining,
      icon: AlertCircle,
      color: regRemaining?.isPast ? 'text-red-400' : 'text-orange-400',
      bgColor: regRemaining?.isPast ? 'bg-red-500/20' : 'bg-orange-500/20',
    },
    {
      label: 'Event Starts',
      date: start,
      remaining: eventRemaining,
      icon: Calendar,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
    },
    {
      label: 'Event Ends',
      date: end,
      remaining: getTimeRemaining(end),
      icon: Clock,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
  ].filter(d => d.date !== null);

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-orange-500 rounded-full" />
        Dates & Deadlines
      </h3>

      <div className="space-y-4">
        {dates.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`bg-[#151518] border border-white/10 rounded-xl p-6 transition-all hover:border-purple-500/30`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 ${item.bgColor} rounded-xl`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{item.label}</h4>
                    <p className="text-gray-400 text-sm mt-1">
                      {format(item.date!, 'EEEE, MMMM do, yyyy')}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {format(item.date!, 'h:mm a')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  {item.remaining?.isPast ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Completed
                    </span>
                  ) : (
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${item.bgColor} ${item.color}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {item.remaining?.text} left
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Duration info */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-purple-400" />
          <div>
            <span className="text-white font-medium">Event Duration: </span>
            <span className="text-gray-300">
              {differenceInDays(end, start)} days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
