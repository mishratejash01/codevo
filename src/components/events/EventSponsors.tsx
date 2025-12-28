import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Globe } from "lucide-react";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  type: string;
  tier: string | null;
}

export function EventSponsors({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSponsors();
  }, [eventId]);

  async function getSponsors() {
    const { data, error } = await supabase
      .from("event_sponsors" as any)
      .select("*")
      .eq("event_id", eventId);

    if (!error && data) {
      setItems(data as unknown as Sponsor[]);
    }
    setLoading(false);
  }

  if (loading) return (
    <div className="flex justify-center p-12">
      <Loader2 className="animate-spin h-8 w-8 text-[#ff8c00]" />
    </div>
  );

  const sponsors = items.filter(i => i.type === 'sponsor');
  const partners = items.filter(i => i.type === 'partner');

  if (items.length === 0) {
    return (
      <div className="py-[100px] text-center border border-dashed border-[#1a1a1a] bg-[#050505]/50 rounded-none">
        <p className="text-[0.8rem] text-[#666666] uppercase tracking-[2px] font-bold">
          Patrons Pending
        </p>
        <p className="text-[#333] text-sm mt-2">No sponsors or partners have been announced yet.</p>
      </div>
    );
  }

  const PatronGrid = ({ title, data }: { title: string, data: Sponsor[] }) => (
    <div className="w-full">
      {/* Section Header */}
      <div className="flex items-center gap-[15px] mb-[50px] mt-[80px] first:mt-0">
        <div className="w-[2px] h-[24px] bg-[#ff8c00]" />
        <h3 className="font-serif text-[2.2rem] font-normal tracking-[-0.5px] text-white">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[20px]">
        {data.map((item) => (
          <div key={item.id} className="bg-[#050505] border border-[#1a1a1a] p-[40px_30px] flex flex-col items-center text-center transition-all duration-400 hover:border-[#666666] group">
            {/* Logo Box */}
            <div className="w-full h-[120px] flex items-center justify-center mb-[30px] border-b border-[#1a1a1a] pb-[30px]">
              {item.logo_url ? (
                <img 
                  src={item.logo_url} 
                  alt={item.name} 
                  className="max-w-[140px] max-h-[60px] grayscale brightness-[0.8] opacity-70 group-hover:brightness-100 group-hover:opacity-100 transition-all duration-400" 
                />
              ) : (
                <Globe className="w-12 h-12 text-[#1a1a1a] group-hover:text-[#333] transition-colors" />
              )}
            </div>
            
            {/* Metadata */}
            {item.tier && (
              <span className="text-[0.6rem] uppercase tracking-[3px] text-[#ff8c00] mb-[15px] font-bold">
                {item.tier}
              </span>
            )}
            
            <h4 className="font-serif text-[1.5rem] font-normal text-white mb-[12px]">
              {item.name}
            </h4>
            
            {item.description && (
              <p className="text-[0.85rem] text-[#666666] leading-[1.6] font-light mb-[30px] min-h-[50px] line-clamp-3">
                {item.description}
              </p>
            )}
            
            {/* Action Link */}
            {item.website_url && (
              <button 
                className="mt-auto inline-flex items-center gap-[10px] text-white bg-transparent border border-[#1a1a1a] px-[20px] py-[12px] text-[0.7rem] uppercase tracking-[2px] cursor-pointer transition-all duration-300 hover:bg-white hover:text-black hover:border-white"
                onClick={() => window.open(item.website_url!, '_blank')}
              >
                Visit Website
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-[900px] mx-auto font-sans selection:bg-orange-500/30">
      {sponsors.length > 0 && <PatronGrid title="Official Patrons" data={sponsors} />}
      {partners.length > 0 && <PatronGrid title="Community Partners" data={partners} />}
    </div>
  );
}
