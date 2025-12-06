import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, GraduationCap } from 'lucide-react';

const SubjectOppeSelection = () => {
  const { subjectId, subjectName } = useParams();
  const navigate = useNavigate();
  const decodedSubject = decodeURIComponent(subjectName || 'Subject');

  const handleSelection = (type: string) => {
    // Navigate to Mode Selection, passing the exam type in the URL
    navigate(`/degree/mode/${subjectId}/${encodeURIComponent(decodedSubject)}/${encodeURIComponent(type)}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute bottom-0 right-0 w-full h-1/2 bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="z-10 w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4 relative">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/degree')}
            className="absolute -top-12 left-0 md:top-0 md:left-0 text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-neuropol">
            {decodedSubject}
          </h1>
          <p className="text-xl text-muted-foreground">
            Select your Exam Category
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 w-full mx-auto">
          {/* OPPE 1 Card */}
          <div 
            onClick={() => handleSelection('OPPE 1')}
            className="group relative bg-[#0c0c0e] border border-white/10 p-10 rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center text-center gap-4 hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">OPPE 1</h2>
              <p className="text-muted-foreground text-sm">Online Proctored Programming Exam 1</p>
            </div>
          </div>

          {/* OPPE 2 Card */}
          <div 
            onClick={() => handleSelection('OPPE 2')}
            className="group relative bg-[#0c0c0e] border border-white/10 p-10 rounded-3xl hover:border-purple-500/50 transition-all cursor-pointer flex flex-col items-center text-center gap-4 hover:-translate-y-1"
          >
            <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
              <GraduationCap className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">OPPE 2</h2>
              <p className="text-muted-foreground text-sm">Online Proctored Programming Exam 2</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectOppeSelection;
