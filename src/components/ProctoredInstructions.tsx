import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShieldAlert, AlertTriangle, Monitor, UserCheck, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProctoredInstructionsProps {
  onStart: () => void;
}

export const ProctoredInstructions = ({ onStart }: ProctoredInstructionsProps) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[#050505] text-white font-sans selection:bg-white/20">
      
      {/* Header - Formal & Minimal */}
      <div className="h-16 border-b border-white/10 flex items-center px-8 md:px-12 bg-[#0a0a0a] shrink-0">
        <h1 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          Examination Protocol
        </h1>
      </div>

      {/* Content - Full Width Document Style */}
      <ScrollArea className="flex-1 w-full">
        <div className="w-full px-8 md:px-16 py-12 space-y-12">
          
          {/* Intro */}
          <div className="space-y-6 border-b border-white/5 pb-10 max-w-6xl">
            <h2 className="text-3xl md:text-4xl font-light text-white tracking-tight">Instructions for Candidates</h2>
            <p className="text-gray-400 leading-relaxed text-justify max-w-4xl text-sm md:text-base">
              This assessment is conducted under strict proctoring protocols mandated by the examination authority. 
              The system utilizes advanced AI monitoring to verify identity and detect potential academic dishonesty. 
              Candidates are required to adhere strictly to the guidelines detailed below. 
              <span className="text-red-400 ml-1">Non-compliance will result in immediate disqualification.</span>
            </p>
          </div>

          {/* Grid Layout for Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-12 max-w-7xl">
            
            {/* Section 1 */}
            <div className="space-y-5">
              <h3 className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-widest border-b border-blue-500/20 pb-2 w-fit">
                <Monitor className="w-4 h-4" /> 1. System Environment
              </h3>
              <ul className="space-y-4 text-sm text-gray-300 list-disc pl-5 marker:text-gray-600 leading-relaxed">
                <li><strong className="text-white">Fullscreen Mode:</strong> The exam window must remain in fullscreen at all times. Exiting fullscreen or attempting to resize the window will be recorded as a violation.</li>
                <li><strong className="text-white">No Tab Switching:</strong> Navigating to other browser tabs, windows, or applications is strictly prohibited.</li>
                <li><strong className="text-white">Single Display:</strong> Secondary monitors must be disconnected before starting. Only the primary screen is allowed.</li>
                <li><strong className="text-white">Hardware Access:</strong> Microphone and Camera permissions must be granted and active throughout the entire session.</li>
              </ul>
            </div>

            {/* Section 2 */}
            <div className="space-y-5">
              <h3 className="flex items-center gap-2 text-purple-400 font-bold uppercase text-xs tracking-widest border-b border-purple-500/20 pb-2 w-fit">
                <UserCheck className="w-4 h-4" /> 2. Candidate Conduct
              </h3>
              <ul className="space-y-4 text-sm text-gray-300 list-disc pl-5 marker:text-gray-600 leading-relaxed">
                <li><strong className="text-white">Identity Verification:</strong> Ensure your face is clearly visible in the camera frame at all times. Do not cover your face or move out of frame.</li>
                <li><strong className="text-white">Alone in Room:</strong> No other person is permitted in the room during the examination. Detection of multiple faces will flag the session.</li>
                <li><strong className="text-white">Audio Integrity:</strong> The microphone will record ambient sound. Silence must be maintained. Talking to others is forbidden.</li>
                <li><strong className="text-white">Prohibited Devices:</strong> Use of mobile phones, smartwatches, calculators, or other electronic devices is prohibited.</li>
              </ul>
            </div>

            {/* Section 3 - Full Width Block */}
            <div className="lg:col-span-2 space-y-5 pt-6">
               <h3 className="flex items-center gap-2 text-red-400 font-bold uppercase text-xs tracking-widest border-b border-red-500/20 pb-2 w-fit">
                <AlertTriangle className="w-4 h-4" /> 3. Violation Policy & Termination
              </h3>
              <div className="bg-[#0f0f0f] border border-white/10 rounded-lg p-6 md:p-8 text-sm text-gray-400 leading-loose">
                <p>
                  Any attempt to bypass security measures, including but not limited to disabling the camera, muting the microphone, using virtual machines, or using screen sharing software, will trigger an automated security flag.
                </p>
                <p className="mt-4 text-white">
                  <strong>Three (3) confirmed violations</strong> (e.g., tab switching, face not visible, prohibited keys) will result in the <span className="text-red-500 font-bold underline decoration-red-500/50 underline-offset-4">automatic termination</span> of the exam session and submission of the current progress.
                </p>
              </div>
            </div>

          </div>
        </div>
      </ScrollArea>

      {/* Footer - Agreement */}
      <div className="border-t border-white/10 bg-[#0a0a0a] p-6 md:p-8 shrink-0">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 w-full max-w-7xl mx-auto px-4">
          
          <div className="flex items-center space-x-3 group cursor-pointer select-none" onClick={() => setAgreed(!agreed)}>
            <div className={cn("w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-all", agreed ? "bg-white border-white" : "border-white/30 group-hover:border-white/50")}>
                {agreed && <CheckCircle2 className="w-4 h-4 text-black" />}
            </div>
            <label className="text-sm text-gray-400 group-hover:text-white transition-colors cursor-pointer font-medium">
              I have read the instructions and agree to the terms of the assessment.
            </label>
          </div>

          <Button 
            size="lg" 
            onClick={onStart}
            disabled={!agreed}
            className={cn(
              "w-full md:w-auto px-10 py-6 font-bold text-sm uppercase tracking-widest transition-all rounded-none",
              agreed 
                ? "bg-white text-black hover:bg-gray-200" 
                : "bg-white/5 text-gray-600 cursor-not-allowed hover:bg-white/5"
            )}
          >
            Start Assessment
          </Button>

        </div>
      </div>
    </div>
  );
};
