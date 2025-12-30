import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Check, ExternalLink, ArrowRight, ArrowLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEventPayment } from '@/hooks/useEventPayment';

interface MeetupRegistrationModalProps {
  event: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MeetupRegistrationModal({ event, isOpen, onOpenChange }: MeetupRegistrationModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const { processPayment, isProcessing: isPaymentProcessing } = useEventPayment();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    college_org_name: '',
    country_city: '',
    current_status: 'Student',
    motivation_answer: '', // Mapped to "What are you looking to connect about?"
    dietary: 'No Restrictions',
    bringing_guest: false,
    agreed_to_terms: false,
    agreed_to_privacy: false,
  });

  useEffect(() => {
    if (isOpen) {
      prefillUserData();
      setStep(1);
      setIsSuccess(false);
      setRegistrationId(null);
    }
  }, [isOpen]);

  async function prefillUserData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setFormData(prev => ({ ...prev, email: session.user.email || '' }));

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, contact_no, institute_name, country, experience_level')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          full_name: profile.full_name || '',
          mobile_number: profile.contact_no || '',
          college_org_name: profile.institute_name || '',
          country_city: profile.country || '',
        }));
      }
    } catch (err) {
      console.error('Prefill Error:', err);
    } finally {
      setPrefilling(false);
    }
  }

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  async function handleSubmit() {
    if (!formData.agreed_to_terms || !formData.agreed_to_privacy) {
      toast.error('Please accept all protocols to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('No session');

      const registrationStatus = event.is_paid ? 'pending_payment' : 'confirmed';
      const paymentStatus = event.is_paid ? 'pending' : 'exempt';

      const { data: registration, error } = await supabase.from('meetup_registrations').insert({
        event_id: event.id,
        user_id: session.user.id,
        full_name: formData.full_name,
        email: formData.email,
        mobile_number: formData.mobile_number,
        college_org_name: formData.college_org_name,
        country_city: formData.country_city,
        current_status: formData.current_status,
        connection_interests: formData.motivation_answer,
        dietary_preference: formData.dietary,
        bringing_guest: formData.bringing_guest,
        status: registrationStatus,
        payment_status: paymentStatus,
        agreed_to_rules: true,
        agreed_to_privacy: true,
      }).select().single();

      if (error) throw error;

      // If paid event, initiate payment immediately
      if (event.is_paid && event.registration_fee > 0) {
        setRegistrationId(registration.id);
        const paymentSuccess = await processPayment({
          eventId: event.id,
          eventTitle: event.title,
          registrationId: registration.id,
          amount: event.registration_fee,
          currency: event.currency || 'INR',
          userEmail: formData.email,
          userName: formData.full_name,
          userMobile: formData.mobile_number,
        });

        if (paymentSuccess) {
          setIsSuccess(true);
        } else {
          toast.info("Registration saved. Complete payment to confirm your spot.");
          setIsSuccess(true);
        }
      } else {
        setIsSuccess(true);
        toast.success("Registration successful!");
      }
    } catch (err: any) {
      toast.error(err.message || 'System error during registration');
    } finally {
      setLoading(false);
    }
  }

  const Stepper = () => (
    <div className="relative flex justify-between w-full mt-10">
      <div className="absolute top-[15px] left-0 w-full h-[1px] bg-[#1a1a1a] z-0" />
      {[1, 2, 3].map((s) => (
        <div key={s} className="relative z-10 bg-[#050505] flex flex-col items-center">
          <div className={cn(
            "w-[30px] h-[30px] border flex items-center justify-center text-[0.65rem] transition-all duration-500",
            step === s ? "border-[#ff8c00] text-[#ff8c00] shadow-[0_0_10px_rgba(255,140,0,0.2)]" : "border-[#1a1a1a] text-[#777777]"
          )}>
            {s < step ? <Check size={12} /> : `0${s}`}
          </div>
          <span className={cn(
            "absolute top-[40px] text-[0.55rem] uppercase tracking-[2px] whitespace-nowrap",
            step === s ? "text-[#ff8c00]" : "text-[#777777]"
          )}>
            {s === 1 ? 'Identity' : s === 2 ? 'Details' : 'Confirm'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 bg-transparent border-none outline-none">
        <div className="w-full bg-[#050505] border border-[#1a1a1a] overflow-hidden font-sans selection:bg-orange-500/30">
          
          {!isSuccess ? (
            <>
              {/* Header */}
              <header className="p-[40px] bg-[#0a0a0a] border-b border-[#1a1a1a]">
                <div className="flex justify-between items-start mb-[10px]">
                  <div>
                    <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-2">Meetup Protocol</span>
                    <h2 className="font-serif text-[2rem] font-normal text-white leading-tight">Register Your Presence</h2>
                  </div>
                  <div className="w-[2px] h-[40px] bg-[#ff8c00]" />
                </div>
                <Stepper />
              </header>

              {/* Form Body */}
              <div className="p-[40px] min-h-[400px]">
                {prefilling ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-[#ff8c00]" />
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {step === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px]">
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Full Name</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777] transition-all"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Email Address</label>
                          <input 
                            className="bg-[#0a0a0a] border border-[#1a1a1a] text-[#777777] p-[14px] text-[0.9rem] cursor-not-allowed"
                            value={formData.email}
                            disabled
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Phone Number</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777] transition-all"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                            placeholder="+91 00000 00000"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">City, Country</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777] transition-all"
                            value={formData.country_city}
                            onChange={(e) => setFormData({...formData, country_city: e.target.value})}
                            placeholder="e.g. Mumbai, India"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Current Status</label>
                          <select 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none"
                            value={formData.current_status}
                            onChange={(e) => setFormData({...formData, current_status: e.target.value})}
                          >
                            <option value="Student" className="bg-black">Student</option>
                            <option value="Working Professional" className="bg-black">Working Professional</option>
                            <option value="Freelancer" className="bg-black">Freelancer</option>
                            <option value="Founder" className="bg-black">Founder</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="flex flex-col gap-8">
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Connection Interests</label>
                          <textarea 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777] transition-all resize-none h-[120px]"
                            value={formData.motivation_answer}
                            onChange={(e) => setFormData({...formData, motivation_answer: e.target.value})}
                            placeholder="Share what kind of people you'd like to meet..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[25px]">
                          <div className="flex flex-col gap-2.5">
                            <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Dietary Provision</label>
                            <select 
                              className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none"
                              value={formData.dietary}
                              onChange={(e) => setFormData({...formData, dietary: e.target.value})}
                            >
                              <option className="bg-black">No Restrictions</option>
                              <option className="bg-black">Vegetarian</option>
                              <option className="bg-black">Vegan</option>
                              <option className="bg-black">Gluten Free</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-3 h-full pt-6">
                            <input 
                              type="checkbox" 
                              id="guest"
                              className="w-4 h-4 accent-[#ff8c00] cursor-pointer"
                              checked={formData.bringing_guest}
                              onChange={(e) => setFormData({...formData, bringing_guest: e.target.checked})}
                            />
                            <label htmlFor="guest" className="text-[0.75rem] text-white cursor-pointer select-none">I'm bringing a guest (+1)</label>
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="flex flex-col gap-8">
                        <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-[30px]">
                          <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-3 font-bold">Data Summary</span>
                          <p className="text-[0.8rem] text-[#777777] leading-relaxed">
                            By completing this registration, you will be added to the attendee manifest for the assembly. 
                            {event.is_paid && (
                              <> Final verification requires a fee of <strong className="text-white">{event.currency || 'INR'} {event.registration_fee}</strong>.</>
                            )}
                          </p>
                        </div>
                        <div className="flex flex-col gap-5">
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              id="terms" 
                              className="w-4 h-4 mt-1 accent-[#ff8c00] cursor-pointer"
                              checked={formData.agreed_to_terms}
                              onChange={(e) => setFormData({...formData, agreed_to_terms: e.target.checked})}
                            />
                            <label htmlFor="terms" className="text-[0.75rem] text-white leading-relaxed cursor-pointer">I agree to the meetup terms and code of conduct protocol</label>
                          </div>
                          <div className="flex items-start gap-3">
                            <input 
                              type="checkbox" 
                              id="privacy" 
                              className="w-4 h-4 mt-1 accent-[#ff8c00] cursor-pointer"
                              checked={formData.agreed_to_privacy}
                              onChange={(e) => setFormData({...formData, agreed_to_privacy: e.target.checked})}
                            />
                            <label htmlFor="privacy" className="text-[0.75rem] text-white leading-relaxed cursor-pointer">I agree to the privacy policy and secure data handling</label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Navigation Footer */}
              <footer className="p-[30px_40px] bg-[#0a0a0a] border-t border-[#1a1a1a] flex justify-between items-center">
                <div>
                  {step > 1 && (
                    <button 
                      onClick={handleBack}
                      className="bg-transparent border border-[#1a1a1a] text-[#777777] px-[30px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:border-white hover:text-white flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </div>
                <div>
                  {step < 3 ? (
                    <button 
                      onClick={handleNext}
                      className="bg-[#ff8c00] text-black border-none px-[30px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:bg-white flex items-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-[#ff8c00] text-black border-none px-[30px] py-[18px] text-[0.75rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:bg-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin h-4 w-4" /> : (
                        <>{event.is_paid ? 'Register & Pay' : 'Finalize Registration'} <Check size={14} /></>
                      )}
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            /* Success Screen */
            <div className="flex flex-col items-center justify-center p-[80px_40px] text-center min-h-[600px] animate-in zoom-in-95 duration-500">
              <div className={cn("w-[60px] h-[60px] border rounded-full flex items-center justify-center text-2xl mb-[30px]", event.is_paid ? "border-yellow-500 text-yellow-500" : "border-[#00ff88] text-[#00ff88]")}>
                <Check size={30} strokeWidth={3} />
              </div>
              <h2 className="font-serif text-[2.5rem] text-white mb-[15px]">{event.is_paid ? "Payment Required" : "See You There"}</h2>
              <p className="text-[#777777] uppercase tracking-[2px] text-[0.7rem] mb-[40px]">{event.is_paid ? "Registration Pending Payment" : "Registration Logged Successfully"}</p>
              
              <div className="w-full border border-[#1a1a1a] p-[30px] bg-[#0a0a0a] mb-[30px]">
                <p className="text-[0.85rem] text-[#e0e0e0] leading-relaxed">
                  Your slot is reserved in the attendee manifest. {event.is_paid ? 'Complete the payment to finalize your presence.' : 'A confirmation protocol has been sent to your email.'}
                </p>
              </div>
              
              {event.is_paid ? (
                <button 
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-white flex items-center justify-center gap-2"
                  onClick={() => window.location.reload()} // Simplified for payment routing
                >
                  Complete Payment — {event.currency || 'INR'} {event.registration_fee} <ExternalLink size={14} />
                </button>
              ) : (
                <button 
                  className="w-full bg-white text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-[#ff8c00]"
                  onClick={() => onOpenChange(false)}
                >
                  Return to Briefing
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
