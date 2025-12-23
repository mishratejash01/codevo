import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Edit2, 
  Share,
  MapPin, 
  Check,
  Loader2,
  MessageSquareText,
  Phone,
  ArrowRight,
  Link as LinkIcon,
  Copy,
  LayoutTemplate,
  X,
  UserCog,
  ChevronLeft,
  ChevronRight,
  User,
  Save,
  AlertCircle,
  Calendar,
  Ticket,
  Users
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// --- Types ---
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

// --- Constants: Premium Abstract Covers ---
const COVER_TEMPLATES = [
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?q=80&w=2068&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=2074&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1506318137071-a8bcbf6755dd?q=80&w=2070&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1492321936769-b49830bc1d1e?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?q=80&w=1974&auto=format&fit=crop", 
  "https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=2070&auto=format&fit=crop", 
];

// --- Helper Functions ---
const getLinkedInUsername = (url?: string) => {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
};

// --- SUB-COMPONENT: Social Edit Block ---
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

  // Sync temp value when prop changes
  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(tempValue);
    setIsEditing(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#121214] border border-white/5 hover:border-white/10 transition-all group">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors", colorClass, "bg-white/5 text-gray-400 group-hover:text-white")}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input 
              value={tempValue} 
              onChange={(e) => setTempValue(e.target.value)} 
              className="h-8 bg-black/50 border-white/20 text-sm focus-visible:ring-primary/50"
              placeholder={`Enter ${label}...`}
              autoFocus
            />
            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={handleSave}><Check className="w-4 h-4" /></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/10" onClick={() => setIsEditing(false)}><X className="w-4 h-4" /></Button>
          </div>
        ) : (
          <p className="text-sm text-white font-medium truncate font-mono">{value || <span className="text-white/20 italic">Not connected</span>}</p>
        )}
      </div>
      {!isEditing && (
        <Button size="icon" variant="ghost" className="h-9 w-9 text-white/30 hover:text-white hover:bg-white/10" onClick={() => setIsEditing(true)}>
          <Edit2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: Profile Card (The Preview) ---
const ProfileCardContent = ({ profile, isOwner, onEdit }: { profile: ProfileData, isOwner: boolean, onEdit?: () => void }) => {
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const navigate = useNavigate();

  // Updated Share Logic
  const handleShare = async () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.full_name} | Codevo Profile`,
          text: `Check out ${profile.full_name}'s developer profile on Codevo.`,
          url: url
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback
      navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleLinkClick = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  const displayUrl = `${window.location.host}/u/${profile.username}`;
  const linkedInUser = getLinkedInUsername(profile.linkedin_url);
  
  const avatarSources = [
    profile.avatar_url,
    linkedInUser ? `https://unavatar.io/linkedin/${linkedInUser}` : null,
    `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`
  ].filter(Boolean) as string[];

  return (
    <div className="h-full w-full bg-[#0c0c0e] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans border border-white/10 relative">
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="relative h-48 bg-cover bg-center shrink-0" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}>
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"></div>
          <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start text-white z-10">
            <div className="flex items-center mt-1">
              <span className="font-neuropol font-bold text-lg tracking-widest text-white/90 drop-shadow-md">
                COD<span className="text-[1.2em] lowercase relative -top-[1px] mx-[1px] inline-block text-white">é</span>VO
              </span>
            </div>
            <div className="flex gap-2">
              {isOwner && onEdit && (
                <button onClick={onEdit} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              )}
              <button onClick={handleShare} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                <Share className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-8 relative">
          <div className="-mt-16 mb-4 relative z-20 flex justify-center">
            <Avatar className="w-32 h-32 border-[4px] border-[#0c0c0e] shadow-2xl ring-1 ring-white/10 bg-[#1a1a1c]">
              {avatarSources.map((src) => <AvatarImage key={src} src={src} className="object-cover" />)}
              <AvatarFallback className="bg-[#1a1a1c] text-4xl font-bold text-white/40">{profile.full_name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
            <div onClick={handleLinkClick} className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group">
              {isLinkCopied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3 text-white/50 group-hover:text-white" />}
              <span className="text-sm font-medium text-white/70 group-hover:text-white truncate max-w-[200px]">{displayUrl}</span>
              <Copy className="w-3 h-3 text-white/30 group-hover:text-white/70 ml-1" />
            </div>
            {profile.country && (
              <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium uppercase tracking-wider">
                <MapPin className="w-3 h-3" /><span>{profile.country}</span>
              </div>
            )}
            {profile.bio && <div className="mt-5 text-gray-400 text-sm leading-relaxed text-center px-2 line-clamp-4"><p>{profile.bio}</p></div>}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#24292e] hover:text-white hover:border-transparent transition-all shadow-sm"><Github className="w-6 h-6" /></a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#0077b5] hover:text-white hover:border-transparent transition-all shadow-sm"><Linkedin className="w-6 h-6" /></a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm"><Globe className="w-6 h-6" /></a>
            )}
          </div>
        </div>

        <div className="px-8"><div className="w-full h-px bg-white/5" /></div>

        {profile.institute_name && (
          <div className="p-6 text-center">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600 mb-3">Education</h2>
            <div className="inline-block text-center">
              <p className="font-bold text-cyan-400 text-base leading-tight">{profile.institute_name}</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">{profile.degree} • {profile.branch}</p>
              <p className="text-[10px] text-gray-600 mt-1.5">{profile.start_year} - {profile.end_year}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Widget Component (Landing Page Popup) ---
export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => { supabase.auth.getSession().then(({ data: { session } }) => setSession(session)); }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (session?.user?.id) query = query.eq("id", session.user.id);
      else query = query.eq("username", defaultUsername);
      const { data } = await query.single();
      if (data) setProfile(data as ProfileData);
    };
    fetchProfile();
  }, [session, defaultUsername]);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY > window.innerHeight * 0.6);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!profile) return null;

  const isProfileComplete = !!(profile.bio && profile.institute_name);
  const isOwner = session?.user?.id === profile.id;

  return (
    <div className={cn("hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[9999] font-sans transition-all duration-500 ease-in-out transform", isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none")}>
      <Sheet>
        <SheetTrigger asChild>
          <Button className="h-auto py-8 pl-1 pr-1 rounded-l-2xl rounded-r-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(37,99,235,0.4)] border-y border-l border-white/20 transition-all hover:pr-3" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
            <div className="flex items-center justify-center gap-3 py-2 rotate-180"><MessageSquareText className="w-5 h-5 -rotate-90" /><span className="text-sm font-bold tracking-[0.15em] whitespace-nowrap">HIT ME UP</span></div>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="bg-transparent border-none shadow-none w-[380px] p-0 z-[10000] flex items-center h-full mr-4 [&>button]:hidden focus:outline-none">
           <SheetTitle className="sr-only">Profile Preview</SheetTitle>
           <SheetDescription className="sr-only">
             Profile details for {profile.full_name || 'User'}
           </SheetDescription>
           
           <div className="w-full h-[80vh] relative flex flex-col">
             <ProfileCardContent profile={profile} isOwner={false} />
             
             <div className="mt-4">
               {isOwner && !isProfileComplete ? (
                 <Button onClick={() => navigate('/profile')} className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold shadow-lg hover:shadow-orange-500/20">
                   <UserCog className="w-4 h-4 mr-2" /> Complete Profile
                 </Button>
               ) : (
                 <Button onClick={() => navigate(`/u/${profile.username}`)} className="w-full h-12 rounded-xl bg-white text-black font-bold hover:bg-gray-200">
                   View Full Profile <ArrowRight className="w-4 h-4 ml-2" />
                 </Button>
               )}
             </div>
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// --- Main Page Component (Editor) ---
const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]); // New state for events
  
  // Save & Validation States
  const [isSaving, setIsSaving] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // CASE 1: No username in URL (Route: /profile) - PRIVATE EDITOR
      if (!username) {
        if (!currentUser) { navigate("/auth"); return; }
        
        const { data: myProfile } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        
        const defaultProfile: ProfileData = {
            id: currentUser.id,
            username: myProfile?.username || "", 
            full_name: myProfile?.full_name || currentUser.user_metadata?.full_name || "User",
            institute_name: myProfile?.institute_name || "",
            degree: myProfile?.degree || "",
            branch: myProfile?.branch || "",
            start_year: myProfile?.start_year || new Date().getFullYear(),
            end_year: myProfile?.end_year || new Date().getFullYear() + 4,
            country: myProfile?.country || "",
            github_handle: myProfile?.github_handle || "",
            linkedin_url: myProfile?.linkedin_url || "",
            portfolio_url: myProfile?.portfolio_url || "",
            bio: myProfile?.bio || "",
            avatar_url: myProfile?.avatar_url || currentUser.user_metadata?.avatar_url || "",
            contact_no: myProfile?.contact_no || "",
            cover_url: myProfile?.cover_url || ""
        };

        setProfile(defaultProfile);
        setOriginalProfile(defaultProfile); // Snapshot for tracking changes
        setIsOwner(true);

        // --- FETCH REGISTRATIONS (only for current user) ---
        const { data: regs } = await supabase
            .from('event_registrations')
            .select(`
                id,
                status,
                participation_type,
                team_name,
                created_at,
                event:events (
                    title,
                    slug,
                    image_url,
                    start_date,
                    location
                )
            `)
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (regs) setRegistrations(regs as any);
        // ---------------------------

        setLoading(false);
        return;
      }

      // CASE 2: Username provided (Route: /u/:username) - PUBLIC VIEW
      const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single();
      
      if (error || !data) { 
        if (currentUser) {
             navigate("/profile"); 
             return;
        }
        toast.error("Profile not found"); 
        navigate("/"); 
        return; 
      }
      
      setProfile(data as ProfileData);
      setOriginalProfile(data as ProfileData);
      if (currentUser && data.id === currentUser.id) setIsOwner(true);
      setLoading(false);
    };
    init();
  }, [username, navigate]);

  // Debounced Username Check
  useEffect(() => {
    if (!profile || !originalProfile) return;

    // Only check if username changed and is not empty
    if (profile.username !== originalProfile.username && profile.username.length > 2) {
      const checkAvailability = async () => {
        setIsCheckingUsername(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", profile.username)
          .neq("id", profile.id) // Exclude self
          .maybeSingle();
        
        setIsCheckingUsername(false);
        
        if (data) {
          setUsernameError("Username already taken");
        } else {
          setUsernameError(null);
        }
      };

      const timer = setTimeout(checkAvailability, 500); // 500ms debounce
      return () => clearTimeout(timer);
    } else {
      setUsernameError(null);
    }
  }, [profile?.username, originalProfile?.username, profile?.id]);

  const updateLocalState = (field: keyof ProfileData, value: string) => {
    if (!profile) return;
    setProfile(prev => prev ? ({ ...prev, [field]: value }) : null);
  };

  const handleSave = async () => {
    if (!profile) return;
    if (usernameError) {
      toast.error("Please fix username errors before saving.");
      return;
    }

    setIsSaving(true);
    try { 
        const { error } = await supabase.from("profiles").upsert({ 
            id: profile.id, 
            username: profile.username,
            full_name: profile.full_name,
            bio: profile.bio,
            github_handle: profile.github_handle,
            linkedin_url: profile.linkedin_url,
            portfolio_url: profile.portfolio_url,
            cover_url: profile.cover_url,
            updated_at: new Date().toISOString()
        }); 

        if (error) throw error;

        toast.success("Profile saved successfully"); 
        setOriginalProfile(profile); // Update snapshot
    } catch (error: any) { 
        console.error(error);
        toast.error("Failed to save: " + error.message); 
    } finally {
        setIsSaving(false);
    }
  };

  const scrollSlider = (direction: 'left' | 'right') => {
    if (sliderRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!profile) return null;

  if (!isOwner) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center p-4">
        <div className="w-full max-w-sm"><ProfileCardContent profile={profile} isOwner={false} /></div>
      </div>
    );
  }

  // Helper to check if there are unsaved changes
  const isDirty = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative">
        
        {/* LEFT: Editor (Scrollable) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-10">
          
          {/* Header with SAVE BUTTON */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Edit Profile</h1>
              <p className="text-muted-foreground">Customize your public presence.</p>
            </div>
            <Button 
              onClick={handleSave} 
              disabled={!isDirty || isSaving || isCheckingUsername || !!usernameError}
              className={cn(
                "min-w-[140px] font-bold shadow-lg transition-all",
                isDirty ? "bg-primary hover:bg-primary/90 text-white" : "bg-white/10 text-muted-foreground hover:bg-white/15"
              )}
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : isCheckingUsername ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
              )}
            </Button>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><User className="w-4 h-4" /> Identity</h2>
            <div className="grid md:grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</Label>
                 <Input 
                   value={profile.full_name} 
                   onChange={(e) => updateLocalState('full_name', e.target.value)} 
                   className="bg-white/5 border-white/10"
                 />
               </div>
               <div className="grid gap-2">
                 <Label className="text-xs text-muted-foreground uppercase tracking-wider">Username</Label>
                 <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground">@</span>
                    <Input 
                      value={profile.username} 
                      onChange={(e) => updateLocalState('username', e.target.value)} 
                      className={cn(
                        "bg-white/5 border-white/10 pl-8 transition-colors",
                        usernameError && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                 </div>
                 {usernameError && (
                   <p className="text-xs text-red-400 flex items-center gap-1 mt-1">
                     <AlertCircle className="w-3 h-3" /> {usernameError}
                   </p>
                 )}
               </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Visuals</h2>
            <div className="relative rounded-2xl overflow-hidden border border-white/10 group">
              <div className="h-64 w-full bg-cover bg-center transition-all duration-500" style={{ backgroundImage: `url('${profile.cover_url || COVER_TEMPLATES[0]}')` }}>
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
              </div>
              <div className="absolute bottom-6 left-8 flex items-end gap-6 z-20">
                <Avatar className="w-32 h-32 border-4 border-[#09090b] shadow-2xl">
                  <AvatarImage src={profile.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-[#1a1a1c] text-3xl font-bold">{profile.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="mb-4 bg-black/70 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 shadow-2xl">
                   <h2 className="text-3xl font-bold text-white tracking-tight mb-0.5">{profile.full_name}</h2>
                   <p className="text-gray-300 font-medium text-sm tracking-wide">@{profile.username || 'username'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> Cover Templates</h2>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => scrollSlider('left')} className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10"><ChevronLeft className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" onClick={() => scrollSlider('right')} className="h-8 w-8 rounded-full border-white/10 hover:bg-white/10"><ChevronRight className="w-4 h-4" /></Button>
                </div>
             </div>
             
             <div 
               ref={sliderRef}
               className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-2"
             >
                {COVER_TEMPLATES.map((url, i) => (
                  <div 
                    key={i} 
                    onClick={() => updateLocalState('cover_url', url)} 
                    className={cn(
                        "flex-shrink-0 w-64 aspect-video rounded-lg bg-cover bg-center cursor-pointer border-2 transition-all hover:scale-105", 
                        profile.cover_url === url ? "border-primary shadow-lg ring-2 ring-primary/20" : "border-transparent opacity-70 hover:opacity-100"
                    )} 
                    style={{ backgroundImage: `url('${url}')` }} 
                  />
                ))}
             </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">Social & Links</h2>
            <div className="grid gap-4">
              <SocialEditBlock icon={Github} label="GitHub Profile" value={profile.github_handle || ''} onChange={(v) => updateLocalState('github_handle', v)} colorClass="group-hover:bg-[#24292e] group-hover:text-white" />
              <SocialEditBlock icon={Linkedin} label="LinkedIn URL" value={profile.linkedin_url || ''} onChange={(v) => updateLocalState('linkedin_url', v)} colorClass="group-hover:bg-[#0077b5] group-hover:text-white" />
              <SocialEditBlock icon={Globe} label="Portfolio URL" value={profile.portfolio_url || ''} onChange={(v) => updateLocalState('portfolio_url', v)} colorClass="group-hover:bg-emerald-600 group-hover:text-white" />
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500">About You</h2>
            <div className="relative"><Textarea value={profile.bio || ''} onChange={(e) => updateLocalState('bio', e.target.value)} className="min-h-[150px] bg-[#121214] border-white/5 focus:border-primary/50 text-base leading-relaxed p-6 rounded-2xl resize-none" placeholder="Tell the world who you are..." /></div>
          </div>

          {/* --- NEW SECTION: ACTIVE REGISTRATIONS --- */}
          <div className="space-y-6 pb-20 border-t border-white/10 pt-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <Ticket className="w-4 h-4" /> Active Event Registrations
            </h2>
            
            {registrations.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <p className="text-gray-400">No active registrations found.</p>
                    <Button variant="link" onClick={() => navigate('/events')} className="text-purple-400">Explore Events</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {registrations.map((reg) => (
                        <div key={reg.id} className="relative overflow-hidden rounded-xl border border-white/10 bg-[#121214] p-4 flex flex-col md:flex-row gap-4 hover:border-purple-500/30 transition-all group">
                            <div className="w-full md:w-32 h-32 md:h-auto rounded-lg overflow-hidden shrink-0">
                                <img src={reg.event.image_url} alt={reg.event.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"/>
                            </div>
                            <div className="flex-1 py-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <Badge variant="outline" className="mb-2 border-white/10 text-xs">{reg.participation_type}</Badge>
                                        <h3 className="text-lg font-bold text-white mb-1">{reg.event.title}</h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {format(new Date(reg.event.start_date), 'MMM d, yyyy')}</span>
                                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {reg.event.location}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase", 
                                            reg.status === 'verified' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                                        )}>
                                            {reg.status}
                                        </div>
                                    </div>
                                </div>
                                {reg.participation_type === 'Team' && reg.team_name && (
                                    <div className="mt-4 flex items-center gap-2 text-sm text-gray-300 bg-white/5 p-2 rounded-lg w-fit">
                                        <Users className="w-4 h-4 text-purple-400"/> 
                                        <span>Team: <span className="font-bold text-white">{reg.team_name}</span></span>
                                    </div>
                                )}
                            </div>
                            <Button variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => navigate(`/events/${reg.event.slug}`)}>
                                <ArrowRight className="w-4 h-4"/>
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </div>
          
        </div>

        {/* RIGHT: Live Preview (Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 relative hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Preview</h2>
              <div className="transform transition-transform hover:scale-[1.02] duration-500"><ProfileCardContent profile={profile} isOwner={true} /></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
