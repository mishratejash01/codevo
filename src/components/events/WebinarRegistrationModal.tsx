import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader2, Check, ArrowRight, ArrowLeft, Globe, ExternalLink, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEventPayment } from '@/hooks/useEventPayment';

interface WebinarRegistrationModalProps {
  event: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WebinarRegistrationModal({ event, isOpen, onOpenChange }: WebinarRegistrationModalProps) {
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
    timezone: 'India (IST)',
    motivation_answer: '', // Mapped to "What topics interest you most?"
    questions_for_speaker: '',
    agreed_to_rules: false,
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
        .select('full_name, contact_no, institute_name, country')
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
    if (!formData.agreed_to_rules || !formData.agreed_to_privacy) {
      toast.error('Please accept the registration protocols to continue.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Authentication session lost');

      const registrationStatus = event.is_paid ? 'pending_payment' : 'confirmed';
      const paymentStatus = event.is_paid ? 'pending' : 'exempt';

      const { data: registration, error } = await supabase.from('webinar_registrations').insert({
        event_id: event.id,
        user_id: session.user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.mobile_number.trim(),
        college_org_name: formData.college_org_name.trim(),
        country_city: formData.country_city.trim(),
        current_status: formData.current_status,
        topics_of_interest: formData.motivation_answer.trim(),
        timezone: formData.timezone,
        questions_for_speaker: formData.questions_for_speaker.trim(),
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
      toast.error(err.code === '23505' ? "Entry already exists in manifest" : "Protocol failure during registration");
    } finally {
      setLoading(false);
    }
  }

  const Stepper = () => (
    <div className="relative flex justify-between w-full mt-10 px-2">
      <div className="absolute top-[15px] left-0 w-full h-[1px] bg-[#1a1a1a] z-0" />
      {[1, 2, 3].map((s) => (
        <div key={s} className="relative z-10 bg-[#0a0a0a] flex flex-col items-center">
          <div className={cn(
            "w-[30px] h-[30px] border flex items-center justify-center text-[0.6rem] transition-all duration-500 font-mono",
            step === s ? "border-[#ff8c00] text-[#ff8c00] shadow-[0_0_10px_rgba(255,140,0,0.2)]" : 
            step > s ? "border-[#00ff88] text-[#00ff88]" : "border-[#1a1a1a] text-[#777777]"
          )}>
            {step > s ? <Check size={12} /> : `0${s}`}
          </div>
          <span className={cn(
            "absolute top-[38px] text-[0.55rem] uppercase tracking-[2px] whitespace-nowrap",
            step === s ? "text-[#ff8c00]" : "text-[#777777]"
          )}>
            {s === 1 ? 'Identity' : s === 2 ? 'Interests' : 'Confirm'}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px] p-0 bg-transparent border-none outline-none overflow-hidden">
        <div className="w-full bg-[#050505] border border-[#1a1a1a] font-sans selection:bg-orange-500/30">
          
          {!isSuccess ? (
            <>
              {/* Header */}
              <header className="p-[40px] bg-[#0a0a0a] border-b border-[#1a1a1a]">
                <div className="flex justify-between items-start mb-[10px]">
                  <div>
                    <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-2">Digital Assembly</span>
                    <h2 className="font-serif text-[2rem] font-normal text-white leading-tight">Join the Webinar</h2>
                  </div>
                  <div className="w-[2px] h-[40px] bg-[#ff8c00]" />
                </div>
                <Stepper />
              </header>

              {/* Body */}
              <div className="p-[40px] min-h-[420px]">
                {prefilling ? (
                  <div className="h-full flex items-center justify-center py-20">
                    <Loader2 className="animate-spin h-8 w-8 text-[#ff8c00]" />
                  </div>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                    {/* STEP 1: IDENTITY */}
                    {step === 1 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px_20px]">
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Full Name</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777] transition-all"
                            value={formData.full_name}
                            onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                            placeholder="Your Name"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5 md:col-span-2">
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
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]"
                            value={formData.mobile_number}
                            onChange={(e) => setFormData({...formData, mobile_number: e.target.value})}
                            placeholder="+91 00000 00000"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">City, Country</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]"
                            value={formData.country_city}
                            onChange={(e) => setFormData({...formData, country_city: e.target.value})}
                            placeholder="e.g. London, UK"
                          />
                        </div>
                        <div className="flex flex-col gap-2.5 md:col-span-2">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Your Workplace or School</label>
                          <input 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none focus:border-[#777777]"
                            value={formData.college_org_name}
                            onChange={(e) => setFormData({...formData, college_org_name: e.target.value})}
                            placeholder="Name of institution"
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 2: INTERESTS */}
                    {step === 2 && (
                      <div className="flex flex-col gap-[30px]">
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold flex items-center gap-2">
                            <Globe size={12} /> Local Timezone
                          </label>
                          <select 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none"
                            value={formData.timezone}
                            onChange={(e) => setFormData({...formData, timezone: e.target.value})}
                          >
                            <option value="India (IST)" className="bg-black">India (IST)</option>
                            <option value="US East (EST)" className="bg-black">US East (EST)</option>
                            <option value="UK (GMT)" className="bg-black">UK (GMT)</option>
                            <option value="Singapore (SGT)" className="bg-black">Singapore (SGT)</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">What topics interest you most?</label>
                          <textarea 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none min-h-[80px] focus:border-[#777777] resize-none"
                            value={formData.motivation_answer}
                            onChange={(e) => setFormData({...formData, motivation_answer: e.target.value})}
                            placeholder="Tell us what you'd like to learn about..."
                          />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <label className="text-[0.65rem] uppercase tracking-[2px] text-[#777777] font-semibold">Any questions for the speaker?</label>
                          <textarea 
                            className="bg-transparent border border-[#1a1a1a] text-white p-[14px] text-[0.9rem] outline-none min-h-[80px] focus:border-[#777777] resize-none"
                            value={formData.questions_for_speaker}
                            onChange={(e) => setFormData({...formData, questions_for_speaker: e.target.value})}
                            placeholder="Optional: Ask something specific..."
                          />
                        </div>
                      </div>
                    )}

                    {/* STEP 3: CONFIRM */}
                    {step === 3 && (
                      <div className="flex flex-col gap-8">
                        <div className="bg-[#080808] border border-[#1a1a1a] p-8">
                          <span className="text-[0.6rem] uppercase tracking-[3px] text-[#777777] block mb-3 font-bold">Registration Summary</span>
                          <p className="text-[0.85rem] font-light leading-relaxed text-[#e0e0e0]">
                            You are registering for the 2025 Webinar. A joining link will be dispatched to your email address before the event begins.
                          </p>
                        </div>

                        <div className="flex flex-col gap-5">
                          <div className="flex items-start gap-3 cursor-pointer group" onClick={() => setFormData({...formData, agreed_to_rules: !formData.agreed_to_rules})}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 mt-0.5 accent-[#ff8c00] cursor-pointer"
                              checked={formData.agreed_to_rules}
                              readOnly
                            />
                            <span className="text-[0.7rem] text-white leading-relaxed">I agree to the webinar rules and code of conduct protocol.</span>
                          </div>
                          <div className="flex items-start gap-3 cursor-pointer group" onClick={() => setFormData({...formData, agreed_to_privacy: !formData.agreed_to_privacy})}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 mt-0.5 accent-[#ff8c00] cursor-pointer"
                              checked={formData.agreed_to_privacy}
                              readOnly
                            />
                            <span className="text-[0.7rem] text-white leading-relaxed">I agree to the privacy policy and data handling protocol.</span>
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
                      className="bg-transparent border border-[#1a1a1a] text-[#777777] px-[30px] py-[18px] text-[0.7rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:border-white hover:text-white flex items-center gap-2"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>
                  )}
                </div>
                <div>
                  {step < 3 ? (
                    <button 
                      onClick={handleNext}
                      className="bg-[#ff8c00] text-black border-none px-[30px] py-[18px] text-[0.7rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:bg-white flex items-center gap-2"
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleSubmit}
                      disabled={loading}
                      className="bg-[#ff8c00] text-black border-none px-[30px] py-[18px] text-[0.7rem] uppercase tracking-[3px] font-extrabold cursor-pointer transition-all hover:bg-white flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Complete Registration'}
                    </button>
                  )}
                </div>
              </footer>
            </>
          ) : (
            /* Success Screen */
            <div className="flex flex-col items-center justify-center p-[100px_40px] text-center min-h-[650px] animate-in zoom-in duration-500">
              <div className={cn("w-[60px] h-[60px] border rounded-full flex items-center justify-center text-2xl mb-[30px] shadow-[0_0_15px_rgba(0,255,136,0.1)]", event.is_paid ? "border-yellow-500 text-yellow-500" : "border-[#00ff88] text-[#00ff88]")}>
                <Check size={30} strokeWidth={3} />
              </div>
              <h2 className="font-serif text-[2.8rem] text-white mb-[10px]">{event.is_paid ? "Payment Required" : "See You There"}</h2>
              <p className="text-[#777777] uppercase tracking-[3px] text-[0.7rem] mb-[50px]">{event.is_paid ? "Registration Initiated" : "Registration Successful"}</p>
              
              <div className="w-full border border-[#1a1a1a] p-[30px] bg-[#0a0a0a] mb-[30px]">
                <p className="text-[0.85rem] font-light leading-relaxed text-[#e0e0e0]">
                  {event.is_paid ? 'Your presence is noted, but pending payment. Please complete the transaction.' : 'Your presence is confirmed in the mission manifest. Check your email for the invitation link and event details.'}
                </p>
              </div>
              
              {event.is_paid ? (
                <button 
                  className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-white flex items-center justify-center gap-2"
                  onClick={() => window.location.reload()}
                >
                  Complete Payment — {event.currency || 'INR'} {event.registration_fee} <ExternalLink size={14} />
                </button>
              ) : (
                <button 
                  onClick={() => onOpenChange(false)}
                  className="w-full bg-white text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-[#ff8c00]"
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
