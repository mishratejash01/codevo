import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ExamQuestion, ExamState, TestCase } from "@/types/exam";
import { useNavigate } from "react-router-dom";

export const useProctoredExam = (examType: string, subjectId: string) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [examState, setExamState] = useState<ExamState>({
    currentQuestionIndex: 0,
    answers: {},
    results: {},
    isSubmitting: false,
    timeLeft: 0,
    sessionId: null,
  });

  // Fetch Questions
  useEffect(() => {
    const fetchExamData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Questions for this specific Exam Type and Subject
        const { data: questionsData, error: questionsError } = await supabase
          .from("iitm_exams_questions")
          .select("*")
          .eq("exam_type", examType)
          .eq("subject_id", subjectId);

        if (questionsError) throw questionsError;

        if (!questionsData || questionsData.length === 0) {
            toast({
                title: "No Exam Found",
                description: "No questions found for this exam type.",
                variant: "destructive",
            });
            setLoading(false);
            return;
        }

        // Parse test cases from JSON
        const parsedQuestions: ExamQuestion[] = questionsData.map((q) => ({
          ...q,
          test_cases: typeof q.test_cases_config === 'string' 
            ? JSON.parse(q.test_cases_config) 
            : (q.test_cases_config as unknown as TestCase[]) || [],
        }));

        setQuestions(parsedQuestions);
        
        // Set initial time based on the first question's expected time or a global setting
        // Assuming expected_time is per question, or you sum them up
        const totalTime = parsedQuestions.reduce((acc, q) => acc + (q.expected_time || 0), 0) * 60;
        setExamState(prev => ({ ...prev, timeLeft: totalTime || 3600 })); // Default 1 hour if 0

      } catch (error: any) {
        console.error("Error fetching exam:", error);
        toast({
          title: "Error",
          description: "Failed to load exam questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (examType && subjectId) {
      fetchExamData();
    }
  }, [examType, subjectId, toast]);

  // Start Exam Session
  const startExam = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Check if session already exists
      const { data: existingSession } = await supabase
        .from("iitm_exam_sessions")
        .select("id, status")
        .eq("user_id", user.id)
        .eq("exam_type", examType)
        .eq("subject_id", subjectId)
        .maybeSingle();

      if (existingSession) {
         if (existingSession.status === 'completed') {
             toast({ title: "Exam Completed", description: "You have already completed this exam." });
             navigate("/dashboard"); 
             return;
         }
         // Resume session
         setExamState(prev => ({ ...prev, sessionId: existingSession.id }));
         return;
      }

      // Create new session
      const { data: session, error } = await supabase
        .from("iitm_exam_sessions")
        .insert({
          user_id: user.id,
          subject_id: subjectId,
          exam_type: examType,
          status: "in_progress",
          start_time: new Date().toISOString(),
          violation_count: 0,
          total_score: 0,
          questions_attempted: 0,
          questions_correct: 0
        })
        .select()
        .single();

      if (error) throw error;
      setExamState(prev => ({ ...prev, sessionId: session.id }));

    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Could not start exam session.",
        variant: "destructive",
      });
    }
  }, [examType, subjectId, navigate, toast]);

  // Submit Question / Exam
  const submitExam = async () => {
    if (!examState.sessionId) return;

    setExamState(prev => ({ ...prev, isSubmitting: true }));

    try {
      let totalScore = 0;
      let correctCount = 0;
      let attemptedCount = Object.keys(examState.answers).length;

      // Simple scoring logic: You might want to move this to an Edge Function for security
      questions.forEach(q => {
          // In a real app, validate answers against private test cases backend-side
          // For now, we assume if they passed the public check in frontend (mock) or if we just save status
          const result = examState.results[q.id];
          if (result?.passed) {
              totalScore += q.max_score;
              correctCount++;
          }
      });

      const { error } = await supabase
        .from("iitm_exam_sessions")
        .update({
          status: "completed",
          end_time: new Date().toISOString(),
          total_score: totalScore,
          questions_attempted: attemptedCount,
          questions_correct: correctCount,
        })
        .eq("id", examState.sessionId);

      if (error) throw error;

      toast({
        title: "Exam Submitted",
        description: `Your score: ${totalScore}`,
      });
      
      navigate("/dashboard"); // Or results page

    } catch (error) {
      console.error("Error submitting exam:", error);
      toast({
        title: "Error",
        description: "Failed to submit exam.",
        variant: "destructive",
      });
    } finally {
      setExamState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleAnswerChange = (code: string) => {
    const currentQ = questions[examState.currentQuestionIndex];
    if (!currentQ) return;
    
    setExamState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [currentQ.id]: code },
    }));
  };

  // Mock run code (Replace with your actual Python runner logic)
  const runCode = async (code: string) => {
      // Use your useCodeRunner logic here or trigger it
      // For now, this just updates the result state to simulate a pass for demo
      const currentQ = questions[examState.currentQuestionIndex];
      // Logic to actually run against test_cases would go here
      
      // Update result mock
      setExamState(prev => ({
          ...prev,
          results: {
              ...prev.results,
              [currentQ.id]: { passed: true, score: currentQ.max_score }
          }
      }));
      return { success: true, output: "Passed" };
  };

  return {
    loading,
    questions,
    examState,
    setExamState,
    startExam,
    submitExam,
    handleAnswerChange,
    runCode
  };
};
