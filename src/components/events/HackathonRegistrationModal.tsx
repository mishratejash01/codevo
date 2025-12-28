import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Loader2, Check, ChevronRight, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

// --- DATA SCHEMA ---
interface HackathonEvent {
  id: string;
  title: string;
  min_team_size: number;
  max_team_size: number;
  allow_solo: boolean;
  tracks: string[];
  custom_questions: { id: string; question: string; required: boolean; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
  is_paid: boolean;
  registration_fee: number;
  currency: string;
  rules_document_url?: string;
}

interface HackathonRegistrationModalProps {
  event: HackathonEvent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  full_name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  mobile_number: z.string().min(3, "Valid mobile required").max(20),
  college_org_name: z.string().min(2, "College/Org required").max(200),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer', 'Founder']),
  country_city: z.string().min(2, "Location required").max(100),
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  primary_languages: z.string().min(1, "Enter at least one language"),
  tech_stack_skills: z.string().optional(),
  github_link: z.string().optional().or(z.literal("")),
  linkedin_link: z.string().optional().or(z.literal("")),
  resume_url: z.string().optional().or(z.literal("")),
  portfolio_url: z.string().optional().or(z.literal("")),
  prior_experience: z.boolean().default(false),
  participation_type: z.enum(['Solo', 'Team']),
  team_name: z.string().optional(),
  team_members: z.array(z.object({
    name: z.string().min(1, "Member Name required"),
    email: z.string().email("Member Email required"),
    mobile: z.string().optional(),
    role: z.string().default("Member")
  })).optional(),
  preferred_track: z.string().optional(),
  motivation_answer: z.string().min(10, "Please provide more details (min 10 chars)").max(1000),
  custom_answers: z.record(z.string()).optional(),
  // Checkbox validation must be strictly true
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the rules"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to the privacy policy"),
}).superRefine((data, ctx) => {
  if (data.participation_type === 'Team') {
    if (!data.team_name || data.team_name.trim().length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Team Name is required for teams", path: ["team_name"] });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;
const STEP_TITLES = ["Personal", "Skills", "Team", "Details", "Confirm"];

export function HackathonRegistrationModal({ event, isOpen, onOpenChange }: HackathonRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const tracks = Array.isArray(event.tracks) ? event.tracks : [];
  const customQuestions = Array.isArray(event.custom_questions) ? event.custom_questions : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", experience_level: "Beginner",
      primary_languages: "", tech_stack_skills: "", prior_experience: false,
      participation_type: event.allow_solo ? "Solo" : "Team",
      team_name: "", team_members: [],
      preferred_track: tracks[0] || "",
      motivation_answer: "", custom_answers: {},
      agreed_to_rules: false, agreed_to_privacy: false,
    },
    mode: "onChange"
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "team_members" });
  const watchParticipation = form.watch("participation_type");

  useEffect(() => {
    async function loadProfile() {
      if (!isOpen) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        form.setValue('email', session.user.email || '');
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) {
          if(profile.full_name) form.setValue('full_name', profile.full_name);
          if(profile.contact_no) form.setValue('mobile_number', profile.contact_no);
          if(profile.institute_name) form.setValue('college_org_name', profile.institute_name);
          if(profile.country) form.setValue('country_city', profile.country);
          if(profile.github_handle) form.setValue('github_link', `https://github.com/${profile.github_handle}`);
          if(profile.linkedin_url) form.setValue('linkedin_link', profile.linkedin_url);
          if(profile.experience_level) form.setValue('experience_level', (profile.experience_level as any));
        }
      }
    }
    loadProfile();
  }, [isOpen, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    console.log("Submitting registration...", values);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Please log in to register");

      // 1. Prepare registration data object
      const registrationData = {
        event_id: event.id,
        // user_id is handled securely on the server side via RPC (auth.uid())
        full_name: values.full_name.trim(),
        email: values.email.trim().toLowerCase(),
        mobile_number: values.mobile_number.trim(),
        college_org_name: values.college_org_name.trim(),
        current_status: values.current_status,
        country_city: values.country_city.trim(),
        experience_level: values.experience_level,
        primary_languages: values.primary_languages.split(',').map(s => s.trim()).filter(Boolean),
        tech_stack_skills: values.tech_stack_skills ? values.tech_stack_skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        github_link: values.github_link || null,
        linkedin_link: values.linkedin_link || null,
        resume_url: values.resume_url || null,
        portfolio_url: values.portfolio_url || null,
        prior_experience: values.prior_experience,
        participation_type: values.participation_type,
        team_name: values.participation_type === 'Team' ? values.team_name : null,
        // team_role is forced to 'Leader' in the RPC
        preferred_track: values.preferred_track || null,
        motivation_answer: values.motivation_answer.trim(),
        custom_answers: values.custom_answers || {},
        agreed_to_rules: values.agreed_to_rules,
        agreed_to_privacy: values.agreed_to_privacy,
        payment_status: event.is_paid ? 'pending' : 'exempt',
        status: event.is_paid ? 'pending_payment' : 'confirmed',
      };

      // 2. Prepare Team Members Payload
      // If participation type is Team, send the members array, otherwise send empty array
      const teamMembersPayload = (values.participation_type === 'Team' && values.team_members)
        ? values.team_members 
        : [];

      // 3. Call the RPC function (Atomic Transaction)
      console.log("Calling RPC 'register_team_event' with:", { registrationData, teamMembersPayload });
      
      const { data: rpcResult, error: rpcError } = await supabase.rpc('register_team_event', {
        p_registration: registrationData,
        p_team_members: teamMembersPayload
      });

      if (rpcError) {
        console.error("Supabase RPC insert error:", rpcError);
        throw rpcError;
      }

      console.log("Registration RPC Success:", rpcResult);

      setIsSuccess(true);
      toast.success("Registration successful!");
      
    } catch (err: any) {
      console.error("Registration process error:", err);
      // specific check for unique violation which might come from the RPC bubbling up Postgres errors
      const errorMessage = err.message || "";
      
      if (err.code === '23505' || errorMessage.includes('duplicate key') || errorMessage.includes('unique constraint')) {
        toast.error("You are already registered for this event.");
      } else {
        toast.error(`Registration failed: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // --- ERROR LOGGING ---
  const getErrorMessages = (errors: any): string[] => {
    let messages: string[] = [];
    Object.entries(errors).forEach(([key, value]: [string, any]) => {
      if (value?.message) {
        messages.push(value.message);
      } else if (typeof value === 'object' && value !== null) {
        messages = [...messages, ...getErrorMessages(value)];
      }
    });
    return messages;
  };

  const onFormError = (errors: any) => {
    // THIS LOG WILL SHOW YOU EXACTLY WHICH FIELD IS FAILING
    console.error("VALIDATION ERROR BREAKDOWN:", JSON.stringify(errors, null, 2));

    const messages = getErrorMessages(errors);
    const uniqueMessages = Array.from(new Set(messages));
    
    if (uniqueMessages.length > 0) {
      toast.error("Validation Failed", {
        description: (
          <ul className="list-disc pl-4 text-xs mt-2 space-y-1">
            {uniqueMessages.slice(0, 5).map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )
      });
    } else {
      toast.error("Please fill in all required fields correctly.");
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'mobile_number', 'college_org_name', 'country_city', 'current_status'];
    if (step === 2) fieldsToValidate = ['primary_languages', 'experience_level'];
    if (step === 3) fieldsToValidate = watchParticipation === 'Team' ? ['participation_type', 'team_name'] : ['participation_type'];
    if (step === 4) fieldsToValidate = ['motivation_answer'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setStep(s => Math.min(s + 1, totalSteps));
    } else {
       console.log("Step validation failed", form.formState.errors);
       toast.error("Please complete the required fields in this step.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!isSubmitting) onOpenChange(open);
    }}>
      <DialogContent className="max-w-[700px] max-h-[90vh] p-0 bg-transparent border-none outline-none overflow-y-auto block">
        <VisuallyHidden>
          <DialogTitle>Registration</DialogTitle>
          <DialogDescription>Event Registration</DialogDescription>
        </VisuallyHidden>

        <div className="w-full bg-[#050505] border border-[#1a1a1a] font-sans selection:bg-orange-500/30">
          
          {!isSuccess ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit, onFormError)}>
                {/* --- Header --- */}
                <header className="p-[40px] bg-[#0a0a0a] border-b border-[#1a1a1a]">
                  <div className="flex justify-between items-start mb-[40px]">
                    <div>
                      <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-2">2025 Event Registration</span>
                      <h2 className="font-serif text-[2.2rem] font-normal text-white leading-tight">Join the Hackathon</h2>
                    </div>
                    <div className="w-[2px] h-[40px] bg-[#ff8c00]" />
                  </div>

                  {/* Stepper */}
                  <div className="relative flex justify-between w-full mt-10">
                    <div className="absolute top-[15px] left-0 w-full h-[1px] bg-[#1a1a1a] z-0" />
                    {STEP_TITLES.map((title, index) => {
                      const sNum = index + 1;
                      return (
                        <div key={title} className="relative z-10 bg-[#0a0a0a] flex flex-col items-center">
                          <div className={cn(
                            "w-[32px] h-[32px] border flex items-center justify-center text-[0.6rem] transition-all duration-400 font-mono",
                            step === sNum ? "border-[#ff8c00] text-[#ff8c00] shadow-[0_0_10px_rgba(255,140,0,0.15)]" : 
                            step > sNum ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a] text-[#777777]"
                          )}>
                            {step > sNum ? <Check size={12} /> : `0${sNum}`}
                          </div>
                          <span className={cn(
                            "absolute top-[40px] text-[0.5rem] uppercase tracking-[2px] whitespace-nowrap",
                            step === sNum ? "text-[#ff8c00]" : "text-[#777777]"
                          )}>{title}</span>
                        </div>
                      );
                    })}
                  </div>
                </header>

                {/* --- Body --- */}
                <div className="p-[40px] min-h-[480px]">
                  {/* Step 1: Personal */}
                  {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-[25px] gap-y-[25px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Your Full Name</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} placeholder="e.g. John Doe" /></FormControl>
                          <FormMessage className="text-[10px] uppercase text-red-500" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Email Address</label>
                          <FormControl><input className="w-full bg-[#0a0a0a] border border-[#1a1a1a] text-[#777777] p-[14px] text-[0.9rem] cursor-not-allowed" {...field} disabled /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Phone Number</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} placeholder="+91 00000 00000" /></FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">City & Country</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} /></FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="college_org_name" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">College or Company</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} /></FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="current_status" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Current Status</label>
                          <FormControl>
                            <select className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none" value={field.value} onChange={field.onChange}>
                              <option value="Student" className="bg-black">Student</option>
                              <option value="Working Professional" className="bg-black">Working Professional</option>
                              <option value="Freelancer" className="bg-black">Freelancer</option>
                              <option value="Founder" className="bg-black">Founder</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {/* Step 2: Skills */}
                  {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <FormField control={form.control} name="experience_level" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Experience Level</label>
                          <FormControl>
                            <select className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none" value={field.value} onChange={field.onChange}>
                              <option value="Beginner" className="bg-black">Beginner</option>
                              <option value="Intermediate" className="bg-black">Intermediate</option>
                              <option value="Advanced" className="bg-black">Advanced</option>
                              <option value="Expert" className="bg-black">Expert</option>
                            </select>
                          </FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="primary_languages" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Main Languages</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} placeholder="e.g. JavaScript, Python" /></FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="github_link" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">GitHub Link</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} placeholder="https://github.com/..." /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="linkedin_link" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">LinkedIn</label>
                          <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} placeholder="https://linkedin.com/..." /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tech_stack_skills" render={({ field }) => (
                        <FormItem className="md:col-span-2 space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">About your background</label>
                          <FormControl><textarea className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none h-[100px] focus:border-[#777777] resize-none" {...field} placeholder="Tell us a bit about your previous projects..." /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  )}

                  {/* Step 3: Team */}
                  {step === 3 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-[20px]">
                        {event.allow_solo && (
                          <div 
                            onClick={() => form.setValue('participation_type', 'Solo')}
                            className={cn("border p-[25px] cursor-pointer transition-all text-center bg-[#080808]", watchParticipation === 'Solo' ? "border-[#ff8c00]" : "border-[#1a1a1a] opacity-50")}
                          >
                            <h4 className="text-[0.8rem] uppercase tracking-[2px] text-white mb-2.5 font-bold">Join Solo</h4>
                            <p className="text-[0.7rem] text-[#777777]">I will work by myself</p>
                          </div>
                        )}
                        <div 
                          onClick={() => form.setValue('participation_type', 'Team')}
                          className={cn("border p-[25px] cursor-pointer transition-all text-center bg-[#080808]", watchParticipation === 'Team' ? "border-[#ff8c00]" : "border-[#1a1a1a] opacity-50", !event.allow_solo && "col-span-2")}
                        >
                          <h4 className="text-[0.8rem] uppercase tracking-[2px] text-white mb-2.5 font-bold">Form a Team</h4>
                          <p className="text-[0.7rem] text-[#777777]">Invite friends to join me</p>
                        </div>
                      </div>

                      {watchParticipation === 'Team' && (
                        <div className="space-y-6">
                          <FormField control={form.control} name="team_name" render={({ field }) => (
                            <FormItem className="space-y-2.5">
                              <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Your Team Name</label>
                              <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#ff8c00]" {...field} /></FormControl>
                              <FormMessage className="text-red-500 text-xs" />
                            </FormItem>
                          )} />

                          <div className="border border-[#1a1a1a]">
                            <div className="bg-[#0a0a0a] p-[15px_20px] border-b border-[#1a1a1a] flex justify-between items-center">
                              <span className="text-[0.65rem] uppercase tracking-[2px] text-[#777777]">Team Members</span>
                              {fields.length < (event.max_team_size - 1) && (
                                <button type="button" onClick={() => append({ name: "", email: "", role: "Member" })} className="text-[10px] text-[#ff8c00] border border-[#ff8c00]/30 px-2 py-0.5 hover:bg-[#ff8c00] hover:text-black transition-all">ADD MEMBER</button>
                              )}
                            </div>
                            
                            <div className="divide-y divide-[#1a1a1a]">
                              {fields.map((field, index) => (
                                <div key={field.id} className="p-5 flex justify-between items-center group">
                                  <div className="space-y-4 w-full mr-4">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className="space-y-1">
                                         <input className="bg-transparent border border-[#1a1a1a] p-2 text-[0.8rem] text-white w-full" placeholder="Name" {...form.register(`team_members.${index}.name`)} />
                                         {form.formState.errors.team_members?.[index]?.name && <span className="text-red-500 text-[10px] block">Name required</span>}
                                      </div>
                                      <div className="space-y-1">
                                         <input className="bg-transparent border border-[#1a1a1a] p-2 text-[0.8rem] text-white w-full" placeholder="Email" {...form.register(`team_members.${index}.email`)} />
                                         {form.formState.errors.team_members?.[index]?.email && <span className="text-red-500 text-[10px] block">Valid email required</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <button type="button" onClick={() => remove(index)} className="text-[#777777] hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </div>
                              ))}
                              {fields.length === 0 && <p className="text-center p-4 text-[#777777] text-xs">No members added yet.</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 4: Details */}
                  {step === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {tracks.length > 0 && (
                        <FormField control={form.control} name="preferred_track" render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Which track interests you most?</label>
                            <FormControl>
                              <select className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none" value={field.value} onChange={field.onChange}>
                                {tracks.map(t => <option key={t} value={t} className="bg-black">{t}</option>)}
                              </select>
                            </FormControl>
                          </FormItem>
                        )} />
                      )}
                      <FormField control={form.control} name="motivation_answer" render={({ field }) => (
                        <FormItem className="space-y-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Why do you want to join this hackathon?</label>
                          <FormControl><textarea className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none h-[120px] focus:border-[#777777] resize-none" {...field} placeholder="Tell us what you hope to learn or build..." /></FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      {customQuestions.map((q: any) => (
                        <FormField key={q.id} control={form.control} name={`custom_answers.${q.id}`} render={({ field }) => (
                          <FormItem className="space-y-2.5">
                            <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">{q.question}</label>
                            <FormControl><input className="w-full bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]" {...field} /></FormControl>
                          </FormItem>
                        )} />
                      ))}
                    </div>
                  )}

                  {/* Step 5: Final Check */}
                  {step === 5 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-[30px]">
                        <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-2.5">Registration Fee</span>
                        <p className="text-[1.5rem] font-light text-white">{event.is_paid ? `${event.currency} ${event.registration_fee}.00` : 'NO_FEE'}</p>
                        <p className="text-[0.65rem] text-[#777777] mt-[5px] uppercase tracking-[1px]">Standard Entry Fee Protocol</p>
                      </div>

                      <div className="space-y-4">
                        <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 cursor-pointer">
                            <FormControl>
                                <input 
                                    type="checkbox" 
                                    checked={field.value} 
                                    onChange={(e) => field.onChange(e.target.checked)} 
                                    className={cn("w-4 h-4 mt-1 accent-[#ff8c00] cursor-pointer", form.formState.errors.agreed_to_rules && "outline outline-1 outline-red-500")}
                                />
                            </FormControl>
                            <div className="flex flex-col">
                              <span className={cn("text-[0.75rem] leading-relaxed", form.formState.errors.agreed_to_rules ? "text-red-400" : "text-white")}>
                                I agree to follow the event rules and assembly code of conduct protocol.
                              </span>
                            </div>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                          <FormItem className="flex items-start space-x-3 space-y-0 cursor-pointer">
                            <FormControl>
                                <input 
                                    type="checkbox" 
                                    checked={field.value} 
                                    onChange={(e) => field.onChange(e.target.checked)} 
                                    className={cn("w-4 h-4 mt-1 accent-[#ff8c00] cursor-pointer", form.formState.errors.agreed_to_privacy && "outline outline-1 outline-red-500")}
                                />
                            </FormControl>
                            <div className="flex flex-col">
                              <span className={cn("text-[0.75rem] leading-relaxed", form.formState.errors.agreed_to_privacy ? "text-red-400" : "text-white")}>
                                I authorize event organizers to process my data for assembly communication.
                              </span>
                            </div>
                          </FormItem>
                        )} />
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Footer --- */}
                <footer className="p-[30px_40px] bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-between items-center">
                  <div>
                    {step > 1 && (
                      <button type="button" onClick={() => setStep(s => s - 1)} className="bg-transparent border border-[#1a1a1a] text-[#777777] px-[32px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold hover:text-white hover:border-white transition-all">Back</button>
                    )}
                  </div>
                  <div>
                    {step < totalSteps ? (
                      <button type="button" onClick={nextStep} className="bg-[#ff8c00] text-black border-none px-[32px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold hover:bg-white transition-all flex items-center gap-2">Continue <ChevronRight size={14} /></button>
                    ) : (
                      <button type="submit" disabled={isSubmitting} className="bg-[#ff8c00] text-black border-none px-[32px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <>{event.is_paid ? 'Register & Pay' : 'Join Assembly'} <Check size={14} /></>}
                      </button>
                    )}
                  </div>
                </footer>
              </form>
            </Form>
          ) : (
            /* --- Success View --- */
            <div className="flex flex-col items-center justify-center p-[80px_40px] text-center min-h-[700px] animate-in zoom-in duration-500">
              <div className="w-[60px] h-[60px] border border-[#00ff88] rounded-full text-[#00ff88] flex items-center justify-center text-2xl mb-[30px] shadow-[0_0_20px_rgba(0,255,136,0.1)]">
                <Check size={30} strokeWidth={3} />
              </div>
              <h2 className="font-serif text-[2.8rem] text-white mb-[10px]">You're Registered</h2>
              <p className="text-[#777777] uppercase tracking-[3px] text-[0.7rem] mb-[50px]">Welcome to the 2025 Assembly</p>
              
              <div className="w-full border border-[#1a1a1a] p-[30px] bg-[#0a0a0a] mb-[30px]">
                <p className="text-[0.9rem] font-light leading-relaxed text-[#e0e0e0]">
                  Your application is successful. {event.is_paid ? 'Please complete the payment below to finalize your spot.' : 'Check your comms (email) for joining instructions.'}
                </p>
              </div>
              
              {event.is_paid ? (
                <button className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] hover:bg-white transition-all flex items-center justify-center gap-2">Complete Payment <ExternalLink size={14} /></button>
              ) : (
                <button onClick={() => onOpenChange(false)} className="w-full bg-white text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] hover:bg-[#ff8c00] transition-all">Return to Briefing</button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
