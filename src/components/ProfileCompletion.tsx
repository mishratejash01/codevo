import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Stepper, { Step } from '@/components/ui/stepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Loader2, ChevronsUpDown, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

// --- Helper: Check if profile is complete ---
export const checkUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (!profile) return false;

  // Define required fields for a "complete" profile
  const requiredFields = ['full_name', 'username', 'contact_no', 'institute_name', 'degree', 'branch'];
  // @ts-ignore
  const isComplete = requiredFields.every(field => !!profile[field]);
  return isComplete;
};

// --- Searchable Dropdown Component (Internal) ---
const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select...", 
  customEnabled = false 
}: { 
  options: { label: string, value: string }[], 
  value: string, 
  onChange: (val: string) => void,
  placeholder?: string,
  customEnabled?: boolean
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedLabel = options.find((item) => item.value === value)?.label || value;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white"
        >
          {value ? selectedLabel : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 bg-[#1a1a1c] border-white/10 text-white">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search..." onValueChange={setSearchTerm} className="text-white" />
          <CommandList>
            <CommandEmpty>
              {customEnabled ? (
                <div className="p-2">
                  <p className="text-xs text-muted-foreground mb-2">Not found.</p>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full h-8 text-xs"
                    onClick={() => { onChange(searchTerm); setOpen(false); }}
                  >
                    Use "{searchTerm}"
                  </Button>
                </div>
              ) : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((item) => (
                <CommandItem
                  key={item.value}
                  value={item.label}
                  onSelect={() => {
                    onChange(item.value === 'Other' ? '' : item.value); 
                    if(item.value !== 'Other') setOpen(false);
                  }}
                  className="text-white aria-selected:bg-white/10"
                >
                  <Check className={cn("mr-2 h-4 w-4", value === item.value ? "opacity-100" : "opacity-0")} />
                  {item.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

// --- Common Form Content ---
const ProfileFormContent = ({ formData, setFormData, masterData, handleSubmit, onAskLater, mode }: any) => {
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  
  // UI State for Manual Entry
  const [isManualInstitute, setIsManualInstitute] = useState(false);
  const [isManualBranch, setIsManualBranch] = useState(false);

  // Username Availability
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.username.length > 2) {
        setCheckingUsername(true);
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('username', formData.username)
          .neq('id', formData.id);
        setUsernameAvailable(count === 0);
        setCheckingUsername(false);
      } else {
        setUsernameAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.username, formData.id]);

  const step1Valid = formData.full_name && formData.username && usernameAvailable && formData.contact_no.length >= 10;
  const step3Valid = formData.country;

  return (
    <div className="p-1 min-h-[400px]">
      <Stepper
        initialStep={1}
        onFinalStepCompleted={handleSubmit}
        backButtonText="Back"
        nextButtonText="Next"
        footerClassName={mode === 'sheet' ? "pb-20" : ""}
        // "Ask me later" button: Unfilled (Outline) variant
        extraLeftContent={onAskLater && (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs h-9 border-white/20 bg-transparent text-muted-foreground hover:text-white hover:bg-white/5 hover:border-white/40 transition-colors"
            onClick={onAskLater}
          >
            <Clock className="w-3 h-3 mr-2" /> Ask me later
          </Button>
        )}
      >
        {/* STEP 1: IDENTITY */}
        <Step>
          <div className="space-y-5 py-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Full Legal Name</Label>
              <Input 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Username</Label>
              <div className="relative">
                <Input 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                  className={cn("bg-white/5 border-white/10 text-white h-11 pr-10 focus:border-white/30", 
                    usernameAvailable === false && "border-red-500/50",
                    usernameAvailable === true && "border-green-500/50"
                  )}
                />
                <div className="absolute right-3 top-3.5">
                  {checkingUsername ? <Loader2 className="h-4 w-4 animate-spin text-gray-500"/> : 
                   usernameAvailable ? <CheckCircle2 className="h-4 w-4 text-green-500"/> :
                   usernameAvailable === false ? <XCircle className="h-4 w-4 text-red-500"/> : null}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Mobile Number</Label>
              <div className="flex gap-2">
                <Select value={formData.country_code} onValueChange={(v) => setFormData({...formData, country_code: v})}>
                  <SelectTrigger className="w-[80px] bg-white/5 border-white/10 text-white h-11 focus:border-white/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-white h-60">
                    {masterData.countries.map((c: any) => (
                      <SelectItem key={c.id} value={c.code || '+00'}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input 
                  type="tel"
                  value={formData.contact_no}
                  onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-11 flex-1 focus:border-white/30"
                />
              </div>
            </div>
            
            <div className="h-4">
              {!step1Valid && <span className="text-xs text-red-400">Please fill in all required fields.</span>}
            </div>
          </div>
        </Step>

        {/* STEP 2: ACADEMIC */}
        <Step>
          <div className="space-y-5 py-4">
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Degree Program</Label>
                <Select value={formData.degree} onValueChange={(v) => setFormData({...formData, degree: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                    {masterData.degrees.map((d: any) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Institute Type</Label>
                <Select value={formData.institute_type} onValueChange={(v) => setFormData({...formData, institute_type: v})}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                    {masterData.instituteTypes.map((t: any) => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Institute Name</Label>
              {isManualInstitute ? (
                <Input 
                  value={formData.institute_name}
                  onChange={(e) => setFormData({...formData, institute_name: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                  autoFocus
                />
              ) : (
                <SearchableSelect 
                  options={[...masterData.institutes.map((i: any) => ({ label: i.name, value: i.name })), { label: "Other / Not in list", value: "Other" }]}
                  value={formData.institute_name}
                  onChange={(val) => {
                    if (!val) setIsManualInstitute(true);
                    else setFormData({...formData, institute_name: val});
                  }}
                  placeholder="Select..."
                  customEnabled={true}
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Branch / Specialization</Label>
              {isManualBranch ? (
                <Input 
                  value={formData.branch}
                  onChange={(e) => setFormData({...formData, branch: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                />
              ) : (
                <SearchableSelect 
                  options={[...masterData.branches.map((b: any) => ({ label: b.name, value: b.name })), { label: "Other", value: "Other" }]}
                  value={formData.branch}
                  onChange={(val) => {
                    if (!val) setIsManualBranch(true);
                    else setFormData({...formData, branch: val});
                  }}
                  placeholder="Select..."
                  customEnabled={true}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Enrollment Year</Label>
                <Input 
                  type="number"
                  value={formData.start_year}
                  onChange={(e) => setFormData({...formData, start_year: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Anticipated Graduation Year</Label>
                <Input 
                  type="number"
                  value={formData.end_year}
                  onChange={(e) => setFormData({...formData, end_year: e.target.value})}
                  className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                />
              </div>
            </div>
          </div>
        </Step>

        {/* STEP 3: REVIEW */}
        <Step>
          <div className="space-y-6 py-4">
            <div className="grid gap-2">
              <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Country of Residence</Label>
              <SearchableSelect 
                options={masterData.countries.map((c: any) => ({ label: c.name, value: c.name }))}
                value={formData.country}
                onChange={(val) => setFormData({...formData, country: val})}
                placeholder="Select..."
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6 text-sm space-y-4">
              <h3 className="text-white font-semibold border-b border-white/10 pb-2">Review Information</h3>
              
              <div className="grid grid-cols-2 gap-y-4 text-xs text-white/90">
                <div><span className="text-muted-foreground">Name:</span> <br/>{formData.full_name}</div>
                <div><span className="text-muted-foreground">Username:</span> <br/>@{formData.username}</div>
                <div><span className="text-muted-foreground">Institute:</span> <br/>{formData.institute_name}</div>
                <div><span className="text-muted-foreground">Program:</span> <br/>{formData.degree} ({formData.branch})</div>
                <div><span className="text-muted-foreground">Duration:</span> <br/>{formData.start_year} - {formData.end_year}</div>
                <div><span className="text-muted-foreground">Location:</span> <br/>{formData.country}</div>
              </div>
            </div>
            
            {!step3Valid && <p className="text-xs text-red-400">Please select your country to continue.</p>}
          </div>
        </Step>
      </Stepper>
    </div>
  );
};

const useProfileLogic = (onComplete: () => void) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    username: '',
    country_code: '+91',
    contact_no: '',
    degree: '',
    branch: '',
    institute_type: '',
    institute_name: '',
    start_year: '',
    end_year: '',
    country: 'India'
  });

  const { data: masterData } = useQuery({
    queryKey: ['master_data'],
    queryFn: async () => {
      const { data, error } = await supabase.from('master_data').select('*').order('name');
      if (error) throw error;
      return {
        degrees: data.filter(i => i.category === 'degree'),
        branches: data.filter(i => i.category === 'branch'),
        instituteTypes: data.filter(i => i.category === 'institute_type'),
        institutes: data.filter(i => i.category === 'institute'),
        countries: data.filter(i => i.category === 'country'),
      };
    }
  });

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
      setFormData(prev => ({
        ...prev,
        id: user.id,
        full_name: profile.full_name || user.user_metadata.full_name || '',
        username: profile.username || '',
        contact_no: profile.contact_no ? profile.contact_no.split(' ')[1] : '',
        country_code: profile.contact_no ? profile.contact_no.split(' ')[0] : '+91',
        degree: profile.degree || '',
        branch: profile.branch || '',
        institute_type: profile.institute_type || '',
        institute_name: profile.institute_name || '',
        start_year: String(profile.start_year || ''),
        end_year: String(profile.end_year || ''),
        country: profile.country || 'India',
      }));
      
      const missingFields = !profile.full_name || !profile.username || !profile.contact_no || !profile.institute_name;
      return missingFields;
    }
    return false;
  }, []);

  const handleSubmit = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          username: formData.username,
          contact_no: `${formData.country_code} ${formData.contact_no}`,
          degree: formData.degree,
          branch: formData.branch,
          institute_type: formData.institute_type,
          institute_name: formData.institute_name,
          start_year: parseInt(formData.start_year),
          end_year: parseInt(formData.end_year),
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq('id', formData.id);

      if (error) throw error;
      toast({ title: "Profile Updated", description: "Your details have been saved successfully." });
      onComplete();
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    }
  };

  return { formData, setFormData, masterData, handleSubmit, init };
};

// --- 1. Dialog Version (Deprecated for Login, but kept for manual triggering) ---
export const ProfileCompletion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { formData, setFormData, masterData, handleSubmit, init } = useProfileLogic(() => setIsOpen(false));

  useEffect(() => {
    init().then(missing => {
      if (missing) setIsOpen(true);
    });
  }, [init]);

  if (!masterData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-[#050505] border-white/10 text-white sm:max-w-2xl p-0 gap-0 shadow-2xl">
        <div className="bg-[#0a0a0a] p-6 border-b border-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white flex items-center gap-2">
              Complete Your Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Please provide your details to continue.
            </DialogDescription>
          </DialogHeader>
        </div>
        <ProfileFormContent 
          formData={formData} 
          setFormData={setFormData} 
          masterData={masterData} 
          handleSubmit={handleSubmit}
          onAskLater={() => setIsOpen(false)} 
          mode="dialog"
        />
      </DialogContent>
    </Dialog>
  );
};

// --- 2. Sheet Version (For Forced Entry on Exam/Practice) ---
interface ProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProfileSheet = ({ open, onOpenChange }: ProfileSheetProps) => {
  const { formData, setFormData, masterData, handleSubmit, init } = useProfileLogic(() => onOpenChange(false));

  useEffect(() => {
    if (open) init();
  }, [open, init]);

  if (!masterData) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="bg-[#050505] border-l border-white/10 text-white w-full sm:max-w-xl p-0 overflow-y-auto">
        <div className="bg-[#0a0a0a] p-6 border-b border-white/10">
          <SheetHeader>
            <SheetTitle className="text-xl font-semibold text-white">Action Required</SheetTitle>
            <SheetDescription className="text-muted-foreground">
              You must complete your profile before accessing practice or exams.
            </SheetDescription>
          </SheetHeader>
        </div>
        <div className="px-6 py-4">
          <ProfileFormContent 
            formData={formData} 
            setFormData={setFormData} 
            masterData={masterData} 
            handleSubmit={handleSubmit}
            // NO "Ask me later" here because it is mandatory
            mode="sheet"
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};
