import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Award, Gift, Loader2 } from 'lucide-react';

interface Prize {
  id: string;
  position: number;
  title: string;
  prize_value: string | null;
  description: string | null;
  icon_url: string | null;
}

interface EventPrizesProps {
  eventId: string;
  prizePool?: string | null;
}

const positionIcons = [
  { icon: Trophy, color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { icon: Medal, color: 'text-gray-300', bg: 'bg-gray-500/20', border: 'border-gray-500/30' },
  { icon: Award, color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
];

export function EventPrizes({ eventId, prizePool }: EventPrizesProps) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrizes();
  }, [eventId]);

  async function fetchPrizes() {
    const { data, error } = await supabase
      .from('event_prizes')
      .select('*')
      .eq('event_id', eventId)
      .order('position', { ascending: true });

    if (!error && data) {
      setPrizes(data);
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
        <div className="w-1 h-6 bg-yellow-500 rounded-full" />
        Prizes & Rewards
      </h3>

      {/* Total Prize Pool */}
      {prizePool && (
        <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-8 text-center">
          <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
          <div className="text-sm text-yellow-400/80 uppercase tracking-wider mb-2">Total Prize Pool</div>
          <div className="text-4xl md:text-5xl font-bold text-white">{prizePool}</div>
        </div>
      )}

      {prizes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {prizes.map((prize, index) => {
            const styling = positionIcons[index] || { 
              icon: Gift, 
              color: 'text-purple-400', 
              bg: 'bg-purple-500/20',
              border: 'border-purple-500/30'
            };
            const Icon = styling.icon;

            return (
              <div
                key={prize.id}
                className={`relative p-6 rounded-2xl border ${styling.border} ${styling.bg} transition-all hover:scale-105`}
              >
                <div className="absolute -top-3 left-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${styling.bg} ${styling.color} border ${styling.border}`}>
                    #{prize.position}
                  </span>
                </div>

                <div className="pt-4 text-center">
                  <Icon className={`w-10 h-10 ${styling.color} mx-auto mb-3`} />
                  <h4 className="text-lg font-bold text-white mb-1">{prize.title}</h4>
                  {prize.prize_value && (
                    <div className={`text-2xl font-bold ${styling.color}`}>{prize.prize_value}</div>
                  )}
                  {prize.description && (
                    <p className="text-sm text-gray-400 mt-2">{prize.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : !prizePool ? (
        <div className="text-center py-12 bg-[#151518] rounded-2xl border border-white/10">
          <Gift className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-400">Prize details will be announced soon!</p>
        </div>
      ) : (
        <div className="bg-[#151518] rounded-2xl border border-white/10 p-6">
          <p className="text-gray-300">
            Plus certificates, swag kits, and exciting opportunities for all participants!
          </p>
        </div>
      )}
    </div>
  );
}
