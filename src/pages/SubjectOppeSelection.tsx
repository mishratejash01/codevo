import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// ... import other UI components as needed

export default function SubjectOppeSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Retrieve passed state (subject, mode)
  const { subjectId, subjectName, mode } = location.state || {};
  
  const [oppeList, setOppeList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId) {
      navigate("/");
      return;
    }

    const fetchOppeTypes = async () => {
      try {
        setLoading(true);
        let data: any[] | null = null;
        let error = null;

        if (mode === 'proctored') {
          // PROCTORED MODE: Fetch from 'iitm_exam_question_bank'
          const result = await supabase
            .from('iitm_exam_question_bank')
            .select('exam_type')
            .eq('subject_id', subjectId);
            
          data = result.data;
          error = result.error;
        } else {
          // PRACTICE MODE: Fetch from 'iitm_assignments' (existing logic)
          // Assuming 'assignment_type' or similar column exists for OPPEs in practice
          const result = await supabase
            .from('iitm_assignments')
            .select('assignment_type') // or whatever column holds 'OPPE 1', 'Week 1' etc
            .eq('subject_id', subjectId);
            
          data = result.data;
          error = result.error;
        }

        if (error) throw error;

        // Extract unique types
        if (data) {
            const types = mode === 'proctored' 
                ? data.map(item => item.exam_type).filter(Boolean)
                : data.map(item => item.assignment_type).filter(Boolean); // Adjust key for practice
            
            // Remove duplicates
            const uniqueTypes = Array.from(new Set(types)).sort();
            setOppeList(uniqueTypes);
            
            // DEBUG: Log to see what we found
            console.log("Fetched OPPEs:", uniqueTypes);
        }

      } catch (err: any) {
        toast({
          title: "Error fetching exams",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOppeTypes();
  }, [subjectId, mode, navigate, toast]);

  const handleSelect = (oppe: string) => {
    navigate("/question-set-selection", { 
      state: { subjectId, subjectName, mode, examType: oppe } 
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center">{subjectName} - Select Exam</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
           <div className="text-center col-span-2">Loading options...</div>
        ) : oppeList.length > 0 ? (
          oppeList.map((oppe) => (
            <Card 
              key={oppe} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleSelect(oppe)}
            >
              <CardHeader>
                <CardTitle className="text-center">{oppe}</CardTitle>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="text-center col-span-2 text-muted-foreground">
             No exams found for this subject.
          </div>
        )}
      </div>
    </div>
  );
}
