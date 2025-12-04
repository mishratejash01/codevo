import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Stepper, { Step } from '@/components/ui/stepper';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useToast } from '@/hooks/use-toast';
import { User, CheckCircle2, XCircle, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

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
                    onChange(item.value === 'Other' ? '' : item.value); // If Other, clear value to force text input
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

export const ProfileCompletion = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const { toast } = useToast();

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    username: '',
    country_code: '+91',
    contact_no: '',
    
    // Academic
    degree: '',
    branch: '',
    institute_type: '',
    institute_name: '',
    start_year: '',
    end_year: '',
    
    // Location
    country: 'India'
  });

  // UI State for Manual Entry
  const [isManualInstitute, setIsManualInstitute] = useState(false);
  const [isManualBranch, setIsManualBranch] = useState(false);

  // Fetch Dropdown Data
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

  useEffect(() => {
    const initProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

      if (profile) {
        // Check mandatory fields
        const missingFields = !profile.full_name || !profile.username || !profile.contact_no || !profile.institute_name;
        
        if (missingFields) {
          setFormData(prev => ({
            ...prev,
            id: user.id,
            full_name: profile.full_name || user.user_metadata.full_name || '',
            username: profile.username || '',
            // Pre-fill if exists, else defaults
          }));
          setIsOpen(true);
        }
      }
      setLoading(false);
    };
    initProfile();
  }, []);

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
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    }
  };

  // Validators
  const step1Valid = formData.full_name && formData.username && usernameAvailable && formData.contact_no.length >= 10;
  const step2Valid = formData.degree && formData.institute_type && formData.institute_name && formData.branch && formData.start_year && formData.end_year;
  const step3Valid = formData.country;

  if (loading || !masterData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[#050505] border-white/10 text-white sm:max-w-2xl p-0 gap-0 shadow-2xl">
        
        {/* Header */}
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

        <div className="p-1 min-h-[400px]">
          <Stepper
            initialStep={1}
            onFinalStepCompleted={handleSubmit}
            backButtonText="Back"
            nextButtonText="Next"
          >
            {/* STEP 1: IDENTITY */}
            <Step>
              <div className="space-y-5 py-4">
                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Full Legal Name</Label>
                  <Input 
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    placeholder="John Doe"
                    className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Username</Label>
                  <div className="relative">
                    <Input 
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value.toLowerCase().replace(/\s/g, '')})}
                      placeholder="johndoe123"
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
                      <SelectTrigger className="w-[100px] bg-white/5 border-white/10 text-white h-11 focus:border-white/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white h-60">
                        {masterData.countries.map(c => (
                          <SelectItem key={c.id} value={c.code || '+00'}>{c.code} {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input 
                      type="tel"
                      value={formData.contact_no}
                      onChange={(e) => setFormData({...formData, contact_no: e.target.value})}
                      placeholder="1234567890"
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
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="Select Degree" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                        {masterData.degrees.map(d => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Institute Type</Label>
                    <Select value={formData.institute_type} onValueChange={(v) => setFormData({...formData, institute_type: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="Select Type" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                        {masterData.instituteTypes.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
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
                      placeholder="Type institute name"
                      className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                      autoFocus
                    />
                  ) : (
                    <SearchableSelect 
                      options={[...masterData.institutes.map(i => ({ label: i.name, value: i.name })), { label: "Other / Not in list", value: "Other" }]}
                      value={formData.institute_name}
                      onChange={(val) => {
                        if (!val) setIsManualInstitute(true);
                        else setFormData({...formData, institute_name: val});
                      }}
                      placeholder="Select Institute..."
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
                      placeholder="Type branch name"
                      className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"
                    />
                  ) : (
                    <SearchableSelect 
                      options={[...masterData.branches.map(b => ({ label: b.name, value: b.name })), { label: "Other", value: "Other" }]}
                      value={formData.branch}
                      onChange={(val) => {
                        if (!val) setIsManualBranch(true);
                        else setFormData({...formData, branch: val});
                      }}
                      placeholder="Select Branch..."
                      customEnabled={true}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Start Year</Label>
                    <Select value={formData.start_year} onValueChange={(v) => setFormData({...formData, start_year: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="YYYY" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white h-48">
                        {Array.from({length: 10}, (_, i) => new Date().getFullYear() - i).map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-muted-foreground text-xs font-medium uppercase tracking-wider">End Year (Estimated)</Label>
                    <Select value={formData.end_year} onValueChange={(v) => setFormData({...formData, end_year: v})}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-white/30"><SelectValue placeholder="YYYY" /></SelectTrigger>
                      <SelectContent className="bg-[#1a1a1c] border-white/10 text-white h-48">
                        {Array.from({length: 8}, (_, i) => new Date().getFullYear() + i).map(y => (
                          <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    options={masterData.countries.map(c => ({ label: c.name, value: c.name }))}
                    value={formData.country}
                    onChange={(val) => setFormData({...formData, country: val})}
                    placeholder="Select Country..."
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
      </DialogContent>
    </Dialog>
  );
};
