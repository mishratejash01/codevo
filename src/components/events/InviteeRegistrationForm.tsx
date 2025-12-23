import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Loader2, CheckCircle2, User, Briefcase, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Prefill email
      setFormData(prev => ({
        ...prev,
        email: session.user.email || ''
      }));

      // Try to get profile data
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
    }

    prefillUserData();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.mobile_number || 
        !formData.college_org_name || !formData.country_city || !formData.current_status) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        toast.error("Please log in to continue");
        setLoading(false);
        return;
      }

      // Determine status based on event payment settings
      const registrationStatus = isPaid ? 'pending_payment' : 'confirmed';
      const paymentStatus = isPaid ? 'pending' : 'not_required';

      // Create registration for the invitee
      const { error: regError } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: session.user.id,
          full_name: formData.full_name,
          email: formData.email,
          mobile_number: formData.mobile_number,
          college_org_name: formData.college_org_name,
          country_city: formData.country_city,
          current_status: formData.current_status,
          experience_level: formData.experience_level,
          github_link: formData.github_link || null,
          linkedin_link: formData.linkedin_link || null,
          participation_type: 'Team',
          team_name: invitation.team_name,
          team_role: invitation.role,
          invited_by_registration_id: invitation.registration_id,
          status: registrationStatus,
          payment_status: paymentStatus,
          agreed_to_rules: true,
          agreed_to_privacy: true,
        });

      if (regError) {
        console.error('Registration error:', regError);
        toast.error("Failed to complete registration");
        setLoading(false);
        return;
      }

      // Update invitation status to completed
      const { error: inviteError } = await supabase
        .from('team_invitations')
        .update({ 
          status: 'completed',
          responded_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      if (inviteError) {
        console.error('Invitation update error:', inviteError);
      }

      toast.success("You've successfully joined the team!");
      onComplete();

    } catch (err) {
      console.error('Error:', err);
      toast.error("Something went wrong");
    }

    setLoading(false);
  }

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/10 border border-purple-500/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-purple-500/10 border-b border-purple-500/20 p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <Users className="w-7 h-7 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Complete Your Registration</h3>
            <p className="text-sm text-purple-400">Join team "{invitation.team_name}"</p>
          </div>
        </div>
      </div>

      {/* Team Info */}
      <div className="p-6 border-b border-zinc-800">
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="border-purple-500/30 text-purple-400">
            <Users className="w-3 h-3 mr-1" /> Team Member
          </Badge>
          <Badge variant="outline" className="border-blue-500/30 text-blue-400">
            {invitation.role}
          </Badge>
        </div>
        <p className="text-sm text-zinc-400">
          Invited by <strong className="text-white">{invitation.inviter_name}</strong> to join {eventTitle}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Your full name"
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="your@email.com"
              className="bg-zinc-900 border-zinc-800"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mobile_number">Mobile Number *</Label>
            <Input
              id="mobile_number"
              value={formData.mobile_number}
              onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
              placeholder="+91 9876543210"
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="college_org_name">College/Organization *</Label>
            <Input
              id="college_org_name"
              value={formData.college_org_name}
              onChange={(e) => setFormData({ ...formData, college_org_name: e.target.value })}
              placeholder="Your institution"
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="country_city">City, Country *</Label>
            <Input
              id="country_city"
              value={formData.country_city}
              onChange={(e) => setFormData({ ...formData, country_city: e.target.value })}
              placeholder="Mumbai, India"
              className="bg-zinc-900 border-zinc-800"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_status">Current Status *</Label>
            <Select
              value={formData.current_status}
              onValueChange={(value) => setFormData({ ...formData, current_status: value })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Student">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" /> Student
                  </div>
                </SelectItem>
                <SelectItem value="Working Professional">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> Working Professional
                  </div>
                </SelectItem>
                <SelectItem value="Freelancer">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Freelancer
                  </div>
                </SelectItem>
                <SelectItem value="Founder">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Founder
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience_level">Experience Level</Label>
            <Select
              value={formData.experience_level}
              onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
            >
              <SelectTrigger className="bg-zinc-900 border-zinc-800">
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Beginner">Beginner</SelectItem>
                <SelectItem value="Intermediate">Intermediate</SelectItem>
                <SelectItem value="Advanced">Advanced</SelectItem>
                <SelectItem value="Expert">Expert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="github_link">GitHub Profile (Optional)</Label>
            <Input
              id="github_link"
              value={formData.github_link}
              onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
              placeholder="https://github.com/username"
              className="bg-zinc-900 border-zinc-800"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 font-bold h-12"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Complete Registration & Join Team
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
