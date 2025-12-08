import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Github, 
  Linkedin, 
  Globe, 
  Share2, 
  Check,
  MessageSquareText,
  Mail,
  Phone,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

export const HitMeUpWidget = ({ defaultUsername = "mishratejash01" }: { defaultUsername?: string }) => {
  const [profile, setProfile] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const location = useLocation();

  // Don't show on Profile pages (since they have their own specific one with Edit features)
  // Also don't show on Auth or Exam pages
  if (location.pathname.startsWith('/u/') || location.pathname.startsWith('/profile') || location.pathname.startsWith('/exam') || location.pathname.startsWith('/auth')) {
    return null;
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    // Fetch the owner's profile (defaultUsername)
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", defaultUsername)
      .single();
    
    if (data) setProfile(data);
  };

  const copyToClipboard = () => {
    const url = `${window.location.origin}/u/${profile?.username || defaultUsername}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Profile link copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!profile) return null;

  return (
    <div className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 z-[100] font-sans">
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
        <SheetContent side="right" className="bg-[#0c0c0e] border-l border-white/10 text-white w-[400px] p-0 z-[100]">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-b from-white/5 to-transparent">
                <SheetHeader className="text-left space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-white/10 shadow-lg">
                      <AvatarImage src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`} />
                      <AvatarFallback className="bg-primary">{profile.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <SheetTitle className="text-xl text-white">Connect</SheetTitle>
                      <SheetDescription className="text-gray-400">
                        Get in touch with {profile.full_name?.split(' ')[0]}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Social Profiles</h4>
                  <div className="grid gap-3">
                    {profile.github_handle && (
                      <a href={`https://github.com/${profile.github_handle.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10 text-white"><Github className="w-5 h-5" /></div>
                        <div className="flex-1 text-sm font-medium text-white">GitHub</div>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10 text-white"><Linkedin className="w-5 h-5" /></div>
                        <div className="flex-1 text-sm font-medium text-white">LinkedIn</div>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </a>
                    )}
                    {profile.portfolio_url && (
                      <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center border border-white/10 text-white"><Globe className="w-5 h-5" /></div>
                        <div className="flex-1 text-sm font-medium text-white">Portfolio</div>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Contact</h4>
                    {profile.contact_no ? (
                      <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary"><Phone className="w-5 h-5" /></div>
                        <div>
                          <div className="text-xs text-primary/80 font-medium uppercase">Mobile</div>
                          <div className="text-sm font-bold text-white tracking-wide">{profile.contact_no}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center gap-4 opacity-70">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-gray-400"><Mail className="w-5 h-5" /></div>
                        <div>
                          <div className="text-xs text-muted-foreground uppercase">Email</div>
                          <div className="text-sm font-medium text-white italic">Hidden</div>
                        </div>
                      </div>
                    )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-white/10 bg-black/20">
                <Button onClick={copyToClipboard} className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                  {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
                  {isCopied ? "LINK COPIED" : "SHARE PROFILE"}
                </Button>
              </div>
            </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
