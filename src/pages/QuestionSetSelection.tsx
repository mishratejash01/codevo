import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, FileCode2, Clock, Layers, Play, BookOpen, Lock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const QuestionSetSelection = () => {
  const { subjectId, subjectName, examType, mode } = useParams();
  const navigate = useNavigate();
  const isProctored = mode === 'proctored';

  const [configOpen, setConfigOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState([10]);
  const [maxAvailable, setMaxAvailable] = useState(0);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['iitm_sets_or_topics', subjectId, examType, mode],
    queryFn: async () => {
      let query = supabase
        .from('iitm_assignments')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('exam_type', decodeURIComponent(examType || ''));

      const { data, error } = await query;
      if (error) throw error;

      if (isProctored) {
        const sets = new Map();
        data?.forEach(q => {
          if (q.set_name && !sets.has(q.set_name)) {
            const qsInSet = data.filter(i => i.set_name === q.set_name);
            sets.set(q.set_name, {
              id: q.set_name, 
              title: q.set_name,
              description: `Complete exam paper containing ${qsInSet.length} questions.`,
              question_count: qsInSet.length,
              total_time: qsInSet.reduce((acc, curr) => acc + (curr.expected_time || 0), 0)
            });
          }
        });
        return Array.from(sets.values());
      } else {
        const topics = new Map();
        data?.forEach(q => {
          const cat = q.category || 'General Practice';
          if (!topics.has(cat)) {
            topics.set(cat, {
              id: cat,
              title: cat,
              description: `Practice questions focused on ${cat}.`,
              available_count: data.filter(i => (i.category || 'General Practice') === cat).length
            });
          }
        });
        return Array.from(topics.values());
      }
    }
  });

  const handleCardClick = (item: any) => {
    if (isProctored) {
      const params = new URLSearchParams({
        iitm_subject: subjectId || '',
        name: subjectName || '',
        type: examType || '',
        set_name: item.id
      });
      navigate(`/exam?${params.toString()}`);
    } else {
      // Learning Mode Configuration
      setSelectedTopic(item.id);
      const max = item.available_count || 0;
      setMaxAvailable(max);
      
      // Smart Default: If max available is less than 10, default to max. Otherwise 10.
      const initialCount = Math.min(10, max);
      setQuestionCount([initialCount > 0 ? initialCount : 1]);
      
      setConfigOpen(true);
    }
  };

  const startPractice = () => {
    if (!selectedTopic) return;
    
    // Safety clamp: Ensure we never request more than available
    const finalCount = Math.min(questionCount[0], maxAvailable);
    
    const params = new URLSearchParams({
      iitm_subject: subjectId || '',
      name: subjectName || '',
      type: examType || '',
      category: selectedTopic,
      limit: finalCount.toString()
    });
    navigate(`/practice?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white p-6 relative overflow-hidden">
      <div className={cn("absolute top-0 right-0 w-[500px] h-[500px] blur-[120px] pointer-events-none opacity-20", isProctored ? "bg-red-600" : "bg-blue-600")} />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-12 space-y-4">
          <Button variant="ghost" onClick={() => navigate('/degree')} className="text-muted-foreground hover:text-white pl-0">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("px-3 py-1 text-sm border-white/10", isProctored ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400")}>
              {isProctored ? "Proctored" : "Learning"}
            </Badge>
            <Badge variant="outline" className="px-3 py-1 text-sm border-white/10 bg-white/5 text-muted-foreground">
              {decodeURIComponent(examType || '')}
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-neuropol tracking-wide">
            Select {isProctored ? "Paper Set" : "Topic"}
          </h1>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map(i => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"/>)}</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any) => (
              <Card 
                key={item.id}
                className={cn(
                  "bg-[#0c0c0e] border-white/10 transition-all duration-300 group cursor-pointer overflow-hidden relative hover:-translate-y-1 hover:shadow-2xl",
                  isProctored ? "hover:border-red-500/30" : "hover:border-blue-500/30"
                )}
                onClick={() => handleCardClick(item)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center border border-white/10", isProctored ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400")}>
                      {isProctored ? <FileCode2 className="w-5 h-5"/> : <BookOpen className="w-5 h-5"/>}
                    </div>
                    {isProctored && <Lock className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <CardTitle className="text-xl text-white group-hover:text-white/90">{item.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{item.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-between items-center text-xs text-muted-foreground border-t border-white/5 pt-4 mt-2">
                  <div className="flex items-center gap-3">
                    {isProctored ? <><span className="flex items-center gap-1"><Clock className="w-3 h-3"/> {item.total_time}m</span><span className="flex items-center gap-1"><Layers className="w-3 h-3"/> {item.question_count} Qs</span></> : <span className="flex items-center gap-1"><Layers className="w-3 h-3"/> {item.available_count} Available</span>}
                  </div>
                  <div className={cn("flex items-center gap-1 font-medium transition-colors", isProctored ? "group-hover:text-red-400" : "group-hover:text-blue-400")}>
                    {isProctored ? "Start" : "Configure"} <Play className="w-3 h-3 ml-0.5" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogContent className="bg-[#0c0c0e] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Practice</DialogTitle>
            <DialogDescription>Topic: <span className="text-blue-400">{selectedTopic}</span></DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-6">
            <div className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
              <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-white">Question Availability</p>
                <p className="text-xs text-muted-foreground">Only <span className="text-blue-400 font-bold">{maxAvailable}</span> questions are currently available for this topic.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Select Quantity</span><span className="font-mono font-bold text-white">{questionCount[0]}</span></div>
              <Slider 
                value={questionCount} 
                onValueChange={setQuestionCount} 
                max={maxAvailable} // Dynamically capped
                min={1} 
                step={1}
                className="py-2"
                disabled={maxAvailable === 0}
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1"><span>1</span><span>{maxAvailable}</span></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfigOpen(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-500 text-white" onClick={startPractice} disabled={maxAvailable === 0}>Start Practice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionSetSelection;
