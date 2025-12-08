import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  User as UserIcon,
  MessageSquareText,
  Phone,
  ArrowRight
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

// --- Shared Components ---

const ProfileCardContent = ({ profile, isOwner, onEdit }: { profile: ProfileData, isOwner: boolean, onEdit?: () => void }) => {
  const [isCopied, setIsCopied] = useState(false);
  const navigate = useNavigate();

  const copyProfileLink = () => {
    const url = `${window.location.origin}/u/${profile.username}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#0c0c0e] text-white overflow-hidden rounded-xl border border-white/10 shadow-2xl relative">
      {/* Banner */}
      <div className="h-32 md:h-40 bg-gradient-to-tr from-blue-900/40 via-purple-900/40 to-black relative shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
        <div className="absolute top-4 right-4 flex gap-2">
          {isOwner && onEdit && (
            <Button size="icon" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={onEdit}>
              <Edit2 className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="text-white/50 hover:text-white hover:bg-white/10 rounded-full" onClick={copyProfileLink}>
            {isCopied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      <div className="px-6 md:px-8 pb-8 flex-1 flex flex-col relative overflow-y-auto">
        {/* Avatar */}
        <div className="-mt-14 mb-4 relative z-10">
          <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-[#0c0c0e] shadow-2xl ring-2 ring-white/5 bg-[#1a1a1c]">
            <AvatarImage src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`} />
            <AvatarFallback className="bg-primary text-2xl font-bold">{profile.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Identity */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">{profile.full_name}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mt-1">
            <span className="text-primary font-medium">@{profile.username}</span>
            {profile.country && (
              <div className="flex items-center gap-1 text-muted-foreground text-xs">
                <MapPin className="w-3 h-3" />
                {profile.country}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="mb-8">
          {profile.bio ? (
            <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          ) : (
            <p className="text-xs text-muted-foreground italic p-3 border border-dashed border-white/10 rounded-lg">
              {isOwner ? "Add a bio to introduce yourself." : "No bio available."}
            </p>
          )}
        </div>

        {/* Socials Row */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {profile.github_handle && (
            <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-primary/50 transition-all">
                <Github className="w-5 h-5" />
              </Button>
            </a>
          )}
          {profile.linkedin_url && (
            <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-blue-500/50 transition-all">
                <Linkedin className="w-5 h-5" />
              </Button>
            </a>
          )}
          {profile.portfolio_url && (
            <a href={profile.portfolio_url} target="_blank" rel="noreferrer">
              <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white hover:border-green-500/50 transition-all">
                <Globe className="w-5 h-5" />
              </Button>
            </a>
          )}
          {profile.contact_no && (
             <Button variant="outline" size="icon" className="rounded-full w-10 h-10 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white cursor-default" title={profile.contact_no}>
               <Phone className="w-5 h-5" />
             </Button>
          )}
        </div>

        {/* Education (Compact) */}
        {profile.institute_name && (
          <div className="mt-auto pt-6 border-t border-white/10 text-xs text-muted-foreground">
            <div className="uppercase tracking-widest font-bold mb-2 text-white/40">Education</div>
            <p className="text-white mb-0.5 font-medium">{profile.institute_name}</p>
            <p>{profile.degree} • {profile.branch}</p>
          </div>
        )}
        
        {/* View Full Profile Button (Only if NOT on the main profile page) */}
        {window.location.pathname !== `/u/${profile.username}` && window.location.pathname !== `/profile` && (
           <div className="mt-6">
             <SheetClose asChild>
               <Button onClick={() => navigate(`/u/${profile.username}`)} className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                 View Full Profile <ArrowRight className="w-4 h-4 ml-2" />
               </Button>
             </SheetClose>
           </div>
        )}
      </div>
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

  // 2. Fetch User (Logged In User OR Default Admin)
  useEffect(() => {
    const fetchProfile = async () => {
      let query = supabase.from("profiles").select("*");
      
      if (session?.user?.id) {
        // If logged in, show THEIR profile
        query = query.eq("id", session.user.id);
      } else {
        // If not logged in, show Admin/Default profile
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
      // Show after scrolling past 60% of viewport
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
        <SheetContent side="right" className="bg-transparent border-none shadow-none w-[400px] p-0 z-[10000] flex items-center h-full mr-2">
           <div className="w-full h-[90vh]"> {/* Constrain height for card look */}
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

      // Handle /profile route (no param)
      if (!username) {
        if (!currentUser) {
          navigate("/auth");
          return;
        }
        // Redirect to /u/username
        const { data: myProfile } = await supabase.from("profiles").select("username").eq("id", currentUser.id).single();
        if (myProfile?.username) navigate(`/u/${myProfile.username}`, { replace: true });
        return;
      }

      // Fetch Profile
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
        {/* Background Decor */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] pointer-events-none" />

        {/* Profile Card Container */}
        <div className="w-full max-w-md h-[800px] max-h-[85vh] relative z-10">
           <ProfileCardContent 
             profile={profile} 
             isOwner={isOwner} 
             onEdit={() => setIsEditing(true)} 
           />
        </div>

        {/* Edit Dialog */}
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
