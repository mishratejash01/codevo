import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Users, Loader2, CheckCircle2, User, Briefcase, GraduationCap, Sparkles, Github, Linkedin } from 'lucide-react';
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
    const code = error.code ? ` (${error.code})` : '';
    const details = error.details ? ` — ${error.details}` : '';
    return `${error.message || 'Request failed'}${code}${details}`;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (
      !formData.full_name ||
      !formData.email ||
      !formData.mobile_number ||
      !formData.college_org_name ||
      !formData.country_city ||
      !formData.current_status
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        toast.error('Please log in to continue');
        return;
      }

      // Fast-path: if registration already exists (by user_id), just mark invitation completed.
      const { data: existingReg, error: existingRegError } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (existingRegError) {
        console.error('[InviteeRegistrationForm] existing registration check failed:', existingRegError);
        // Continue anyway; we can still try insert.
      }

      const completeInvitation = async () => {
        const { error: inviteError } = await supabase
          .from('team_invitations')
          .update({
            status: 'completed',
            responded_at: new Date().toISOString(),
          })
          .eq('id', invitation.id);

        if (inviteError) {
          console.error('[InviteeRegistrationForm] invitation update error:', inviteError);
          toast.error(`Invitation update failed: ${formatSbError(inviteError)}`);
          return false;
        }

        return true;
      };

      if (existingReg?.id) {
        const ok = await completeInvitation();
        if (ok) {
          toast.success("You're already registered. Invitation marked as complete.");
          onComplete();
        }
        return;
      }

      // Determine status based on event payment settings
      const registrationStatus = isPaid ? 'pending_payment' : 'confirmed';
      const paymentStatus = isPaid ? 'pending' : 'not_required';

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
        status: registrationStatus,
        payment_status: paymentStatus,
        agreed_to_rules: true,
        agreed_to_privacy: true,
      });

      if (regError) {
        console.error('[InviteeRegistrationForm] registration insert error:', regError);

        // If the backend enforces uniqueness and this is a duplicate, treat it as already registered.
        if (regError.code === '23505') {
          const ok = await completeInvitation();
          if (ok) {
            toast.success("You're already registered. Invitation marked as complete.");
            onComplete();
          }
          return;
        }

        toast.error(`Registration failed: ${formatSbError(regError)}`);
        return;
      }

      const invitationOk = await completeInvitation();
      if (invitationOk) {
        toast.success("You've successfully joined the team!");
      }

      onComplete();
    } catch (err) {
      console.error('[InviteeRegistrationForm] unexpected error:', err);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (prefilling) {
    return (
      <Card className="border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-b from-card to-background overflow-hidden">
      {/* Header */}
      <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Complete Registration</h3>
            <p className="text-sm text-muted-foreground">
              Join team <span className="text-primary font-medium">"{invitation.team_name}"</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Team Info Badge */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
            <Users className="w-3 h-3 mr-1" /> Team Member
          </Badge>
          <Badge variant="outline" className="text-muted-foreground">
            Role: {invitation.role}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            Invited by {invitation.inviter_name}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Full Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Your full name"
                className="bg-background border-border focus:border-primary"
                required
              />
            </div>

            {/* Email (disabled) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                className="bg-muted border-border text-muted-foreground cursor-not-allowed"
                disabled
              />
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobile_number" className="text-sm font-medium">
                Mobile Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mobile_number"
                value={formData.mobile_number}
                onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value })}
                placeholder="+91 9876543210"
                className="bg-background border-border focus:border-primary"
                required
              />
            </div>

            {/* College */}
            <div className="space-y-2">
              <Label htmlFor="college_org_name" className="text-sm font-medium">
                College/Organization <span className="text-destructive">*</span>
              </Label>
              <Input
                id="college_org_name"
                value={formData.college_org_name}
                onChange={(e) => setFormData({ ...formData, college_org_name: e.target.value })}
                placeholder="Your institution"
                className="bg-background border-border focus:border-primary"
                required
              />
            </div>

            {/* City/Country */}
            <div className="space-y-2">
              <Label htmlFor="country_city" className="text-sm font-medium">
                City, Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="country_city"
                value={formData.country_city}
                onChange={(e) => setFormData({ ...formData, country_city: e.target.value })}
                placeholder="Mumbai, India"
                className="bg-background border-border focus:border-primary"
                required
              />
            </div>

            {/* Current Status */}
            <div className="space-y-2">
              <Label htmlFor="current_status" className="text-sm font-medium">
                Current Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.current_status}
                onValueChange={(value) => setFormData({ ...formData, current_status: value })}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Student">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-muted-foreground" /> Student
                    </div>
                  </SelectItem>
                  <SelectItem value="Working Professional">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" /> Working Professional
                    </div>
                  </SelectItem>
                  <SelectItem value="Freelancer">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" /> Freelancer
                    </div>
                  </SelectItem>
                  <SelectItem value="Founder">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-muted-foreground" /> Founder
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Level */}
            <div className="space-y-2">
              <Label htmlFor="experience_level" className="text-sm font-medium">
                Experience Level
              </Label>
              <Select
                value={formData.experience_level}
                onValueChange={(value) => setFormData({ ...formData, experience_level: value })}
              >
                <SelectTrigger className="bg-background border-border">
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

            {/* GitHub */}
            <div className="space-y-2">
              <Label htmlFor="github_link" className="text-sm font-medium flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5" /> GitHub <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="github_link"
                value={formData.github_link}
                onChange={(e) => setFormData({ ...formData, github_link: e.target.value })}
                placeholder="https://github.com/username"
                className="bg-background border-border focus:border-primary"
              />
            </div>

            {/* LinkedIn */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="linkedin_link" className="text-sm font-medium flex items-center gap-1.5">
                <Linkedin className="w-3.5 h-3.5" /> LinkedIn <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="linkedin_link"
                value={formData.linkedin_link}
                onChange={(e) => setFormData({ ...formData, linkedin_link: e.target.value })}
                placeholder="https://linkedin.com/in/username"
                className="bg-background border-border focus:border-primary"
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 font-semibold"
            size="lg"
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

          {/* Payment note if paid event */}
          {isPaid && registrationFee > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              After registration, you'll need to complete payment of {currency} {registrationFee}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
