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
  // Parse eligibility criteria from dynamic data
  const criteria: CriteriaItem[] = Array.isArray(eligibilityCriteria) 
    ? (eligibilityCriteria as unknown as CriteriaItem[])
    : [];

  const teamSizeText = minTeamSize === maxTeamSize 
    ? `${minTeamSize} Member${minTeamSize !== 1 ? 's' : ''}`
    : `${minTeamSize} — ${maxTeamSize} Members`;

  return (
    <div className="w-full max-w-[850px] mx-auto font-sans selection:bg-orange-500/30">
      
      {/* --- Section Header --- */}
      <div className="flex items-center gap-[15px] mb-[50px]">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          Participation Requirements
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        
        {/* --- Card 1: Team Size --- */}
        <div className="bg-[#050505] border border-[#1a1a1a] p-[35px] flex flex-col justify-between transition-all hover:border-[#333] group">
          <div>
            <span className="block text-[0.65rem] uppercase tracking-[3px] text-[#666666] mb-[20px] font-bold">
              Squad Size
            </span>
            <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[8px]">
              {teamSizeText}
            </h4>
            <p className="text-[#666666] text-[0.85rem] font-light leading-[1.5]">
              Teams must be finalized before the event starts. Most participants join in groups of three.
            </p>
          </div>
          
          {(allowSolo && minTeamSize === 1) && (
            <div className="mt-[25px] inline-flex items-center gap-[12px] px-[16px] py-[10px] border border-[#1a1a1a] bg-white/[0.02] w-fit">
              <div className="text-[#00ff88] flex items-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-[0.65rem] uppercase tracking-[2px] text-white font-semibold">
                Solo allowed
              </span>
            </div>
          )}
        </div>

        {/* --- Card 2: Mode/Format --- */}
        <div className="bg-[#050505] border border-[#1a1a1a] p-[35px] flex flex-col justify-between transition-all hover:border-[#333] group">
          <div>
            <span className="block text-[0.65rem] uppercase tracking-[3px] text-[#666666] mb-[20px] font-bold">
              Event Format
            </span>
            <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[8px]">
              {mode === 'Online' ? 'Remote Access' : (mode || 'Global Access')}
            </h4>
            <p className="text-[#666666] text-[0.85rem] font-light leading-[1.5]">
              {mode === 'Online' 
                ? 'Participate remotely from anywhere in the world via our digital protocol hub.' 
                : (location ? `Join us in person at ${location} for the physical assembly.` : 'Participate via designated channels.')}
            </p>
          </div>
          
          {(mode === 'Online' || !location) && (
            <div className="mt-[25px] inline-flex items-center gap-[12px] px-[16px] py-[10px] border border-[#1a1a1a] bg-white/[0.02] w-fit">
              <div className="text-[#00ff88] flex items-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <span className="text-[0.65rem] uppercase tracking-[2px] text-white font-semibold">
                Global Entry
              </span>
            </div>
          )}
        </div>

        {/* --- Dynamic Custom Criteria or Defaults --- */}
        {criteria.length > 0 ? (
          criteria.map((item, index) => (
            <div key={index} className="bg-[#050505] border border-[#1a1a1a] p-[35px] flex flex-col justify-between transition-all hover:border-[#333] group">
              <div>
                <span className="block text-[0.65rem] uppercase tracking-[3px] text-[#666666] mb-[20px] font-bold capitalize">
                  {item.type}
                </span>
                <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[8px]">
                  {item.value}
                </h4>
                <p className="text-[#666666] text-[0.85rem] font-light leading-[1.5]">
                  Standard assembly requirements apply. Ensure your credentials meet the verification threshold.
                </p>
              </div>
            </div>
          ))
        ) : (
          <>
            {/* Default Card 3: Background */}
            <div className="bg-[#050505] border border-[#1a1a1a] p-[35px] flex flex-col justify-between transition-all hover:border-[#333] group">
              <div>
                <span className="block text-[0.65rem] uppercase tracking-[3px] text-[#666666] mb-[20px] font-bold">
                  Background
                </span>
                <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[8px]">
                  Open to Everyone
                </h4>
                <p className="text-[#666666] text-[0.85rem] font-light leading-[1.5]">
                  While focused on students, the event welcomes professionals, creators, and hobbyists from all fields.
                </p>
              </div>
            </div>

            {/* Default Card 4: Experience */}
            <div className="bg-[#050505] border border-[#1a1a1a] p-[35px] flex flex-col justify-between transition-all hover:border-[#333] group">
              <div>
                <span className="block text-[0.65rem] uppercase tracking-[3px] text-[#666666] mb-[20px] font-bold">
                  Experience Level
                </span>
                <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[8px]">
                  No Minimum
                </h4>
                <p className="text-[#666666] text-[0.85rem] font-light leading-[1.5]">
                  Whether you are an expert or just starting, we provide the tools and mentors to help you build.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
