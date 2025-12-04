import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Stepper, { Step } from '@/components/ui/stepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Standardized list of common countries (abbreviated for brevity)
const COUNTRIES = [
  "India", "United States", "United Kingdom", "Canada", "Australia", 
  "Germany", "France", "Japan", "China", "Brazil", "Other"
];

const DEGREES = ["BS in Data Science", "BS in Electronic Systems", "B.Tech", "B.E.", "B.Sc", "Other"];
const LEVELS = ["Foundation", "Diploma", "Degree", "Alumni"];

export const ProfileCompletion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    username: '',
    contact_no: '',
    university: '',
    branch: '',
    year_of_study: '',
    country: 'India',
    degree: '',
    level: ''
  });

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Check if mandatory fields are missing
        const isProfileIncomplete = 
          !profile.full_name || 
          !profile.username || 
          !profile.contact_no || 
          !profile.university || 
          !profile.branch || 
          !profile.year_of_study;

        if (isProfileIncomplete) {
          setFormData(prev => ({
            ...prev,
            id: user.id,
            full_name: profile.full_name || user.user_metadata.full_name || '',
            username: profile.username || '',
            contact_no: profile.contact_no || '',
            university: profile.university || '',
            branch: profile.branch || '',
            year_of_study: profile.year_of_study?.toString() || '',
            // @ts-ignore
            country: profile.country || 'India'
          }));
          setIsOpen(true);
        }
      }
      setLoading(false);
    };

    checkProfile();
  }, []);

  // Debounced Username Check
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.username.length > 2) {
        setCheckingUsername(true);
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('username', formData.username)
          .neq('id', formData.id); // Exclude current user if editing
        
        setUsernameAvailable(count === 0);
        setCheckingUsername(false);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, formData.id]);

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          contact_no: formData.contact_no,
          university: formData.university,
          branch: formData.branch,
          year_of_study: parseInt(formData.year_of_study),
          // @ts-ignore - country might not be in types yet
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.id);

      if (error) throw error;

      toast({
        title: "Profile Completed",
        description: "Welcome to the community!",
      });
      setIsOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const isStep1Valid = formData.full_name.length > 0 && 
                       formData.username.length > 2 && 
                       usernameAvailable === true && 
                       formData.contact_no.length > 5;

  const isStep2Valid = formData.university.length > 0 && 
                       formData.branch.length > 0 && 
                       formData.year_of_study.length > 0;

  if (loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => { /* Prevent closing by clicking outside */ }}>
      <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-2xl p-0 overflow-hidden [&>button]:hidden">
        <div className="bg-black/20 p-6 border-b border-white/5">
          <DialogHeader>
            <DialogTitle className="text-2xl font-neuropol tracking-wide text-white">Setup Profile</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete your registration to access the developer ecosystem.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-2">
          <Stepper
            initialStep={1}
            onFinalStepCompleted={handleSubmit}
            backButtonText="Back"
            nextButtonText="Continue"
            // Dynamic disable logic based on step validity
            isNextDisabled={false} // Logic handled inside steps if needed, or effectively via UI feedback
          >
            {/* STEP 1: IDENTITY */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="fullname" className="text-white">Full Name</Label>
                  <Input 
                    id="fullname"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10 text-white focus:border-primary/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <div className="relative">
                    <Input 
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      placeholder="johndoe"
                      className={cn(
                        "bg-white/5 border-white/10 text-white focus:border-primary/50 pr-10",
                        usernameAvailable === false && "border-red-500/50 focus:border-red-500",
                        usernameAvailable === true && "border-green-500/50 focus:border-green-500"
                      )}
                    />
                    <div className="absolute right-3 top-2.5">
                      {checkingUsername ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> :
                       usernameAvailable === true ? <CheckCircle2 className="h-4 w-4 text-green-500" /> :
                       usernameAvailable === false ? <XCircle className="h-4 w-4 text-red-500" /> :
                       null}
                    </div>
                  </div>
                  {usernameAvailable === false && <p className="text-xs text-red-400">Username is already taken.</p>}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact" className="text-white">Contact Number</Label>
                  <Input 
                    id="contact"
                    type="tel"
                    value={formData.contact_no}
                    onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                    placeholder="+91 99999 99999"
                    className="bg-white/5 border-white/10 text-white focus:border-primary/50"
                  />
                </div>
                
                {!isStep1Valid && <p className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded">Please fill all fields correctly to proceed.</p>}
              </div>
            </Step>

            {/* STEP 2: ACADEMICS */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="uni" className="text-white">University / Institution</Label>
                  <Input 
                    id="uni"
                    value={formData.university}
                    onChange={(e) => setFormData({...formData, university: e.target.value})}
                    placeholder="IIT Madras"
                    className="bg-white/5 border-white/10 text-white focus:border-primary/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-white">Branch</Label>
                    <Input 
                      value={formData.branch}
                      onChange={(e) => setFormData({...formData, branch: e.target.value})}
                      placeholder="Computer Science"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-white">Year of Study</Label>
                    <Select value={formData.year_of_study} onValueChange={(v) => setFormData({...formData, year_of_study: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select Year" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                        {[1, 2, 3, 4, 5].map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}{y===1?'st':y===2?'nd':y===3?'rd':'th'} Year</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!isStep2Valid && <p className="text-xs text-amber-500/80 bg-amber-500/10 p-2 rounded">Academic details are required.</p>}
              </div>
            </Step>

            {/* STEP 3: LOCATION */}
            <Step>
              <div className="space-y-6 py-4">
                <div className="grid gap-2">
                  <Label className="text-white">Country of Residence</Label>
                  <Select value={formData.country} onValueChange={(v) => setFormData({...formData, country: v})}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1c] border-white/10 text-white h-60">
                      {COUNTRIES.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-200">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><User className="w-4 h-4"/> Profile Review</h4>
                  <p className="opacity-80">
                    Your details will be used to generate your personalized coding portfolio and certificates. 
                    <br/><br/>
                    <strong>Username:</strong> @{formData.username}<br/>
                    <strong>Role:</strong> {formData.branch} Student
                  </p>
                </div>
              </div>
            </Step>
          </Stepper>
        </div>
      </DialogContent>
    </Dialog>
  );
};
