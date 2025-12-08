import { useState, useEffect } from "react";
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
  SheetClose
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
  MessageSquareText,
  ArrowRight,
  Link as LinkIcon,
  Copy
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

// --- Helper: Extract LinkedIn Username ---
const getLinkedInUsername = (url?: string) => {
  if (!url) return null;
  const match = url.match(/linkedin\.com\/in\/([a-zA-Z0-9-]+)/);
  return match ? match[1] : null;
};

// --- Shared Component: Profile Card ---

const ProfileCardContent = ({ profile, isOwner, onEdit }: { profile: ProfileData, isOwner: boolean, onEdit?: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const navigate = useNavigate();

  // Copy Profile URL (Share Button)
  const copyProfileLink = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Copy Username Link (Clicking on the link text)
  const handleLinkClick = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setIsLinkCopied(false), 2000);
  };

  // Display URL (without https://)
  const displayUrl = `${window.location.host}/u/${profile.username}`;

  const linkedInUser = getLinkedInUsername(profile.linkedin_url);
  const avatarSources = [
    profile.avatar_url,
    linkedInUser ? `https://unavatar.io/linkedin/${linkedInUser}` : null,
    `https://unavatar.io/${profile.username}`,
    `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`
  ].filter(Boolean) as string[];

  return (
    <div className="h-full w-full bg-[#0c0c0e] text-white rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans border border-white/10 relative">
      
      {/* Scrollable Area */}
      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        
        {/* --- BANNER --- */}
        <div className="relative h-48 bg-cover bg-center shrink-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2070&auto=format&fit=crop')" }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          
          {/* Header Branding & Actions */}
          <div className="absolute inset-x-0 top-0 p-5 flex justify-between items-start text-white z-10">
            {/* Branding */}
            <div className="flex items-center mt-1">
              <span className="font-neuropol font-bold text-lg tracking-widest text-white/90 drop-shadow-md">
                CODÉVO
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isOwner && onEdit && (
                <button onClick={onEdit} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                  <Edit2 className="w-4 h-4 text-white" />
                </button>
              )}
              <button onClick={copyProfileLink} className="p-2 rounded-full hover:bg-white/20 transition-colors bg-black/20 backdrop-blur-md border border-white/10">
                {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Share2 className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>

        {/* --- AVATAR (Overlapping) --- */}
        <div className="absolute top-28 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full border-[4px] border-[#0c0c0e] bg-[#1a1a1c] flex items-center justify-center z-20 shadow-xl">
           <Avatar className="w-full h-full rounded-full">
              {avatarSources.map((src) => (
                <AvatarImage key={src} src={src} className="object-cover" />
              ))}
              <AvatarFallback className="bg-[#1a1a1c] text-4xl font-bold text-white/50">
                {profile.full_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
           </Avatar>
        </div>

        {/* --- MAIN CONTENT --- */}
        {/* Added extra top padding to clear avatar */}
        <div className="pt-16 pb-6 px-6 text-center">
          
          {/* Name */}
          <h1 className="text-2xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
          
          {/* Link (Click to Copy) */}
          <div 
            onClick={handleLinkClick}
            className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group"
          >
            {isLinkCopied ? <Check className="w-3 h-3 text-green-400" /> : <LinkIcon className="w-3 h-3 text-white/50 group-hover:text-white" />}
            <span className="text-sm font-medium text-white/70 group-hover:text-white truncate max-w-[200px]">{displayUrl}</span>
            <Copy className="w-3 h-3 text-white/30 group-hover:text-white/70 ml-1" />
          </div>

          {/* Location */}
          {profile.country && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-gray-500 text-xs font-medium uppercase tracking-wider">
              <MapPin className="w-3 h-3" />
              <span>{profile.country}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <div className="mt-5 text-gray-400 text-sm leading-relaxed text-center px-2 line-clamp-4">
              <p>{profile.bio}</p>
            </div>
          )}

          {/* Social Icons Row (Rectangular Rounded) */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {profile.github_handle && (
              <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#24292e] hover:text-white hover:border-transparent transition-all shadow-sm">
                <Github className="w-6 h-6" />
              </a>
            )}
            {profile.linkedin_url && (
              <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#0077b5] hover:text-white hover:border-transparent transition-all shadow-sm">
                <Linkedin className="w-6 h-6" />
              </a>
            )}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white hover:border-transparent transition-all shadow-sm">
                <Globe className="w-6 h-6" />
              </a>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="px-8">
          <div className="w-full h-px bg-white/5" />
        </div>

        {/* Education Section */}
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

      {/* --- FOOTER ACTION --- */}
      {window.location.pathname !== `/u/${profile.username}` && window.location.pathname !== `/profile` && (
        <div className="p-5 pt-0 mt-auto bg-[#0c0c0e]">
          <SheetClose asChild>
            <button 
              onClick={() => navigate(`/u/${profile.username}`)}
              className="w-full h-12 flex items-center justify-center gap-2 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
            >
              <span>View Full Profile</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </SheetClose>
        </div>
      )}
    </div>
  );
};

// --- Widget Component (Exported for Landing.tsx) ---

export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [session, setSession] = useState<any>(null);

  // 1. Check Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  // 2. Fetch User
  useEffect(() => {
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      if (session?.user?.id) {
        query = query.eq("id", session.user.id);
      } else {
        query = query.eq("username", defaultUsername);
      }
      const { data } = await query.single();
      if (data) setProfile(data as ProfileData);
    };
    fetchProfile();
  }, [session, defaultUsername]);

  // 3. Scroll Listener
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > window.innerHeight * 0.6);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!profile) return null;

  return (
    <div 
      className={cn(
        "hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[9999] font-sans transition-all duration-500 ease-in-out transform",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
      )}
    >
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="h-auto py-8 pl-1 pr-1 rounded-l-2xl rounded-r-none bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_25px_rgba(37,99,235,0.4)] border-y border-l border-white/20 transition-all hover:pr-3"
            style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
          >
            <div className="flex items-center justify-center gap-3 py-2 rotate-180">
              <MessageSquareText className="w-5 h-5 -rotate-90" />
              <span className="text-sm font-bold tracking-[0.15em] whitespace-nowrap">HIT ME UP</span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="bg-transparent border-none shadow-none w-[380px] p-0 z-[10000] flex items-center h-full mr-4 [&>button]:hidden focus:outline-none" 
        >
           {/* Constrained Height for Card Look */}
           <div className="w-full h-[80vh]"> 
             <ProfileCardContent profile={profile} isOwner={false} /> 
           </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

// --- Page Component (Default Export) ---

const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!username) {
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", currentUser.id).single();
        if (myProfile?.username) navigate(`/u/${myProfile.username}`, { replace: true });
        return;
      }

      const { data, error } = await supabase.from("profiles").select("*").eq("username", username).single();
      
      if (error || !data) {
        toast.error("Profile not found");
        navigate("/");
        return;
      }

      setProfile(data as ProfileData);
      setEditForm(data as ProfileData);
      if (currentUser && data.id === currentUser.id) setIsOwner(true);
      setLoading(false);
    };
    init();
  }, [username, navigate]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: editForm.full_name,
          bio: editForm.bio,
          github_handle: editForm.github_handle,
          linkedin_url: editForm.linkedin_url,
          portfolio_url: editForm.portfolio_url,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setProfile({ ...profile, ...editForm } as ProfileData);
      setIsEditing(false);
      toast.success("Profile updated!");
    } catch (err) {
      toast.error("Update failed");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#09090b] text-white pt-24 pb-12 px-4 relative flex items-center justify-center">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

        <div className="w-full max-w-md h-[800px] max-h-[85vh] relative z-10">
           <ProfileCardContent 
             profile={profile} 
             isOwner={isOwner} 
             onEdit={() => setIsEditing(true)} 
           />
        </div>

        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
            <DialogHeader><DialogTitle>Edit Profile</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><label className="text-xs uppercase text-muted-foreground">Name</label><Input value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} className="bg-white/5 border-white/10 text-white" /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-muted-foreground">Bio</label><Textarea value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="bg-white/5 border-white/10 text-white" /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-muted-foreground">GitHub</label><Input value={editForm.github_handle || ''} onChange={e => setEditForm({...editForm, github_handle: e.target.value})} className="bg-white/5 border-white/10 text-white" /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-muted-foreground">LinkedIn</label><Input value={editForm.linkedin_url || ''} onChange={e => setEditForm({...editForm, linkedin_url: e.target.value})} className="bg-white/5 border-white/10 text-white" /></div>
              <div className="space-y-2"><label className="text-xs uppercase text-muted-foreground">Portfolio</label><Input value={editForm.portfolio_url || ''} onChange={e => setEditForm({...editForm, portfolio_url: e.target.value})} className="bg-white/5 border-white/10 text-white" /></div>
              <Button onClick={handleSave} className="w-full mt-2">Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export default Profile;
