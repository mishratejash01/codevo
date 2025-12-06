import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function QuestionSetSelection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const { subjectId, subjectName, mode, examType } = location.state || {};

  const [sets, setSets] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId || !examType) {
      navigate("/");
      return;
    }

    const fetchSets = async () => {
      try {
        setLoading(true);
        let data: any[] | null = null;
        let error = null;

        if (mode === 'proctored') {
          // PROCTORED MODE: Fetch 'set_name' from 'iitm_exam_question_bank'
          // We filter by subject AND the selected exam_type (e.g. OPPE 2)
          const result = await supabase
            .from('iitm_exam_question_bank')
            .select('set_name')
            .eq('subject_id', subjectId)
            .eq('exam_type', examType);

          data = result.data;
          error = result.error;
        } else {
          // PRACTICE MODE: Fetch sets from 'iitm_assignments' (if applicable)
          // Adjust logic if practice doesn't have sets
          const result = await supabase
            .from('iitm_assignments')
            .select('set_name') 
            .eq('subject_id', subjectId)
            .eq('assignment_type', examType); // Assuming link between type and set

          data = result.data;
          error = result.error;
        }

        if (error) throw error;

        if (data) {
          // Extract unique sets
          const fetchedSets = data.map((item) => item.set_name).filter(Boolean);
          const uniqueSets = Array.from(new Set(fetchedSets)).sort();
          setSets(uniqueSets);
        }

      } catch (err: any) {
        toast({
          title: "Error fetching sets",
          description: err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [subjectId, examType, mode, navigate, toast]);

  const handleSelectSet = (setName: string) => {
    // Navigate to the actual Exam/Practice Arena
    // Note: Ensure the target route handles fetching questions based on these parameters
    navigate("/exam", { 
      state: { subjectId, subjectName, mode, examType, setName } 
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2 text-center">{examType}</h1>
      <p className="text-center text-muted-foreground mb-6">Select a Question Set</p>
      
      <div className="grid gap-4 md:grid-cols-3">
        {loading ? (
            <div className="col-span-3 text-center">Loading sets...</div>
        ) : sets.length > 0 ? (
          sets.map((set) => (
            <Card 
              key={set} 
              className="cursor-pointer hover:bg-accent transition-colors"
              onClick={() => handleSelectSet(set)}
            >
              <CardHeader>
                <CardTitle className="text-center">{set}</CardTitle>
              </CardHeader>
            </Card>
          ))
        ) : (
          <div className="col-span-3 text-center text-muted-foreground">
            No sets found. (Debug: Check if CSV data has 'set_name' populated)
          </div>
        )}
      </div>
    </div>
  );
}
