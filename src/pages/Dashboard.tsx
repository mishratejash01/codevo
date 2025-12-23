import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ProgressCards } from '@/components/dashboard/ProgressCards';
import { ActiveEvents } from '@/components/dashboard/ActiveEvents';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { SkillsCloud } from '@/components/dashboard/SkillsCloud';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { ActivityCalendar } from '@/components/practice/ActivityCalendar';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();

  // Check authentication
  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      navigate('/auth');
    }
  }, [session, sessionLoading, navigate]);

  const userId = session?.user?.id;

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['dashboard_profile', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch practice stats
  const { data: practiceStats } = useQuery({
    queryKey: ['dashboard_practice_stats', userId],
    queryFn: async () => {
      // Get all problems count by difficulty
      const { data: problems } = await supabase
        .from('practice_problems')
        .select('id, difficulty');
      
      // Get user's completed submissions
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('problem_id, status')
        .eq('user_id', userId!)
        .eq('status', 'completed');

      // Get unique solved problem IDs
      const solvedIds = new Set(submissions?.map(s => s.problem_id) || []);
      
      // Calculate stats by difficulty
      const difficulties = { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 } };
      
      problems?.forEach(p => {
        const diff = (p.difficulty?.toLowerCase() || 'easy') as keyof typeof difficulties;
        if (difficulties[diff]) {
          difficulties[diff].total++;
          if (solvedIds.has(p.id)) {
            difficulties[diff].solved++;
          }
        }
      });

      // Calculate acceptance rate
      const { data: allSubmissions } = await supabase
        .from('practice_submissions')
        .select('status')
        .eq('user_id', userId!);
      
      const total = allSubmissions?.length || 0;
      const accepted = allSubmissions?.filter(s => s.status === 'completed').length || 0;
      const acceptanceRate = total > 0 ? (accepted / total) * 100 : 0;

      return { ...difficulties, acceptanceRate, totalSolved: solvedIds.size, totalProblems: problems?.length || 0 };
    },
    enabled: !!userId,
  });

  // Fetch streak data
  const { data: streakData } = useQuery({
    queryKey: ['dashboard_streak', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('practice_streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId!)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  // Fetch exam stats
  const { data: examStats } = useQuery({
    queryKey: ['dashboard_exam_stats', userId],
    queryFn: async () => {
      const { data: sessions } = await supabase
        .from('iitm_exam_sessions')
        .select('total_score, subject_id, status')
        .eq('user_id', userId!)
        .eq('status', 'completed');

      if (!sessions || sessions.length === 0) {
        return { totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 };
      }

      const scores = sessions.map(s => s.total_score || 0);
      const subjects = new Set(sessions.map(s => s.subject_id));
      
      return {
        totalExams: sessions.length,
        averageScore: scores.reduce((a, b) => a + b, 0) / scores.length,
        bestScore: Math.max(...scores),
        subjectsAttempted: subjects.size,
      };
    },
    enabled: !!userId,
  });

  // Fetch registered events
  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard_events', userId],
    queryFn: async () => {
      const { data: registrations } = await supabase
        .from('event_registrations')
        .select('event_id, team_name, participation_type')
        .eq('user_id', userId!);

      if (!registrations || registrations.length === 0) return [];

      const eventIds = registrations.map(r => r.event_id);
      const { data: events } = await supabase
        .from('events')
        .select('id, title, slug, start_date, end_date, location, mode, image_url')
        .in('id', eventIds)
        .order('start_date', { ascending: true });

      return events?.map(event => {
        const reg = registrations.find(r => r.event_id === event.id);
        return { ...event, team_name: reg?.team_name, participation_type: reg?.participation_type };
      }) || [];
    },
    enabled: !!userId,
  });

  // Fetch recent submissions with problem info
  const { data: recentSubmissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['dashboard_submissions', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('id, problem_id, status, language, submitted_at, runtime_ms')
        .eq('user_id', userId!)
        .order('submitted_at', { ascending: false })
        .limit(15);

      if (!submissions || submissions.length === 0) return [];

      // Get problem details
      const problemIds = [...new Set(submissions.map(s => s.problem_id).filter(Boolean))];
      const { data: problems } = await supabase
        .from('practice_problems')
        .select('id, title, slug')
        .in('id', problemIds);

      const problemMap = new Map(problems?.map(p => [p.id, p]) || []);

      return submissions.map(s => ({
        ...s,
        problem_title: problemMap.get(s.problem_id)?.title,
        problem_slug: problemMap.get(s.problem_id)?.slug,
      }));
    },
    enabled: !!userId,
  });

  // Fetch skills from solved problems
  const { data: skills } = useQuery({
    queryKey: ['dashboard_skills', userId],
    queryFn: async () => {
      const { data: submissions } = await supabase
        .from('practice_submissions')
        .select('problem_id')
        .eq('user_id', userId!)
        .eq('status', 'completed');

      if (!submissions || submissions.length === 0) return [];

      const problemIds = [...new Set(submissions.map(s => s.problem_id).filter(Boolean))];
      const { data: problems } = await supabase
        .from('practice_problems')
        .select('tags')
        .in('id', problemIds);

      // Count tags
      const tagCounts: Record<string, number> = {};
      problems?.forEach(p => {
        p.tags?.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
    enabled: !!userId,
  });

  // Calculate submissions this month
  const { data: monthlySubmissions } = useQuery({
    queryKey: ['dashboard_monthly', userId],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('practice_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('submitted_at', startOfMonth.toISOString());

      return count || 0;
    },
    enabled: !!userId,
  });

  // Calculate total points (simple formula: easy=10, medium=20, hard=40)
  const totalPoints = practiceStats 
    ? (practiceStats.easy.solved * 10) + (practiceStats.medium.solved * 20) + (practiceStats.hard.solved * 40)
    : 0;

  // Get last problem slug for "Continue Practicing"
  const lastProblemSlug = recentSubmissions?.[0]?.problem_slug;

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background pt-32 pb-16 px-4">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background pt-32 pb-16 px-4">
      <motion.div 
        className="max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <DashboardHeader profile={profile} totalPoints={totalPoints} />
        </motion.div>

        {/* Stats Overview */}
        <motion.div variants={itemVariants}>
          <StatsOverview
            problemsSolved={practiceStats?.totalSolved || 0}
            totalProblems={practiceStats?.totalProblems || 0}
            currentStreak={streakData?.current_streak || 0}
            totalPoints={totalPoints}
            submissionsThisMonth={monthlySubmissions || 0}
          />
        </motion.div>

        {/* Activity Calendar */}
        <motion.div variants={itemVariants}>
          <ActivityCalendar userId={userId} />
        </motion.div>

        {/* Progress Cards */}
        <motion.div variants={itemVariants}>
          <ProgressCards
            practiceStats={practiceStats || { easy: { solved: 0, total: 0 }, medium: { solved: 0, total: 0 }, hard: { solved: 0, total: 0 }, acceptanceRate: 0 }}
            examStats={examStats || { totalExams: 0, averageScore: 0, bestScore: 0, subjectsAttempted: 0 }}
          />
        </motion.div>

        {/* Three Column Layout */}
        <motion.div variants={itemVariants} className="grid lg:grid-cols-3 gap-6">
          {/* Active Events */}
          <div className="lg:col-span-2">
            <ActiveEvents events={userEvents || []} isLoading={eventsLoading} />
          </div>

          {/* Quick Actions */}
          <div>
            <QuickActions lastProblemSlug={lastProblemSlug} />
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <motion.div variants={itemVariants} className="grid lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <RecentActivity submissions={recentSubmissions || []} isLoading={submissionsLoading} />

          {/* Skills Cloud */}
          <SkillsCloud skills={skills || []} />
        </motion.div>
      </motion.div>
    </div>
  );
}
