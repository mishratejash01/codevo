import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Globe, Handshake, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  description: string | null;
  type: 'sponsor' | 'partner'; 
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
      setItems(data);
    }
    setLoading(false);
  }

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin h-8 w-8 text-zinc-500" /></div>;

  const sponsors = items.filter(i => i.type === 'sponsor');
  const partners = items.filter(i => i.type === 'partner');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-zinc-500 bg-white/5 rounded-3xl border border-white/5 border-dashed">
        <Handshake className="w-12 h-12 mb-4 opacity-50" />
        <p>No sponsors or partners have been announced yet.</p>
      </div>
    );
  }

  // Reusable Grid Component for consistency
  const Grid = ({ title, data, icon: Icon }: { title: string, data: Sponsor[], icon: any }) => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
        <div className="p-2 bg-white/10 rounded-lg"><Icon className="w-5 h-5 text-primary" /></div>
        {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-2xl bg-[#151518] border border-white/10 p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_-10px_rgba(var(--primary),0.3)]">
            <div className="relative z-10 flex flex-col items-center text-center h-full">
              {/* Logo Box */}
              <div className="w-full h-32 mb-6 rounded-xl bg-black/40 flex items-center justify-center p-6 overflow-hidden border border-white/5 group-hover:border-white/20 transition-colors">
                {item.logo_url ? (
                  <img src={item.logo_url} alt={item.name} className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                ) : (
                  <Globe className="w-12 h-12 text-zinc-800 group-hover:text-zinc-600 transition-colors" />
                )}
              </div>
              
              {/* Tier Badge (Optional) */}
              {item.tier && (
                <div className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {item.tier}
                  </span>
                </div>
              )}
              
              <h4 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
              
              {item.description && (
                <p className="text-sm text-zinc-400 mb-6 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              )}
              
              <div className="mt-auto w-full pt-4 border-t border-white/5">
                {item.website_url ? (
                  <Button 
                    variant="ghost" 
                    className="w-full h-9 text-zinc-500 hover:text-white hover:bg-white/5"
                    onClick={() => window.open(item.website_url!, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Visit Website
                  </Button>
                ) : <div className="h-9" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-16 animate-in fade-in duration-500">
      {sponsors.length > 0 && <Grid title="Official Sponsors" data={sponsors} icon={Star} />}
      {partners.length > 0 && <Grid title="Community Partners" data={partners} icon={Handshake} />}
    </div>
  );
}
