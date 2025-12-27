import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, User, Calendar, Shield, Mail, Phone, Building, MapPin, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NormalEvent {
  id: string;
  title: string;
  custom_questions: { id: string; question: string; required: boolean; type: 'text' | 'textarea' | 'select'; options?: string[] }[];
  is_paid: boolean;
  registration_fee: number;
  currency: string;
}

interface NormalEventRegistrationModalProps {
  event: NormalEvent;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const formSchema = z.object({
  // Step 1: Personal Info
  full_name: z.string().min(2, "Name is required").max(100),
  email: z.string().email("Invalid email").max(255),
  mobile_number: z.string().min(10, "Valid mobile required").max(20),
  college_org_name: z.string().min(2, "Required").max(200),
  current_status: z.enum(['Student', 'Working Professional', 'Freelancer', 'Founder']),
  country_city: z.string().min(2, "Location required").max(100),
  
  // Step 2: Event Specifics
  experience_level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  motivation_answer: z.string().min(10, "Please provide more details").max(500),
  custom_answers: z.record(z.string()).optional(),

  // Step 3: Agreements
  agreed_to_rules: z.boolean().refine(val => val === true, "You must agree to the terms"),
  agreed_to_privacy: z.boolean().refine(val => val === true, "You must agree to privacy policy"),
});

type FormValues = z.infer<typeof formSchema>;

const STEP_ICONS = [User, Calendar, Shield];
const STEP_TITLES = ["Personal Info", "Event Details", "Confirm"];

export function NormalEventRegistrationModal({ event, isOpen, onOpenChange }: NormalEventRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const customQuestions = Array.isArray(event.custom_questions) ? event.custom_questions : [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "", email: "", mobile_number: "", college_org_name: "", country_city: "",
      current_status: "Student", experience_level: "Beginner",
      motivation_answer: "", custom_answers: {},
      agreed_to_rules: false, agreed_to_privacy: false,
    },
    mode: "onChange"
  });

  // Pre-fill from user profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        form.setValue('email', session.user.email || '');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (profile) {
          form.setValue('full_name', profile.full_name || '');
          form.setValue('mobile_number', profile.contact_no || '');
          form.setValue('college_org_name', profile.institute_name || '');
          form.setValue('country_city', profile.country || '');
          form.setValue('experience_level', (profile.experience_level as any) || 'Beginner');
        }
      }
    }
    if (isOpen) loadProfile();
  }, [isOpen, form]);

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      toast.error("Please login to register");
      setIsSubmitting(false);
      return;
    }

    const registrationData = {
      event_id: event.id,
      user_id: session.user.id,
      full_name: values.full_name.trim(),
      email: values.email.trim().toLowerCase(),
      mobile_number: values.mobile_number.trim(),
      college_org_name: values.college_org_name.trim(),
      current_status: values.current_status,
      country_city: values.country_city.trim(),
      experience_level: values.experience_level,
      motivation_answer: values.motivation_answer.trim(),
      custom_answers: values.custom_answers || {},
      agreed_to_rules: values.agreed_to_rules,
      agreed_to_privacy: values.agreed_to_privacy,
      participation_type: 'Solo',
      team_role: 'Attendee',
      payment_status: event.is_paid ? 'pending' : 'exempt',
      status: event.is_paid ? 'pending_payment' : 'confirmed',
    };

    const { error } = await supabase
      .from('event_registrations')
      .insert(registrationData as any);

    if (error) {
      if (error.code === '23505') toast.error("You're already registered for this event!");
      else toast.error("Registration failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    toast.success("Registration successful!");
  }

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (step === 1) fieldsToValidate = ['full_name', 'email', 'mobile_number', 'college_org_name', 'country_city', 'current_status'];
    if (step === 2) fieldsToValidate = ['experience_level', 'motivation_answer'];

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep(s => Math.min(s + 1, totalSteps));
  };

  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto bg-gradient-to-b from-zinc-900 to-black border border-blue-500/20 text-white p-0 gap-0">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/20 p-6 border-b border-white/5 sticky top-0 z-20 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="block">{event.title}</span>
                <span className="text-xs font-normal text-blue-400">Event Registration</span>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {!isSuccess && (
            <div className="mt-6">
              <div className="flex justify-between items-center">
                {STEP_TITLES.map((title, index) => {
                  const StepIcon = STEP_ICONS[index];
                  const stepNum = index + 1;
                  const isActive = step === stepNum;
                  const isCompleted = step > stepNum;
                  
                  return (
                    <div key={title} className="flex flex-col items-center flex-1">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                        isActive ? "bg-blue-500 border-blue-400 shadow-lg shadow-blue-500/30" :
                        isCompleted ? "bg-green-500/20 border-green-500 text-green-400" :
                        "bg-zinc-800 border-zinc-700 text-zinc-500"
                      )}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <StepIcon className="w-4 h-4" />}
                      </div>
                      <span className={cn(
                        "text-[10px] mt-2 font-medium uppercase tracking-wide",
                        isActive ? "text-blue-400" : isCompleted ? "text-green-400" : "text-zinc-600"
                      )}>{title}</span>
                    </div>
                  );
                })}
              </div>
              
              <div className="w-full bg-zinc-800 h-1 mt-4 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-500" 
                  style={{ width: `${(step / totalSteps) * 100}%` }} 
                />
              </div>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in zoom-in duration-300">
              <div className="w-24 h-24 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-green-500/30">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">You're Registered! 🎉</h3>
              <p className="text-zinc-400 mb-6 max-w-md">
                Registration for <strong className="text-white">{event.title}</strong> is {event.is_paid ? 'pending payment' : 'confirmed'}.
              </p>
              {event.is_paid && (
                <Button className="w-full mb-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 font-bold">
                  <Lock className="w-4 h-4 mr-2" /> Complete Payment - {event.currency} {event.registration_fee}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full border-zinc-700 hover:bg-zinc-800">
                Return to Event Page
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                
                {/* STEP 1: Personal Info */}
                {step === 1 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <User className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">Personal Information</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="full_name" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><User className="w-3 h-3" /> Full Name</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500" placeholder="John Doe" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</FormLabel>
                          <FormControl><Input className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField control={form.control} name="mobile_number" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><Phone className="w-3 h-3" /> Mobile Number</FormLabel>
                          <FormControl><Input placeholder="+91 9876543210" className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="country_city" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2"><MapPin className="w-3 h-3" /> City, Country</FormLabel>
                          <FormControl><Input placeholder="New Delhi, India" className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>

                    <FormField control={form.control} name="college_org_name" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2"><Building className="w-3 h-3" /> College / Organization</FormLabel>
                        <FormControl><Input placeholder="IIT Madras" className="bg-zinc-800/50 border-zinc-700 focus:border-blue-500" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="current_status" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="Student">🎓 Student</SelectItem>
                            <SelectItem value="Working Professional">💼 Working Professional</SelectItem>
                            <SelectItem value="Freelancer">🚀 Freelancer</SelectItem>
                            <SelectItem value="Founder">🏢 Founder / Entrepreneur</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                )}

                {/* STEP 2: Event Details */}
                {step === 2 && (
                  <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">Event Details</h3>
                    </div>

                    <FormField control={form.control} name="experience_level" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                            <SelectItem value="Beginner">🌱 Beginner</SelectItem>
                            <SelectItem value="Intermediate">📈 Intermediate</SelectItem>
                            <SelectItem value="Advanced">⚡ Advanced</SelectItem>
                            <SelectItem value="Expert">🏆 Expert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="motivation_answer" render={({ field }) => (
                      <FormItem>
                        <FormLabel>What do you hope to learn from this event?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share what excites you about this event and what you hope to take away..." 
                            className="bg-zinc-800/50 border-zinc-700 min-h-[100px] focus:border-blue-500" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    {/* Dynamic Custom Questions */}
                    {customQuestions.map((q: any) => (
                      <FormField 
                        key={q.id} 
                        control={form.control} 
                        name={`custom_answers.${q.id}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{q.question} {q.required && <span className="text-red-400">*</span>}</FormLabel>
                            <FormControl>
                              {q.type === 'textarea' ? (
                                <Textarea className="bg-zinc-800/50 border-zinc-700" {...field} />
                              ) : q.type === 'select' && q.options ? (
                                <Select onValueChange={field.onChange}>
                                  <SelectTrigger className="bg-zinc-800/50 border-zinc-700">
                                    <SelectValue placeholder="Select an option" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-zinc-900 text-white border-zinc-700">
                                    {q.options.map((opt: string) => (
                                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input className="bg-zinc-800/50 border-zinc-700" {...field} />
                              )}
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                )}

                {/* STEP 3: Confirm */}
                {step === 3 && (
                  <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold">Confirm Registration</h3>
                    </div>

                    {event.is_paid && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-6 rounded-xl border border-blue-500/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-400">Registration Fee</p>
                            <p className="text-3xl font-bold text-white">{event.currency} {event.registration_fee}</p>
                          </div>
                          <Lock className="w-10 h-10 text-blue-400" />
                        </div>
                        <p className="text-xs text-zinc-500 mt-2">Payment will be processed after form submission</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <FormField control={form.control} name="agreed_to_rules" render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-zinc-600 mt-0.5" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              I agree to the <a href="/terms-of-service" target="_blank" className="text-blue-400 underline">Terms & Conditions</a>
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form.control} name="agreed_to_privacy" render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0 bg-zinc-800/30 p-4 rounded-xl border border-zinc-700">
                          <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} className="border-zinc-600 mt-0.5" />
                          </FormControl>
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium">
                              I agree to the <a href="/privacy-policy" target="_blank" className="text-blue-400 underline">Privacy Policy</a>
                            </FormLabel>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6 border-t border-zinc-800">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep} className="border-zinc-700 hover:bg-zinc-800">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  ) : <div />}

                  {step < totalSteps ? (
                    <Button type="button" onClick={nextStep} className="bg-blue-500 hover:bg-blue-600">
                      Continue <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:opacity-90 min-w-[140px]">
                      {isSubmitting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Registering...</>
                      ) : event.is_paid ? (
                        <><Lock className="w-4 h-4 mr-2" /> Register & Pay</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 mr-2" /> Complete Registration</>
                      )}
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
