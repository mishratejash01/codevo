import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Edit2, 
  Share2, 
  MapPin, 
  Check, 
  Loader2,
  Copy, 
  LayoutTemplate, 
  X, 
  UserCog, 
  ChevronLeft, 
  ChevronRight, 
  User, 
  Save, 
  Calendar, 
  Ticket, 
  Users,
  GraduationCap,
  Sparkles,
  Terminal,
  Shield,
  Zap,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// ----------------------------------------------------------------------
// 1. TYPES & INTERFACES
// ----------------------------------------------------------------------

interface ProfileData {
  id: string;
  username: string;
  full_name: string;
  institute_name: string;
  degree: string;
  branch: string;
  start_year: number;
  end_year: number;
  country: string;
  github_handle: string;
  linkedin_url: string;
  portfolio_url?: string;
  bio?: string;
  avatar_url?: string;
  contact_no?: string;
  cover_url?: string;
}

interface Registration {
    id: string;
    status: string;
    participation_type: 'Solo' | 'Team';
    team_name?: string;
    created_at: string;
    event: {
        title: string;
        slug: string;
        image_url: string;
        start_date: string;
        location: string;
    };
}

// ----------------------------------------------------------------------
// 2. ASSETS & CONSTANTS
// ----------------------------------------------------------------------

const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2068&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop", 
];

// ----------------------------------------------------------------------
// 3. SUB-COMPONENTS
// ----------------------------------------------------------------------

const SocialEditBlock = ({ 
  icon: Icon, 
  label, 
  value, 
  onChange, 
  colorClass 
}: { 
  icon: any, 
  label: string, 
  value: string, 
  onChange: (val: string) => void,
  colorClass: string
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value);

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  return (
    <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-[#0a0a0c]/50 transition-all duration-300 hover:border-white/10 hover:bg-[#0a0a0c]">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />
      
      <div className="flex items-center gap-4 p-4 relative z-10">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300", 
          colorClass, 
          "bg-white/5 text-gray-400 group-hover:scale-110 shadow-inner"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5 flex items-center gap-2">
            {label}
            {value && <Check className="w-3 h-3 text-green-500" />}
          </p>
          
          {isEditing ? (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Input 
                value={tempValue} 
                onChange={(e) => setTempValue(e.target.value)} 
                className="h-8 bg-black/50 border-white/20 text-xs font-mono text-white focus-visible:ring-cyan-500/50"
                placeholder={`https://...`}
                autoFocus
              />
              <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 shadow-[0_0_10px_rgba(22,163,74,0.4)]" onClick={handleSave}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10 text-zinc-400" onClick={() => setIsEditing(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-sm text-zinc-300 font-mono truncate cursor-pointer hover:text-white transition-colors" onClick={() => setIsEditing(true)}>
              {value || <span className="text-zinc-600 text-xs italic">Link not connected</span>}
            </p>
          )}
        </div>
        
        {!isEditing && (
          <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-600 hover:text-white hover:bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => setIsEditing(true)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

// --- THE GOD-LEVEL PROFILE ARTIFACT ---
const ProfileCardContent = ({ profile, isOwner, onEdit }: { profile: ProfileData, isOwner: boolean, onEdit?: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  
  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} | Codevo Identity`,
          text: `Check out ${profile.full_name}'s developer profile on Codevo.`,
          url: url
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Identity Link Copied", {
        description: "Share this link to show off your profile.",
        className: "bg-[#0a0a0c] border border-white/10 text-white"
      });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/u/${profile.username}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-md mx-auto group perspective-1000">
      
      {/* 1. Ambient God-Rays */}
      <div className="absolute -inset-0.5 bg-gradient-to-b from-cyan-500/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-1000" />
      
      {/* 2. The Artifact Container */}
      <div className="relative bg-[#050505]/90 backdrop-blur-2xl border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.01] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
        
        {/* Cinematic Header (Parallax) */}
        <div className="h-48 relative overflow-hidden">
           <div 
             className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110" 
             style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }} 
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#050505]" />
           
           {/* Glass Header Bar */}
           <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-20">
              <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                 <span className="text-[10px] font-bold text-white tracking-widest uppercase">Operative</span>
              </div>
              
              <div className="flex gap-2">
                {isOwner && onEdit && (
                  <button onClick={onEdit} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={handleShare} className="p-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all shadow-lg">
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
           </div>
        </div>

        {/* Identity Core */}
        <div className="relative px-8 pb-10 -mt-20">
           <div className="flex flex-col items-center">
              
              {/* Avatar Shield Mechanism */}
              <div className="relative mb-6 group/avatar">
                 {/* Rotating Rings */}
                 <div className="absolute -inset-1 rounded-full border border-dashed border-white/20 animate-spin-slow opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-700" />
                 <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500 via-violet-500 to-fuchsia-500 rounded-full blur opacity-20 group-hover/avatar:opacity-60 transition-opacity duration-500" />
                 
                 <Avatar className="w-32 h-32 border-[6px] border-[#050505] relative z-10 shadow-2xl bg-[#1a1a1c]">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-zinc-900 text-4xl font-black text-white">{profile.full_name?.[0]}</AvatarFallback>
                 </Avatar>
                 
                 {/* Level Badge */}
                 <div className="absolute -bottom-2 -right-2 z-20 bg-[#0a0a0c] text-white px-3 py-1 rounded-full border border-white/10 shadow-[0_5px_20px_-5px_rgba(0,0,0,1)] flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span className="text-[10px] font-bold tracking-wider">LVL 1</span>
                 </div>
              </div>

              {/* Name Data */}
              <div className="text-center space-y-2 mb-8 w-full">
                 <h1 className="text-3xl font-black text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/60">
                   {profile.full_name}
                 </h1>
                 
                 <div className="flex items-center justify-center gap-2">
                    <div 
                      onClick={copyLink}
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 cursor-pointer transition-all group/link"
                    >
                       <span className="text-xs font-mono text-zinc-400 group-hover/link:text-cyan-400 transition-colors">@{profile.username}</span>
                       {isCopied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3 text-zinc-600 group-hover/link:text-white transition-colors" />}
                    </div>
                    {profile.country && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-xs font-medium text-zinc-400">
                        <MapPin className="w-3 h-3" /> {profile.country}
                      </div>
                    )}
                 </div>
              </div>

              {/* Holographic Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-3 mb-8">
                 {profile.institute_name && (
                   <div className="relative overflow-hidden bg-white/[0.02] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group/stat hover:bg-white/[0.05] transition-colors">
                      <div className="p-2 rounded-full bg-purple-500/10 mb-2 group-hover/stat:scale-110 transition-transform">
                        <GraduationCap className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Affiliation</div>
                      <div className="text-xs font-bold text-white leading-tight line-clamp-2">{profile.institute_name}</div>
                   </div>
                 )}
                 {profile.degree && (
                   <div className="relative overflow-hidden bg-white/[0.02] rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center group/stat hover:bg-white/[0.05] transition-colors">
                      <div className="p-2 rounded-full bg-cyan-500/10 mb-2 group-hover/stat:scale-110 transition-transform">
                        <Terminal className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest mb-1">Focus</div>
                      <div className="text-xs font-bold text-white leading-tight line-clamp-2">{profile.degree}</div>
                   </div>
                 )}
              </div>

              {/* Narrative Bio */}
              {profile.bio && (
                <div className="w-full bg-[#0a0a0c] rounded-2xl p-5 border border-white/5 mb-8 relative overflow-hidden shadow-inner">
                   <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 via-blue-500 to-purple-500" />
                   <p className="text-sm text-zinc-300 leading-relaxed font-light text-left pl-2">
                     {profile.bio}
                   </p>
                </div>
              )}

              {/* Connection Hub */}
              <div className="w-full space-y-3">
                 <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest text-center mb-1">Establish Connection</div>
                 <div className="flex gap-3 justify-center">
                    {profile.github_handle && (
                      <a href={`https://github.com/${profile.github_handle.replace('@','')}`} target="_blank" className="h-12 w-12 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-black hover:border-white/30 transition-all hover:-translate-y-1 shadow-lg group/icon">
                        <Github className="w-6 h-6 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" className="h-12 w-12 rounded-xl bg-[#0077b5]/10 border border-[#0077b5]/20 flex items-center justify-center text-[#0077b5] hover:bg-[#0077b5] hover:text-white hover:border-[#0077b5] transition-all hover:-translate-y-1 shadow-lg group/icon">
                        <Linkedin className="w-6 h-6 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all hover:-translate-y-1 shadow-lg group/icon">
                        <Globe className="w-6 h-6 group-hover/icon:scale-110 transition-transform" />
                      </a>
                    )}
                 </div>
              </div>

           </div>
        </div>

        {/* Footer Brand Seal */}
        <div className="h-12 bg-black/60 border-t border-white/5 flex items-center justify-between px-8 backdrop-blur-md">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Network Active</span>
           </div>
           <div className="text-[10px] font-black text-zinc-700 font-neuropol uppercase tracking-[0.2em]">
              CODEVO <span className="text-zinc-500">ID</span>
           </div>
        </div>

      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. "HIT ME UP" WIDGET (EXPORTED)
// ----------------------------------------------------------------------

export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { 
    supabase.auth.getSession().then(({ data }) => setSession(data.session)); 
  }, []);

  useEffect(() => {
    const fetch = async () => {
      const q = session?.user?.id 
        ? supabase.from("profiles").select("*").eq("id", session.user.id) 
        : supabase.from("profiles").select("*").eq("username", defaultUsername);
      const { data } = await q.maybeSingle();
      if (data) setProfile(data as ProfileData);
    };
    fetch();
  }, [session, defaultUsername]);

  if (!profile) return null;
  const isOwner = session?.user?.id === profile.id;

  return (
    <div className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[50]">
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-auto py-8 pl-1 pr-2 rounded-l-2xl rounded-r-none bg-[#0a0a0c] border-l border-y border-white/20 hover:bg-black text-white shadow-[0_0_40px_-10px_rgba(255,255,255,0.15)] transition-all hover:pr-4 group relative overflow-hidden">
            {/* Neon Glow Line */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-cyan-500 via-purple-500 to-blue-500" />
            
            <div className="flex flex-col items-center gap-4 py-2">
               <div className="writing-mode-vertical text-[10px] font-black tracking-[0.3em] text-zinc-500 group-hover:text-white transition-colors rotate-180 uppercase">
                 Identity
               </div>
               <div className="p-2 rounded-full bg-white/5 border border-white/10 group-hover:border-cyan-500/50 transition-colors">
                 <User className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
               </div>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[450px] p-0 bg-transparent border-none shadow-none flex items-center mr-6 focus:outline-none">
           <div className="w-full relative">
             {/* Close Button Decor */}
             <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                <div className="w-1 h-1 rounded-full bg-white/20" />
                <div className="w-1 h-2 rounded-full bg-white/40" />
                <div className="w-1 h-1 rounded-full bg-white/20" />
             </div>
             <ProfileCardContent profile={profile} isOwner={isOwner} onEdit={() => navigate('/profile')} />
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// ----------------------------------------------------------------------
// 5. MAIN PROFILE PAGE
// ----------------------------------------------------------------------

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  // --- DATA FETCHING ---
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!username) {
          // --- EDIT MODE (My Profile) ---
          if (!user) { 
            if (isMounted) navigate("/auth"); 
            return; 
          }
          
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          
          const def: ProfileData = {
              id: user.id,
              username: profileData?.username || "", 
              full_name: profileData?.full_name || user.user_metadata?.full_name || "Agent",
              institute_name: profileData?.institute_name || "",
              degree: profileData?.degree || "",
              branch: profileData?.branch || "",
              start_year: profileData?.start_year || new Date().getFullYear(),
              end_year: profileData?.end_year || new Date().getFullYear() + 4,
              country: profileData?.country || "",
              github_handle: profileData?.github_handle || "",
              linkedin_url: profileData?.linkedin_url || "",
              portfolio_url: profileData?.portfolio_url || "",
              bio: profileData?.bio || "",
              avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || "",
              contact_no: profileData?.contact_no || "",
              cover_url: profileData?.cover_url || ""
          };
          
          if (isMounted) {
            setProfile(def); 
            setOriginalProfile(def); 
            setIsOwner(true);
          }
          
          // Fetch Events
          const { data: regs } = await supabase.from('event_registrations')
            .select(`*, event:events(*)`)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
            
          if (isMounted && regs) setRegistrations(regs as any);

        } else {
          // --- PUBLIC MODE (View Profile) ---
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("username", username)
            .maybeSingle();
          
          if (error) throw error;
          if (!data) { 
            toast.error("User Identity Not Found"); 
            if (isMounted) navigate("/"); 
            return; 
          }
          
          if (isMounted) {
            setProfile(data as ProfileData);
            if (user && data.id === user.id) { 
              setIsOwner(true); 
              setOriginalProfile(data as ProfileData); 
            }
          }
        }
      } catch (error: any) {
        console.error("Profile load error:", error);
        toast.error("Failed to load profile data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    init();

    return () => { isMounted = false; };
  }, [username, navigate]);

  // --- SAVE HANDLER ---
  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try { 
        const { error } = await supabase.from("profiles").upsert({ 
          ...profile, 
          updated_at: new Date().toISOString() 
        }); 
        
        if (error) throw error;
        
        toast.success("Identity Protocol Updated", {
          className: "bg-[#0a0a0c] text-white border-green-500/30"
        }); 
        setOriginalProfile(profile);
    } catch (e: any) { 
        toast.error("Update Failed: " + e.message); 
    } 
    finally { setIsSaving(false); }
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      <p className="text-xs font-mono text-zinc-500 animate-pulse">DECRYPTING IDENTITY...</p>
    </div>
  );
  
  if (!profile) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
      <h2 className="text-xl font-bold">Profile Not Found</h2>
      <Button variant="link" onClick={() => navigate("/")} className="text-cyan-500 mt-4">Return Home</Button>
    </div>
  );

  // ----------------------------------------------------------------------
  // 6. PUBLIC VIEW RENDER (Marketing Page)
  // ----------------------------------------------------------------------
  
  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#020202] flex flex-col relative overflow-hidden font-sans text-white">
        
        {/* --- DEEP SPACE BACKGROUND --- */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.07] pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full blur-[150px] animate-pulse duration-[8000ms]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-cyan-900/10 rounded-full blur-[150px] animate-pulse duration-[10000ms]" />
        
        {/* Navigation */}
        <div className="relative z-10 p-8 flex justify-between items-center max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
                <ChevronLeft className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">Return to Base</span>
                <span className="text-lg font-black font-neuropol text-white">CODEVO</span>
              </div>
           </div>
           
           <Button onClick={() => navigate('/auth')} className="h-11 px-6 rounded-full bg-cyan-600/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 hover:border-cyan-500/50 transition-all shadow-[0_0_20px_-5px_rgba(6,182,212,0.3)]">
             Initialize Your ID <ChevronRight className="w-4 h-4 ml-2" />
           </Button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-7xl mx-auto">
           <div className="mb-12 text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                 <Globe className="w-3 h-3 text-cyan-400" />
                 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Public Neural Link</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight drop-shadow-2xl">
                Developer <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Identity</span>
              </h1>
           </div>
           
           <div className="w-full flex justify-center">
             <ProfileCardContent profile={profile} isOwner={false} />
           </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------------------------
  // 7. EDIT VIEW RENDER (Dashboard)
  // ----------------------------------------------------------------------
  
  const isProfileDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  return (
    <div className="min-h-screen bg-[#020202] text-white pt-24 pb-20 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-900/5 rounded-full blur-[120px]" />
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/5 rounded-full blur-[120px]" />
         <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 relative z-10">
        
        {/* --- LEFT COLUMN: EDITOR --- */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-12">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div>
              <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                <UserCog className="w-8 h-8 text-cyan-500" /> Identity Config
              </h1>
              <p className="text-zinc-400 text-sm">Manage your public-facing developer persona.</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!isProfileDirty || isSaving} 
              className={cn(
                "h-12 px-8 rounded-xl font-bold tracking-wide transition-all shadow-lg",
                isProfileDirty 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20" 
                  : "bg-zinc-900 text-zinc-500 border border-white/5"
              )}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "SYNCING..." : "SAVE CHANGES"}
            </Button>
          </div>

          {/* Core Data Form */}
          <div className="space-y-6">
             <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <Sparkles className="w-4 h-4 text-purple-500"/> Core Data
             </h2>
             <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-400 uppercase tracking-wider">Full Name</Label>
                   <Input 
                     value={profile.full_name} 
                     onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                     className="bg-[#0a0a0c] border-white/10 h-12 rounded-xl focus:border-cyan-500/50 focus:ring-0 transition-colors text-white" 
                   />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-400 uppercase tracking-wider">Username</Label>
                   <div className="relative">
                      <span className="absolute left-4 top-3.5 text-zinc-500">@</span>
                      <Input 
                        value={profile.username} 
                        onChange={(e) => setProfile({...profile, username: e.target.value})} 
                        className="bg-[#0a0a0c] border-white/10 h-12 rounded-xl pl-8 focus:border-cyan-500/50 focus:ring-0 transition-colors text-white" 
                      />
                   </div>
                </div>
             </div>
             <div className="space-y-2">
                <Label className="text-xs text-zinc-400 uppercase tracking-wider">Bio / Directive</Label>
                <Textarea 
                  value={profile.bio || ''} 
                  onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                  className="bg-[#0a0a0c] border-white/10 min-h-[120px] rounded-xl focus:border-cyan-500/50 focus:ring-0 transition-colors text-white leading-relaxed p-4 resize-none" 
                  placeholder="Brief description of your skills and mission..." 
                />
             </div>
          </div>

          {/* Visual Assets Selector */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-blue-500"/> Cover Artifact
                </h2>
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => scrollSlider('left')} className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => scrollSlider('right')} className="h-8 w-8 rounded-full border border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
                </div>
             </div>
             
             {/* Main Preview */}
             <div className="relative h-56 rounded-2xl overflow-hidden border border-white/10 group cursor-pointer shadow-2xl">
                <div className="absolute inset-0 bg-cover bg-center transition-all duration-700 group-hover:scale-105" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }} />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                   <div className="px-4 py-2 rounded-full bg-black/50 border border-white/20 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                     <Edit2 className="w-3 h-3" /> Change Cover
                   </div>
                </div>
                
                {/* Avatar Overlay */}
                <div className="absolute bottom-6 left-8 flex items-end gap-6 z-20">
                  <Avatar className="w-24 h-24 border-4 border-[#020202] shadow-2xl">
                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-[#1a1a1c] text-2xl font-bold">{profile.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
             </div>

             {/* Thumbnail Slider */}
             <div ref={sliderRef} className="flex gap-3 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory">
                {COVER_TEMPLATES.map((url, i) => (
                   <div 
                     key={i} 
                     onClick={() => setProfile({...profile, cover_url: url})} 
                     className={cn(
                       "flex-shrink-0 w-32 aspect-video rounded-xl bg-cover bg-center cursor-pointer border-2 transition-all hover:scale-105 snap-start", 
                       profile.cover_url === url ? "border-cyan-500 shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)] scale-105" : "border-transparent opacity-60 hover:opacity-100"
                     )} 
                     style={{ backgroundImage: `url('${url}')` }} 
                   />
                ))}
             </div>
          </div>

          {/* Social Connections */}
          <div className="space-y-6">
             <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <Share2 className="w-4 h-4 text-green-500"/> Uplink Connections
             </h2>
             <div className="grid gap-3">
                <SocialEditBlock 
                  icon={Github} label="GitHub" 
                  value={profile.github_handle} 
                  onChange={(v: string) => setProfile({...profile, github_handle: v})} 
                  colorClass="bg-zinc-900 group-hover:bg-white group-hover:text-black" 
                />
                <SocialEditBlock 
                  icon={Linkedin} label="LinkedIn" 
                  value={profile.linkedin_url} 
                  onChange={(v: string) => setProfile({...profile, linkedin_url: v})} 
                  colorClass="bg-[#0077b5]/10 text-[#0077b5] group-hover:bg-[#0077b5] group-hover:text-white" 
                />
                <SocialEditBlock 
                  icon={Globe} label="Portfolio" 
                  value={profile.portfolio_url} 
                  onChange={(v: string) => setProfile({...profile, portfolio_url: v})} 
                  colorClass="bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white" 
                />
             </div>
          </div>

          {/* Education & Academic */}
          <div className="space-y-6">
             <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
               <GraduationCap className="w-4 h-4 text-yellow-500"/> Academic Records
             </h2>
             <div className="grid md:grid-cols-2 gap-5">
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-400 uppercase tracking-wider">Institution</Label>
                   <Input value={profile.institute_name} onChange={(e) => setProfile({...profile, institute_name: e.target.value})} className="bg-[#0a0a0c] border-white/10 h-11 transition-colors" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-400 uppercase tracking-wider">Degree</Label>
                   <Input value={profile.degree} onChange={(e) => setProfile({...profile, degree: e.target.value})} className="bg-[#0a0a0c] border-white/10 h-11 transition-colors" />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs text-zinc-400 uppercase tracking-wider">Branch / Major</Label>
                   <Input value={profile.branch} onChange={(e) => setProfile({...profile, branch: e.target.value})} className="bg-[#0a0a0c] border-white/10 h-11 transition-colors" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label className="text-xs text-zinc-400 uppercase tracking-wider">Start Year</Label>
                      <Input type="number" value={profile.start_year} onChange={(e) => setProfile({...profile, start_year: parseInt(e.target.value)})} className="bg-[#0a0a0c] border-white/10 h-11 transition-colors" />
                   </div>
                   <div className="space-y-2">
                      <Label className="text-xs text-zinc-400 uppercase tracking-wider">End Year</Label>
                      <Input type="number" value={profile.end_year} onChange={(e) => setProfile({...profile, end_year: parseInt(e.target.value)})} className="bg-[#0a0a0c] border-white/10 h-11 transition-colors" />
                   </div>
                </div>
             </div>
          </div>

          {/* Event History */}
          <div className="pt-10 border-t border-white/10 space-y-6">
             <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-orange-500" /> Mission Log (Events)
             </h2>
             
             {registrations.length > 0 ? (
               <div className="grid gap-3">
                 {registrations.map(r => (
                   <div key={r.id} className="relative overflow-hidden bg-[#0a0a0c] p-4 rounded-xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 group hover:border-white/10 transition-all">
                      <div className="flex items-center gap-4 w-full md:w-auto">
                         <div className="w-16 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                            <img src={r.event.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                         </div>
                         <div>
                            <div className="font-bold text-white text-sm group-hover:text-cyan-400 transition-colors">{r.event.title}</div>
                            <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                               <Calendar className="w-3 h-3" />
                               {format(new Date(r.event.start_date), 'MMM d, yyyy')}
                            </div>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                         {r.participation_type === 'Team' && (
                           <div className="text-xs text-zinc-500 flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded">
                              <Users className="w-3 h-3" /> Team: <span className="text-white">{r.team_name}</span>
                           </div>
                         )}
                         <Badge variant="outline" className={cn(
                           "border-white/10",
                           r.status === 'verified' ? "text-green-400 bg-green-500/10" : "text-yellow-400 bg-yellow-500/10"
                         )}>
                           {r.status}
                         </Badge>
                      </div>
                   </div>
                 ))}
               </div>
             ) : (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500 bg-[#0a0a0c] rounded-2xl border border-dashed border-white/10">
                   <Ticket className="w-8 h-8 opacity-20 mb-2" />
                   <p className="text-sm">No active mission registrations found.</p>
                   <Button variant="link" onClick={() => navigate('/events')} className="text-cyan-500">Explore Events</Button>
                </div>
             )}
          </div>
        </div>

        {/* --- RIGHT COLUMN: LIVE PREVIEW --- */}
        <div className="lg:col-span-5 xl:col-span-4 hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <div className="flex items-center justify-between">
               <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                  </span>
                  Live Artifact Preview
               </h2>
            </div>
            
            <div className="transform transition-transform hover:scale-[1.02] duration-700">
               <ProfileCardContent profile={profile} isOwner={true} />
            </div>
            
            <div className="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex gap-4 items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
               <div className="p-2.5 bg-blue-500/20 rounded-xl text-blue-400 shrink-0">
                 <Shield className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-blue-100 mb-1">Optimization Tip</h4>
                  <p className="text-xs text-blue-200/60 leading-relaxed">
                    Connect your GitHub and LinkedIn to increase your "Trust Score". Verified profiles receive priority access to Hackathons.
                  </p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
