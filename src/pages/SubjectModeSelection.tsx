import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Lock, ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SubjectModeSelection = () => {
  const { subjectId, subjectName } = useParams();
  const navigate = useNavigate();
  
  // Decode the URL-encoded subject name (e.g., "System%20Commands" -> "System Commands")
  const decodedSubject = decodeURIComponent(subjectName || 'Subject');

  // Fetch the Level Name (e.g., "Diploma") for this subject using the ID
  const { data: subjectData, isLoading } = useQuery({
    queryKey: ['subject_level_details', subjectId],
    queryFn: async () => {
      if (!subjectId) return null;
      
      const { data, error } = await supabase
        .from('iitm_subjects')
        .select(`
          id,
          name,
          iitm_levels (
            name
          )
        `)
        .eq('id', subjectId)
        .single();
      
      if (error) {
        console.error('Error fetching subject details:', error);
        return null;
      }
      return data;
    },
    enabled: !!subjectId
  });

  // Safely extract the level name from the joined data
  // @ts-ignore - Supabase types for joined tables can be tricky
  const levelName = subjectData?.iitm_levels?.name || '...';

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-5xl space-y-12">
        
        {/* Header Section */}
        <div className="text-center space-y-4 relative">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="absolute -top-12 left-0 md:top-0 md:left-8 text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          {/* Breadcrumb Pill */}
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-primary mb-4 animate-in fade-in slide-in-from-bottom-2">
            {isLoading ? 'Loading...' : `${levelName} > ${decodedSubject}`}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white font-neuropol drop-shadow-2xl">
            {decodedSubject}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your environment to proceed.
          </p>
        </div>

        {/* Selection Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mx-auto">
          
          {/* Option 1: Learning Environment */}
          <div 
            className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-primary/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(147,51,234,0.15)] flex flex-col cursor-pointer overflow-hidden"
            onClick={() => navigate(`/practice?iitm_subject=${subjectId}&name=${encodeURIComponent(decodedSubject)}`)}
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="relative z-10">
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-primary/20">
                <Code2 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">Learning Environment</h2>
              <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                Practice assignments specific to <strong>{decodedSubject}</strong>. Features instant grading, test cases, and unlimited attempts.
              </p>
              <Button 
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 pointer-events-none"
              >
                Enter Practice
              </Button>
            </div>
          </div>

          {/* Option 2: Exam Portal */}
          <div 
            className="group relative bg-[#0c0c0e] border border-white/10 rounded-3xl p-8 hover:border-red-500/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.15)] flex flex-col cursor-pointer overflow-hidden"
            onClick={() => navigate(`/exam?iitm_subject=${subjectId}&name=${encodeURIComponent(decodedSubject)}`)}
          >
            {/* Hover Gradient Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-red-500/20">
                <Lock className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-white group-hover:text-red-500 transition-colors">Exam Portal</h2>
              <p className="text-muted-foreground mb-8 flex-1 leading-relaxed">
                Strict proctored environment for <strong>{decodedSubject}</strong>. Includes full-screen enforcement and activity monitoring.
              </p>
              <Button 
                size="lg"
                variant="outline"
                className="w-full border-red-500/20 hover:bg-red-500/10 text-red-500 hover:text-red-400 pointer-events-none"
              >
                Enter Exam Hall
              </Button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SubjectModeSelection;
