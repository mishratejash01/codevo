import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, GraduationCap, Briefcase, User, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface InviteeRegistrationFormProps {
  eventId: string;
  eventTitle: string;
  isPaid?: boolean;
  registrationFee?: number;
  currency?: string;
  invitation: {
    id: string;
    team_name: string;
    inviter_name: string;
    role: string;
    registration_id: string | null;
  };
  onComplete: () => void;
}

export function InviteeRegistrationForm({ 
  eventId, 
  eventTitle,
  isPaid = false,
  registrationFee = 0,
  currency = 'INR',
  invitation,
  onComplete 
}: InviteeRegistrationFormProps) {
  const [loading, setLoading] = useState(false);
  const [prefilling, setPrefilling] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    college_org_name: '',
    country_city: '',
    current_status: '',
    experience_level: 'Beginner',
    github_link: '',
    linkedin_link: '',
  });

  useEffect(() => {
    async function prefillUserData() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setPrefilling(false);
          return;
        }

        setFormData(prev => ({ ...prev, email: session.user.email || '' }));

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, contact_no, institute_name, country, github_handle, linkedin_url, experience_level')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            full_name: profile.full_name || '',
            mobile_number: profile.contact_no || '',
            college_org_name: profile.institute_name || '',
            country_city: profile.country || '',
            github_link: profile.github_handle ? `https://github.com/${profile.github_handle}` : '',
            linkedin_link: profile.linkedin_url || '',
            experience_level: profile.experience_level || 'Beginner',
          }));
        }
      } catch (err) {
        console.error('Error prefilling data:', err);
      } finally {
        setPrefilling(false);
      }
    }
    prefillUserData();
  }, []);

  const formatSbError = (error: any) => {
    if (!error) return 'Unknown error';
    return error.message || 'Request failed';
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.mobile_number || !formData.college_org_name || !formData.country_city || !formData.current_status) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error('Please log in to continue');
        return;
      }

      // Check if team is already full before registration
      if (invitation.registration_id) {
        const { data: leaderReg } = await supabase
          .from('event_registrations')
          .select('id, team_name')
          .eq('id', invitation.registration_id)
          .single();

        if (leaderReg) {
          const { count } = await supabase
            .from('event_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('invited_by_registration_id', leaderReg.id);

          // Get event max team size
          const { data: eventData } = await supabase
            .from('events')
            .select('max_team_size')
            .eq('id', eventId)
            .single();

          const maxTeamSize = eventData?.max_team_size || 4;
          const currentCount = (count || 0) + 1; // +1 for leader

          if (currentCount >= maxTeamSize) {
            toast.error('Sorry, the team is already full. You cannot join at this time.');
            // Mark invitation as expired since team is full
            await supabase
              .from('team_invitations')
              .update({ status: 'expired', responded_at: new Date().toISOString() })
              .eq('id', invitation.id);
            onComplete();
            return;
          }
        }
      }

      const { data: existingReg } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      const completeInvitation = async () => {
        const { error: inviteError } = await supabase
          .from('team_invitations')
          .update({ status: 'completed', responded_at: new Date().toISOString() })
          .eq('id', invitation.id);
        return !inviteError;
      };

      if (existingReg?.id) {
        if (await completeInvitation()) {
          toast.success("Already registered. Invitation marked complete.");
          onComplete();
        }
        return;
      }

      const { error: regError } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        user_id: session.user.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile_number: formData.mobile_number.trim(),
        college_org_name: formData.college_org_name.trim(),
        country_city: formData.country_city.trim(),
        current_status: formData.current_status,
        experience_level: formData.experience_level,
        github_link: formData.github_link.trim() || null,
        linkedin_link: formData.linkedin_link.trim() || null,
        participation_type: 'Team',
        team_name: invitation.team_name,
        team_role: invitation.role,
        invited_by_registration_id: invitation.registration_id,
        status: isPaid ? 'pending_payment' : 'confirmed',
        payment_status: isPaid ? 'pending' : 'exempt',
        agreed_to_rules: true,
        agreed_to_privacy: true,
      });

      if (regError) {
        if (regError.code === '23505') {
          if (await completeInvitation()) {
            toast.success("Already registered. Invitation marked complete.");
            onComplete();
          }
          return;
        }
        toast.error(`Registration failed: ${formatSbError(regError)}`);
        return;
      }

      if (await completeInvitation()) toast.success("Successfully joined the team!");
      onComplete();
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (prefilling) {
    return (
      <div className="w-full max-w-[800px] mx-auto border border-[#1a1a1a] bg-[#050505] p-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff8c00]" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto border border-[#1a1a1a] bg-[#050505] font-sans selection:bg-orange-500/30">
      
      {/* 1. Header Section */}
      <header className="p-[40px] border-b border-[#1a1a1a] flex justify-between items-center">
        <div className="header-content">
          <p className="text-[0.7rem] text-[#666666] uppercase tracking-[2px] mb-1">Registration Protocol</p>
          <h2 className="font-serif text-[2.2rem] font-normal text-white">Complete Your Profile</h2>
        </div>
        <div className="w-[2px] h-[40px] bg-[#ff8c00]" />
      </header>

      {/* 2. Team Summary Bar */}
      <div className="bg-[#0a0a0a] p-[20px_40px] border-b border-[#1a1a1a] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[0.6rem] uppercase tracking-[2px] text-[#666666]">Team Name</span>
          <span className="text-[0.9rem] text-[#ff8c00] font-medium">{invitation.team_name}</span>
        </div>
        <div className="flex flex-col gap-1 md:text-center">
          <span className="text-[0.6rem] uppercase tracking-[2px] text-[#666666]">Your Role</span>
          <span className="text-[0.9rem] text-white font-medium">{invitation.role}</span>
        </div>
        <div className="flex flex-col gap-1 md:text-right">
          <span className="text-[0.6rem] uppercase tracking-[2px] text-[#666666]">Invited By</span>
          <span className="text-[0.9rem] text-white font-medium">{invitation.inviter_name}</span>
        </div>
      </div>

      {/* 3. Form Content */}
      <form onSubmit={handleSubmit} className="p-[40px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[30px_25px]">
          
          {/* Full Name */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
              required
            />
          </div>

          {/* Email (Disabled) */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Email Address</label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="bg-white/[0.02] border border-[#1a1a1a] text-[#666666] p-[15px] text-[0.95rem] cursor-not-allowed break-all"
            />
          </div>

          {/* Mobile Number */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Phone Number</label>
            <input
              type="text"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="+91 00000 00000"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
              required
            />
          </div>

          {/* College/Org */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">College or Company</label>
            <input
              type="text"
              value={formData.college_org_name}
              onChange={(e) => setFormData({ ...formData, college_org_name: e.target.value })}
              placeholder="Where you study or work"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
              required
            />
          </div>

          {/* Current Status */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Current Status</label>
            <select
              value={formData.current_status}
              onChange={(e) => setFormData({ ...formData, current_status: e.target.value })}
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] appearance-none"
              required
            >
              <option value="" disabled className="bg-[#050505]">Please select</option>
              <option value="Student" className="bg-[#050505]">Student</option>
              <option value="Working Professional" className="bg-[#050505]">Working Professional</option>
              <option value="Freelancer" className="bg-[#050505]">Freelancer</option>
              <option value="Founder" className="bg-[#050505]">Founder</option>
            </select>
          </div>

          {/* Experience Level */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Experience Level</label>
            <select
              value={formData.experience_level}
              onChange={(e) => setFormData({ ...formData, experience_level: e.target.value })}
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] appearance-none"
            >
              <option value="Beginner" className="bg-[#050505]">Beginner</option>
              <option value="Intermediate" className="bg-[#050505]">Intermediate</option>
              <option value="Advanced" className="bg-[#050505]">Advanced</option>
              <option value="Expert" className="bg-[#050505]">Expert</option>
            </select>
          </div>

          {/* GitHub */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">GitHub Link (Optional)</label>
            <input
              type="url"
              value={formData.github_link}
              onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
              placeholder="https://github.com/username"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
            />
          </div>

          {/* LinkedIn */}
          <div className="flex flex-col gap-3">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">LinkedIn Link (Optional)</label>
            <input
              type="url"
              value={formData.linkedin_link}
              onChange={(e) => setFormData({ ...formData, linkedin_link: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
            />
          </div>

          {/* City/Country */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <label className="text-[0.65rem] uppercase tracking-[3px] text-[#666666] font-semibold">Where are you from? (City, Country)</label>
            <input
              type="text"
              value={formData.country_city}
              onChange={(e) => setFormData({ ...formData, country_city: e.target.value })}
              placeholder="e.g. Mumbai, India"
              className="bg-transparent border border-[#1a1a1a] text-white p-[15px] text-[0.95rem] outline-none focus:border-[#666666] transition-all"
              required
            />
          </div>
        </div>

        {/* Final Action */}
        <div className="mt-[60px]">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ff8c00] text-black border-none p-[22px] text-[0.8rem] font-extrabold uppercase tracking-[4px] cursor-pointer transition-all hover:bg-white disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : 'Register and Join Team'}
          </button>
          
          {isPaid && registrationFee > 0 && (
            <p className="text-center text-[0.65rem] text-[#666666] uppercase tracking-[2px] mt-[20px]">
              A registration fee of {currency} {registrationFee} is required to finish
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
