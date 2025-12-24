import { Calendar, MapPin, Users, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface EventDetailsContentProps {
  event: {
    content: string | null;
    short_description: string;
    rules: string | null;
    venue: string | null;
    location: string | null;
    mode: string;
    organizer_name: string | null;
    organizer_logo: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    current_participants: number | null;
    max_participants: number | null;
    start_date: string;
  };
}

export function EventDetailsContent({ event }: EventDetailsContentProps) {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
          <div className="w-1 h-6 bg-purple-500 rounded-full" />
          About the Event
        </h3>
        <div className="text-gray-300 whitespace-pre-wrap leading-relaxed text-base bg-[#151518]/50 p-6 rounded-2xl border border-white/5">
          {event.content || event.short_description}
        </div>
      </div>

      {/* Rules & Guidelines */}
      {event.rules && (
        <div>
          <h4 className="text-xl font-bold text-white mb-4">Rules & Guidelines</h4>
          <div className="text-gray-300 whitespace-pre-wrap leading-relaxed bg-[#151518]/50 p-6 rounded-2xl border border-white/5">
            {event.rules}
          </div>
        </div>
      )}

      {/* Event Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#151518] border border-white/10 rounded-xl p-4 text-center">
          <Users className="w-6 h-6 text-purple-400 mx-auto mb-2" />
          <div className="text-2xl font-bold text-white">{event.current_participants || 0}</div>
          <div className="text-gray-400 text-xs">Registered</div>
        </div>
        
        {event.max_participants && (
          <div className="bg-[#151518] border border-white/10 rounded-xl p-4 text-center">
            <Eye className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{event.max_participants}</div>
            <div className="text-gray-400 text-xs">Max Capacity</div>
          </div>
        )}

        <div className="bg-[#151518] border border-white/10 rounded-xl p-4 text-center">
          <MapPin className="w-6 h-6 text-green-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-white">{event.mode}</div>
          <div className="text-gray-400 text-xs">Mode</div>
        </div>

        <div className="bg-[#151518] border border-white/10 rounded-xl p-4 text-center">
          <Calendar className="w-6 h-6 text-orange-400 mx-auto mb-2" />
          <div className="text-lg font-bold text-white">{format(new Date(event.start_date), 'MMM dd')}</div>
          <div className="text-gray-400 text-xs">Starts</div>
        </div>
      </div>

      {/* Organizer Info */}
      {event.organizer_name && (
        <div className="bg-[#151518] border border-white/10 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-4">Organizer</h4>
          <div className="flex items-center gap-4">
            {event.organizer_logo && (
              <img 
                src={event.organizer_logo} 
                alt={event.organizer_name}
                className="w-16 h-16 rounded-xl object-cover"
              />
            )}
            <div>
              <div className="text-white font-medium">{event.organizer_name}</div>
              {event.contact_email && (
                <a href={`mailto:${event.contact_email}`} className="text-purple-400 text-sm hover:underline">
                  {event.contact_email}
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Venue */}
      {event.venue && (
        <div className="bg-[#151518] border border-white/10 rounded-xl p-6">
          <h4 className="text-lg font-bold text-white mb-2">Venue</h4>
          <p className="text-gray-300">{event.venue}</p>
          {event.location && <p className="text-gray-400 text-sm mt-1">{event.location}</p>}
        </div>
      )}
    </div>
  );
}
