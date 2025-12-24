import { Users, GraduationCap, MapPin, Briefcase, CheckCircle } from 'lucide-react';
import { Json } from '@/integrations/supabase/types';

interface EventEligibilityProps {
  eligibilityCriteria: Json | null;
  minTeamSize?: number | null;
  maxTeamSize?: number | null;
  allowSolo?: boolean | null;
  mode?: string;
  location?: string | null;
}

interface CriteriaItem {
  type: string;
  value: string;
}

export function EventEligibility({ 
  eligibilityCriteria, 
  minTeamSize = 1, 
  maxTeamSize = 4,
  allowSolo = true,
  mode,
  location
}: EventEligibilityProps) {
  // Parse eligibility criteria
  const criteria: CriteriaItem[] = Array.isArray(eligibilityCriteria) 
    ? (eligibilityCriteria as unknown as CriteriaItem[])
    : [];

  const defaultCriteria = [
    { type: 'education', value: 'Open to all students', icon: GraduationCap },
    { type: 'location', value: mode === 'Online' ? 'Participants from anywhere' : location || 'Check event details', icon: MapPin },
  ];

  const teamSizeText = minTeamSize === maxTeamSize 
    ? `${minTeamSize} member${minTeamSize !== 1 ? 's' : ''}`
    : `${minTeamSize} - ${maxTeamSize} members`;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
        <div className="w-1 h-6 bg-green-500 rounded-full" />
        Eligibility
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Team Size */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Team Size</h4>
              <p className="text-gray-400 text-sm mt-1">{teamSizeText}</p>
              {allowSolo && minTeamSize === 1 && (
                <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Solo participation allowed
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mode */}
        <div className="bg-[#151518] border border-white/10 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <MapPin className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h4 className="font-medium text-white">Mode</h4>
              <p className="text-gray-400 text-sm mt-1">{mode || 'Online'}</p>
              {location && mode !== 'Online' && (
                <p className="text-xs text-gray-500 mt-1">{location}</p>
              )}
            </div>
          </div>
        </div>

        {/* Custom criteria */}
        {criteria.length > 0 ? (
          criteria.map((item, index) => (
            <div key={index} className="bg-[#151518] border border-white/10 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="font-medium text-white capitalize">{item.type}</h4>
                  <p className="text-gray-400 text-sm mt-1">{item.value}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <>
            {defaultCriteria.map((item, index) => (
              <div key={index} className="bg-[#151518] border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <item.icon className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white capitalize">{item.type}</h4>
                    <p className="text-gray-400 text-sm mt-1">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
