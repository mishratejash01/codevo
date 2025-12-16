import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Trash2, Plus, Users, User } from 'lucide-react';
import { toast } from 'sonner';

// --- VALIDATION SCHEMA ---
const formSchema = z.object({
  // Step 1: Identity
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  mobile_number: z.string().min(10, "Valid mobile required"),
  college_org_name: z.string().min(2, "Required"),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer']),
  country_city: z.string().min(2, "Location required"),
  
  // Step 2: Tech
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  primary_languages: z.string().min(1, "Enter at least one language"),
  tech_stack_skills: z.string().optional(),
  github_link: z.string().url().optional().or(z.literal("")),
  linkedin_link: z.string().url().optional().or(z.literal("")),
  resume_url: z.string().url().optional().or(z.literal("")),

  // Step 3: Team
  participation_type: z.enum(['Solo', 'Team']),
  team_name: z.string().optional(),
  team_members: z.array(z.object({
    name: z.string().min(1, "Name required"),
    email: z.string().email("Email required")
  })).optional(),

  // Step 4: Specifics & Compliance
  motivation_answer: z.string().min(10, "Tell us a bit more!"),
  preferred_track: z.string().optional(),
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the rules"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
}).superRefine((data, ctx) => {
  if (data.participation_type === 'Team') {
    if (!data.team_name || data.team_name.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Team Name is required for teams",
        path: ["team_name"]
      });
    }
    if (!data.team_members || data.team_members.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add at least one team member",
        path: ["team_members"]
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

interface EventRegistrationModalProps {
  event: { id: string; title: string };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationModal({ event, isOpen, onOpenChange }: EventRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", experience_level: "Beginner",
      primary_languages: "", tech_stack_skills: "",
      participation_type: "Solo", team_name: "", team_members: [],
      agreed_to_rules: false, agreed_to_privacy: false,
      motivation_answer: ""
    },
    mode: "onChange" 
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "team_members"
  });

  const watchParticipation = form.watch("participation_type");

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();

    const formattedData = {
      event_id: event.id,
      user_id: session?.user?.id,
      ...values,
      primary_languages: values.primary_languages.split(',').map(s => s.trim()),
      tech_stack_skills: values.tech_stack_skills ? values.tech_stack_skills.split(',').map(s => s.trim()) : [],
      team_members_data: values.participation_type === 'Team' ? values.team_members : [],
    };

    delete (formattedData as any).team_members;

    const { error } = await supabase.from('event_registrations').insert(formattedData);

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') toast.error("Already registered!");
      else toast.error("Registration failed. Try again.");
      return;
    }

    setIsSuccess(true);
    toast.success("Welcome aboard!");
  }

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'mobile_number', 'college_org_name', 'country_city', 'current_status'];
    if (step === 2) fieldsToValidate = ['primary_languages', 'experience_level'];
    if (step === 3) fieldsToValidate = watchParticipation === 'Team' ? ['participation_type', 'team_name', 'team_members'] : ['participation_type'];
    
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-[#0c0c0e] border border-white/10 text-white p-0 gap-0">
        
        {/* Header */}
        <div className="bg-[#151518] p-6 border-b border-white/5 sticky top-0 z-20">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex justify-between items-center">
              <span>{event.title}</span>
              {!isSuccess && <span className="text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Step {step}/{totalSteps}</span>}
            </DialogTitle>
          </DialogHeader>
          {!isSuccess && (
            <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
              <div 
                className="bg-purple-600 h-full transition-all duration-300 ease-out" 
                style={{ width: `${(step / totalSteps) * 100}%` }} 
              />
            </div>
          )}
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 text-green-500 border border-green-500/20">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Registration Confirmed!</h3>
              <p className="text-gray-400 mb-8 max-w-sm">
                You have successfully registered for <strong>{event.title}</strong>. Check your email for details.
              </p>
              <Button onClick={() => onOpenChange(false)} className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                Return to Event Page
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* --- STEP 1: IDENTITY --- */}
                {step === 1 && (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel>Full Name</FormLabel>
                          <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem className="col-span-2 md:col-span-1">
                          <FormLabel>Email</FormLabel>
                          <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile</FormLabel>
                          <FormControl><Input placeholder="+91..." className="bg-white/5 border-white/10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem>
                          <FormLabel>City / Country</FormLabel>
                          <FormControl><Input placeholder="New Delhi, India" className="bg-white/5 border-white/10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="college_org_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel>College / Organization</FormLabel>
                        <FormControl><Input className="bg-white/5 border-white/10" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* --- DROPDOWN 1: CURRENT STATUS --- */}
                    <FormField control={form.control} name="current_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#151518] text-white border-white/10">
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Working Professional">Working Professional</SelectItem>
                            <SelectItem value="Freelancer">Freelancer</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* --- STEP 2: TECH PROFILE --- */}
                {step === 2 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* --- DROPDOWN 2: EXPERIENCE LEVEL --- */}
                    <FormField control={form.control} name="experience_level" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coding Experience</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#151518] text-white border-white/10">
                            <SelectItem value="Beginner">Beginner (0-2 years)</SelectItem>
                            <SelectItem value="Intermediate">Intermediate (2-5 years)</SelectItem>
                            <SelectItem value="Advanced">Advanced (5+ years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="primary_languages" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Languages <span className="text-gray-500 text-xs">(comma separated)</span></FormLabel>
                          <FormControl><Input placeholder="Python, Java, C++" className="bg-white/5 border-white/10" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="tech_stack_skills" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Frameworks/Skills <span className="text-gray-500 text-xs">(comma separated)</span></FormLabel>
                          <FormControl><Input placeholder="React, Node.js, AWS" className="bg-white/5 border-white/10" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>

                    <div className="space-y-3 pt-2">
                       <FormLabel className="text-gray-400 uppercase text-xs tracking-wider">Social Presence</FormLabel>
                       <div className="grid grid-cols-1 gap-3">
                        <FormField control={form.control} name="github_link" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="GitHub Profile URL" className="bg-white/5 border-white/10" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="linkedin_link" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="LinkedIn Profile URL" className="bg-white/5 border-white/10" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="resume_url" render={({ field }) => (
                          <FormItem><FormControl><Input placeholder="Resume/Portfolio URL" className="bg-white/5 border-white/10" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                       </div>
                    </div>
                  </div>
                )}

                {/* --- STEP 3: TEAM LOGIC --- */}
                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    
                    {/* --- DROPDOWN 3: PARTICIPATION TYPE (CHANGED FROM RADIO) --- */}
                    <FormField control={form.control} name="participation_type" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Participation Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-white/5 border-white/10 h-12">
                              <SelectValue placeholder="Select participation type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-[#151518] text-white border-white/10">
                            <SelectItem value="Solo">
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-purple-400"/> 
                                    <span>Solo Participation</span>
                                </div>
                            </SelectItem>
                            <SelectItem value="Team">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-purple-400"/>
                                    <span>Team Participation</span>
                                </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {watchParticipation === 'Team' && (
                      <div className="space-y-4 pl-4 border-l-2 border-purple-500/30">
                        <FormField control={form.control} name="team_name" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Team Name</FormLabel>
                            <FormControl><Input placeholder="e.g. Code Ninjas" className="bg-white/5 border-white/10" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )} />

                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <FormLabel>Team Members</FormLabel>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: "", email: "" })} className="h-7 text-xs border-white/20">
                              <Plus className="w-3 h-3 mr-1" /> Add Member
                            </Button>
                          </div>
                          {fields.map((field, index) => (
                            <div key={field.id} className="flex gap-2 items-start">
                              <FormField control={form.control} name={`team_members.${index}.name`} render={({ field }) => (
                                <FormItem className="flex-1"><FormControl><Input placeholder="Name" className="bg-white/5 border-white/10 h-8 text-sm" {...field} /></FormControl></FormItem>
                              )} />
                              <FormField control={form.control} name={`team_members.${index}.email`} render={({ field }) => (
                                <FormItem className="flex-1"><FormControl><Input placeholder="Email" className="bg-white/5 border-white/10 h-8 text-sm" {...field} /></FormControl></FormItem>
                              )} />
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/20">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <FormMessage>{form.formState.errors.team_members?.message}</FormMessage>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- STEP 4: FINAL SPECIFICS --- */}
                {step === 4 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <FormField control={form.control} name="preferred_track" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Track (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger className="bg-white/5 border-white/10"><SelectValue placeholder="Select a track" /></SelectTrigger></FormControl>
                          <SelectContent className="bg-[#151518] text-white border-white/10">
                            <SelectItem value="FinTech">FinTech</SelectItem>
                            <SelectItem value="HealthTech">HealthTech</SelectItem>
                            <SelectItem value="EdTech">EdTech</SelectItem>
                            <SelectItem value="Open Innovation">Open Innovation</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="motivation_answer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Why do you want to join?</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Tell us about your motivation..." className="bg-white/5 border-white/10 min-h-[100px]" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-white/20 data-[state=checked]:bg-purple-600" /></FormControl>
                          <div className="space-y-1 leading-none"><FormLabel>I agree to the Hackathon Rules & Code of Conduct.</FormLabel></div>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-white/20 data-[state=checked]:bg-purple-600" /></FormControl>
                          <div className="space-y-1 leading-none"><FormLabel>I consent to the Privacy Policy.</FormLabel></div>
                        </FormItem>
                      )} />
                      {(form.formState.errors.agreed_to_rules || form.formState.errors.agreed_to_privacy) && (
                         <p className="text-sm text-red-500 font-medium">You must agree to the terms to proceed.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex justify-between pt-6 border-t border-white/5">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} className="border-white/10 hover:bg-white/5 text-white">
                      <ChevronLeft className="w-4 h-4 mr-2" /> Previous
                    </Button>
                  ) : (
                    <div />
                  )}
                  
                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="bg-white text-black hover:bg-gray-200 px-8 font-bold">
                      Next <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white px-8 font-bold shadow-[0_0_20px_rgba(147,51,234,0.3)]">
                      {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Complete Registration"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
