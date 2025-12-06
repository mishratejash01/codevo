import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ShieldCheck, Laptop } from 'lucide-react';

const SubjectModeSelection = () => {
  // 1. Capture the examType from the URL
  const { subjectId, subjectName, examType } = useParams();
  const navigate = useNavigate();
  
  const decodedSubject = decodeURIComponent(subjectName || '');
  // Default to OPPE 1 if undefined, but it should come from the URL
  const currentExamType = decodeURIComponent(examType || 'OPPE 1'); 

  const handleModeSelection = (mode: 'proctored' | 'practice') => {
    // 2. Pass the captured 'examType' forward to the next screen
    navigate(`/degree/questions/${subjectId}/${encodeURIComponent(decodedSubject)}/${encodeURIComponent(currentExamType)}/${mode}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#09090b] to-[#09090b] pointer-events-none" />

      <div className="z-10 w-full max-w-4xl space-y-12">
        <div className="text-center space-y-4 relative">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="absolute -top-12 left-0 md:top-0 md:left-0 text-muted-foreground hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white font-neuropol">
            {currentExamType} Mode
          </h1>
          <p className="text-xl text-muted-foreground">
            Choose your environment for {decodedSubject}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 w-full max-w-2xl mx-auto">
          {/* Proctored Card */}
          <div 
            onClick={() => handleModeSelection('proctored')}
            className="group relative bg-[#0c0c0e] border border-red-500/20 p-8 rounded-3xl hover:border-red-500/60 transition-all cursor-pointer flex flex-col items-center text-center gap-6 hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Proctored Mode</h2>
              <p className="text-muted-foreground text-sm">
                Strict environment. Timer fixed. Fullscreen required. <br/>
                <span className="text-red-400 font-medium mt-2 block">New Question Bank</span>
              </p>
            </div>
          </div>

          {/* Practice Card */}
          <div 
            onClick={() => handleModeSelection('practice')}
            className="group relative bg-[#0c0c0e] border border-blue-500/20 p-8 rounded-3xl hover:border-blue-500/60 transition-all cursor-pointer flex flex-col items-center text-center gap-6 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
              <Laptop className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Practice Mode</h2>
              <p className="text-muted-foreground text-sm">
                Self-paced learning. Flexible timer. Hints available. <br/>
                <span className="text-blue-400 font-medium mt-2 block">Standard Question Bank</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectModeSelection;
