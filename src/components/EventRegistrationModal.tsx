import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Validation Schema
const formSchema = z.object({
  full_name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Valid phone number required"),
  college: z.string().min(2, "College/Organization is required"),
  github_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

interface EventRegistrationModalProps {
  event: { id: string; title: string };
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventRegistrationModal({ event, isOpen, onOpenChange }: EventRegistrationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      full_name: "",
      email: "",
      phone: "",
      college: "",
      github_url: "",
      linkedin_url: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    // Get current user (if any)
    const { data: { session } } = await supabase.auth.getSession();

    const { error } = await supabase.from('event_registrations').insert({
      event_id: event.id,
      user_id: session?.user?.id,
      ...values,
    });

    setIsSubmitting(false);

    if (error) {
      if (error.code === '23505') { // Unique violation code
        toast.error("You are already registered for this event!");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
      return;
    }

    setIsSuccess(true);
    toast.success("Registration Successful!");
  }

  // Reset state when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setIsSuccess(false);
        form.reset();
      }, 300);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-[#0c0c0e] border border-white/10 text-white p-0 overflow-hidden gap-0">
        
        {/* Header with decorative background */}
        <div className="relative bg-[#151518] p-6 border-b border-white/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 blur-2xl rounded-full pointer-events-none" />
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white z-10">Event Registration</DialogTitle>
            <DialogDescription className="text-gray-400 z-10">
              {event.title}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8 text-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">You're In! 🚀</h3>
              <p className="text-gray-400 mb-6">
                Registration confirmed. Check your email for further details.
              </p>
              <Button onClick={() => handleOpenChange(false)} className="w-full bg-white text-black hover:bg-gray-200">
                Close
              </Button>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                
                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">Email</FormLabel>
                        <FormControl>
                          <Input placeholder="you@example.com" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="col-span-2 md:col-span-1">
                        <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+91 98765 43210" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="college"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">College / Organization</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. IIT Madras" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Social Links */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <FormField
                    control={form.control}
                    name="github_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">GitHub URL</FormLabel>
                        <FormControl>
                          <Input placeholder="github.com/username" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedin_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-gray-400 uppercase tracking-wider">LinkedIn URL</FormLabel>
                        <FormControl>
                          <Input placeholder="linkedin.com/in/user" className="bg-white/5 border-white/10 focus:border-purple-500/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold h-11">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
                      </>
                    ) : (
                      "Confirm Registration"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
