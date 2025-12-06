import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CodeEditor } from './CodeEditor';
import { TestCaseView } from './TestCaseView';
import { useCodeRunner, Language } from '@/hooks/useCodeRunner';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Play, BookOpen, Flag, RefreshCw, Code2, Lock, Unlock, FileCode } from 'lucide-react';
import type { QuestionStatus } from '@/pages/Index';
import { cn } from '@/lib/utils';

const DEFAULT_TABLES = { assignments: 'assignments', testCases: 'test_cases', submissions: 'submissions' };

interface AssignmentViewProps {
  assignmentId: string;
  onStatusUpdate: (status: QuestionStatus) => void;
  currentStatus?: QuestionStatus;
  onAttempt?: (isCorrect: boolean, score: number) => void;
  tables?: { assignments: string; testCases: string; submissions: string; };
  disableCopyPaste?: boolean;
}

const getTargetName = (code: string) => {
  const funcMatch = code.match(/def\\s+([a-zA-Z_][a-zA-Z0-9_]*)\\s*\\(/);
  if (funcMatch) return funcMatch[1];
  return null;
};

const normalizeOutput = (str: any) => {
  if (str === undefined || str === null) return '';
  // Convert to string and normalize whitespace/quotes for comparison
  return String(str).trim()
    .replace(/'/g, '"')
    .replace(/\\s+/g, ' ')
    .replace(/\\(\\s+/g, '(')
    .replace(/\\s+\\)/g, ')')
    .replace(/\\[\\s+/g, '[')
    .replace(/\\s+\\]/g, ']');
};

const detectInitialLanguage = (title: string, category: string): Language => {
  const text = (title + category).toLowerCase();
  if (text.includes('bash') || text.includes('shell') || text.includes('system')) return 'bash';
  if (text.includes('sql') || text.includes('database')) return 'sql';
  if (text.includes('java')) return 'java';
  if (text.includes('c++') || text.includes('cpp')) return 'cpp';
  if (text.includes('javascript') || text.includes('js')) return 'javascript';
  if (text.includes(' c ') || text.endsWith(' c')) return 'c';
  return 'python';
};

const getStarterTemplate = (lang: Language) => {
  switch(lang) {
    case 'java': return 'import java.util.Scanner;\\n\\npublic class Main {\\n    public static void main(String[] args) {\\n        Scanner sc = new Scanner(System.in);\\n        // Your code here\\n        \\n    }\\n}';
    case 'cpp': return '#include <iostream>\\nusing namespace std;\\n\\nint main() {\\n    // Your code here\\n    return 0;\\n}';
    case 'c': return '#include <stdio.h>\\n\\nint main() {\\n    // Your code here\\n    return 0;\\n}';
    case 'javascript': return 'const fs = require("fs");\\nconst input = fs.readFileSync(0, "utf-8").trim();\\n\\n// Your code here';
    case 'sql': return '-- Write your SQL Query here\\n-- Note: Tables must be created within this script for testing.\\n\\nCREATE TABLE students (id INTEGER, name TEXT, score INTEGER);\\nINSERT INTO students VALUES (1, "Alice", 90);\\nINSERT INTO students VALUES (2, "Bob", 85);\\n\\n-- Your SELECT query below:\\nSELECT * FROM students;';
    case 'bash': return '#!/bin/bash\\n\\n# Read input from stdin\\nread input\\n\\n# Your script here\\necho "Received: $input"';
    default: return '# Write your Python code here\\nimport sys\\n\\n# Read input from stdin\\ninput_data = sys.stdin.read().strip()\\n\\n# Your logic\\n';
  }
};

const getFileName = (lang: Language) => {
  switch(lang) {
    case 'java': return 'Main.java';
    case 'cpp': return 'main.cpp';
    case 'c': return 'main.c';
    case 'javascript': return 'index.js';
    case 'sql': return 'query.sql';
    case 'bash': return 'script.sh';
    default: return 'main.py';
  }
};

export const AssignmentView = ({ 
  assignmentId, 
  onStatusUpdate, 
  currentStatus, 
  onAttempt, 
  tables = DEFAULT_TABLES,
  disableCopyPaste = false 
}: AssignmentViewProps) => {
  const [code, setCode] = useState<string>(''); 
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [bottomTab, setBottomTab] = useState<'console' | 'testcases'>('testcases');
  const [activeLanguage, setActiveLanguage] = useState<Language>('python');
  
  const { executeCode, loading: runnerLoading } = useCodeRunner();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Ref to track if we've already loaded the initial code for this assignmentId
  const codeInitialized = useRef<string | null>(null);

  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['assignment', assignmentId, tables.assignments],
    queryFn: async () => {
      // @ts-ignore
      const { data, error } = await supabase.from(tables.assignments).select('*').eq('id', assignmentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!assignmentId
  });

  const { data: fetchedTestCases = [] } = useQuery({
    queryKey: ['testCases', assignmentId, tables.testCases],
    queryFn: async () => {
      // @ts-ignore
      const { data } = await supabase.from(tables.testCases).select('*').eq('assignment_id', assignmentId).order('is_public', { ascending: false });
      return data || [];
    },
    enabled: !!assignmentId && !!assignment && (!assignment.test_cases || assignment.test_cases.length === 0)
  });

  // --- STABLE TEST CASES LOGIC ---
  const testCases = useMemo(() => {
    // Normalization with safe Input handling (stringify if object)
    const normalizeTestCase = (tc: any, index: number, prefix: string, isPublicOverride?: boolean) => {
      const rawInput = tc.input ?? tc.stdin ?? '';
      const safeInput = typeof rawInput === 'object' ? JSON.stringify(rawInput) : String(rawInput);
      
      const rawOutput = tc.expected_output ?? tc.output ?? '';
      const safeOutput = typeof rawOutput === 'object' ? JSON.stringify(rawOutput) : String(rawOutput);

      return {
        ...tc,
        id: tc.id || `stable-${prefix}-${index}`,
        // Default to TRUE if undefined, unless explicitly overridden
        is_public: isPublicOverride !== undefined ? isPublicOverride : (tc.is_public ?? true),
        input: safeInput,
        expected_output: safeOutput
      };
    };

    const existingMixed = (assignment?.test_cases && assignment.test_cases.length > 0) 
      ? assignment.test_cases.map((tc: any, i: number) => normalizeTestCase(tc, i, 'emb'))
      : fetchedTestCases.map((tc: any, i: number) => normalizeTestCase(tc, i, 'db'));

    const extraPrivate = (assignment?.private_testcases && Array.isArray(assignment.private_testcases))
      ? assignment.private_testcases.map((tc: any, i: number) => normalizeTestCase(tc, i, 'priv', false))
      : [];

    return [...existingMixed, ...extraPrivate];
  }, [assignment, fetchedTestCases]);

  const { data: latestSubmission, isLoading: isSubmissionLoading } = useQuery({
    queryKey: ['submission', assignmentId, tables.submissions],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      // @ts-ignore
      const { data } = await supabase.from(tables.submissions).select('code, score, public_tests_passed, private_tests_passed').eq('assignment_id', assignmentId).eq('user_id', user.id).order('submitted_at', { ascending: false }).limit(1).maybeSingle();
      return data;
    },
    enabled: !!assignmentId
  });

  // 1. Reset state when assignment changes
  useEffect(() => {
    if (codeInitialized.current !== assignmentId) {
      setTestResults({});
      setConsoleOutput('');
      setBottomTab('testcases');
    }
  }, [assignmentId]);

  // 2. Initialize Code (Only once per assignment to avoid overwriting user progress)
  useEffect(() => {
    if (assignment && !isSubmissionLoading && codeInitialized.current !== assignmentId) {
      const detected = detectInitialLanguage(assignment.title, assignment.category || '');
      setActiveLanguage(detected);
      
      const sessionKey = `exam_draft_${assignmentId}`;
      const savedDraft = sessionStorage.getItem(sessionKey);
      
      if (savedDraft) {
        setCode(savedDraft);
      } else if (latestSubmission?.code) {
        setCode(latestSubmission.code);
      } else if (assignment.starter_code) {
        setCode(assignment.starter_code);
      } else {
        setCode(getStarterTemplate(detected));
      }
      
      codeInitialized.current = assignmentId;
    }
  }, [assignmentId, assignment, latestSubmission, isSubmissionLoading]);

  const handleLanguageChange = (val: string) => {
    const newLang = val as Language;
    setActiveLanguage(newLang);
    setCode(getStarterTemplate(newLang));
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    sessionStorage.setItem(`exam_draft_${assignmentId}`, newCode);
  };

  const prepareExecutionCode = (rawCode: string, input: string) => {
    if (activeLanguage === 'python') {
      const targetName = getTargetName(rawCode);
      // Only wrap if we found a function AND there is input to pass
      if (targetName && input) {
        return `${rawCode}\\n\\n# Auto-generated runner\\ntry:\\n    print(${targetName}(${input}))\\nexcept Exception as e:\\n    print(f"Error: {e}")`;
      }
    }
    return rawCode;
  };

  const handleRun = async () => {
    if (runnerLoading) return;
    setBottomTab('testcases');
    
    // We do NOT clear testResults entirely here, to preserve "Private" results if they exist from a previous submit.
    // Instead, we will merge new public results into the existing state.
    
    const newTestResults: Record<string, any> = {};
    let firstError = "";

    try {
      // Filter ONLY public tests
      const publicOnlyTests = testCases.filter(t => t.is_public);

      if (publicOnlyTests.length === 0) {
        setConsoleOutput("No public test cases available.");
        return;
      }

      for (const test of publicOnlyTests) {
        const codeToRun = prepareExecutionCode(code, test.input);
        const result = await executeCode(activeLanguage, codeToRun, test.input);
        
        let isMatch = false;
        let errorMsg = null;

        if (!result.success) {
           errorMsg = result.error || "Execution Error";
           if (!firstError) firstError = errorMsg;
        } else {
           const actual = normalizeOutput(result.output);
           const expected = normalizeOutput(test.expected_output);
           isMatch = actual === expected || actual.includes(expected);
           if (!isMatch) errorMsg = `Expected: ${test.expected_output}`;
        }

        newTestResults[test.id] = { 
          passed: isMatch, 
          output: result.output, 
          error: errorMsg
        };
      }
      
      // MERGE: Keep existing results (private), overwrite public
      setTestResults(prev => ({
        ...prev,
        ...newTestResults
      }));
      
      if (firstError) setConsoleOutput(`Run finished with errors.\\n${firstError}`);
      else setConsoleOutput("Public tests executed successfully.");

    } catch (err: any) {
      setConsoleOutput(`System Error: ${err.message}`);
      setBottomTab('console');
    }
  };

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Please log in');
      
      const publicTests = testCases.filter((tc:any) => tc.is_public);
      const privateTests = testCases.filter((tc:any) => !tc.is_public);
      const allTests = [...publicTests, ...privateTests];
      
      const newTestResults: Record<string, any> = {};
      let passedCount = 0;

      for (const test of allTests) {
        const codeToRun = prepareExecutionCode(code, test.input);
        const result = await executeCode(activeLanguage, codeToRun, test.input);
        
        if (!result.success) {
          newTestResults[test.id] = { passed: false, output: "Error", error: result.error };
          continue;
        }

        const actual = normalizeOutput(result.output);
        const expected = normalizeOutput(test.expected_output);
        const isMatch = actual === expected || actual.includes(expected);
        
        if (isMatch) passedCount++;
        newTestResults[test.id] = { 
          passed: isMatch, 
          output: result.output, 
          error: isMatch ? null : `Expected: ${test.expected_output}` 
        };
      }
      
      // SUBMIT: Replace all results
      setTestResults(newTestResults);
      
      const total = allTests.length;
      const score = total > 0 ? (passedCount / total) * (assignment.max_score || 100) : 0;
      
      // @ts-ignore
      await supabase.from(tables.submissions).insert({
        assignment_id: assignmentId,
        user_id: user.id,
        code,
        score,
        public_tests_passed: publicTests.filter(t => newTestResults[t.id]?.passed).length,
        public_tests_total: publicTests.length,
        private_tests_passed: privateTests.filter(t => newTestResults[t.id]?.passed).length,
        private_tests_total: privateTests.length,
      });
      return { score, passedCount, total };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['submission', assignmentId] });
      // Calculate percentage based on passed tests count vs total tests count
      const percentage = data.total > 0 ? Math.round((data.passedCount / data.total) * 100) : 0;
      toast({ 
        title: 'Submission Complete', 
        description: `Score: ${percentage}% (${data.score.toFixed(1)} / ${(assignment.max_score || 100)})` 
      });
      onStatusUpdate('attempted');
      setBottomTab('testcases');
      if (onAttempt) onAttempt(data.passedCount === data.total, data.score);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConsoleOutput(err.message);
      setBottomTab('console');
    }
  });

  const publicTests = testCases.filter((tc: any) => tc.is_public);
  const privateTests = testCases.filter((tc: any) => !tc.is_public);
  
  const hasRunTests = Object.keys(testResults).length > 0;
  
  // --- METER LOGIC ---
  
  // Public: Prefer current live results. Fallback to latest submission DB value.
  const currentPubPassed = hasRunTests 
    ? publicTests.filter(t => testResults[t.id]?.passed).length
    : (latestSubmission?.public_tests_passed || 0);
    
  // Private: Prefer current live results ONLY if we just ran a Submit (checked via key existence).
  // Otherwise, fallback to latest submission.
  const hasRunPrivate = hasRunTests && privateTests.some(t => testResults.hasOwnProperty(t.id));

  const currentPrivPassed = hasRunPrivate
    ? privateTests.filter(t => testResults[t.id]?.passed).length
    : (latestSubmission?.private_tests_passed || 0);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-white"/></div>;
  if (error || !assignment) return <div className="text-white text-center p-10"><Button onClick={() => refetch()}>Retry</Button></div>;

  return (
    <div className="h-full w-full bg-[#09090b] text-white overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* LEFT PANEL */}
        <ResizablePanel defaultSize={40} minSize={30} className="bg-[#0c0c0e] border-r border-white/10 flex flex-col">
          <div className="h-12 border-b border-white/10 flex items-center px-4 justify-between bg-black/20 shrink-0">
            <div className="flex items-center gap-2 text-sm font-medium text-white/90"><BookOpen className="w-4 h-4 text-primary" /> Problem Description</div>
            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground bg-white/5 px-2 py-0.5 rounded border border-white/10 font-mono">
                 Score: {latestSubmission?.score?.toFixed(0) || 0} / {assignment.max_score}
               </span>
               <Button variant="ghost" size="icon" onClick={() => { onStatusUpdate('review'); toast({description:"Marked for Review"}); }} className={cn("h-7 w-7", currentStatus === 'review' ? "text-orange-500" : "text-muted-foreground")}><Flag className="w-4 h-4" /></Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-white mb-2">{assignment.title}</h1>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className={cn("uppercase tracking-wider font-bold", 
                    activeLanguage === 'sql' ? "text-purple-400" : 
                    activeLanguage === 'bash' ? "text-pink-400" :
                    activeLanguage !== 'python' ? "text-blue-400" : "text-yellow-400")}>{activeLanguage}</span>
                  <span>•</span>
                  <span>{assignment.category || "General"}</span>
                </div>
              </div>
              <div className="prose prose-invert prose-sm text-gray-300"><div className="whitespace-pre-wrap font-sans">{assignment.description}</div></div>
              {assignment.instructions && <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-4 text-xs text-blue-200/70 whitespace-pre-wrap">{assignment.instructions}</div>}

              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Unlock className="w-3 h-3"/> Public Tests</span>
                       <span className="text-xs font-bold text-white">{currentPubPassed}/{publicTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${publicTests.length ? (currentPubPassed/publicTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
                 <div className="bg-white/5 rounded p-3 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3"/> Private Tests</span>
                       <span className="text-xs font-bold text-white">{currentPrivPassed}/{privateTests.length}</span>
                    </div>
                    <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${privateTests.length ? (currentPrivPassed/privateTests.length)*100 : 0}%` }} />
                    </div>
                 </div>
              </div>
            </div>
          </ScrollArea>
        </ResizablePanel>
        
        <ResizableHandle withHandle className="bg-black border-l border-r border-white/5 w-2 hover:bg-primary/20 transition-colors" />

        {/* RIGHT PANEL: Editor */}
        <ResizablePanel defaultSize={60}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={70} className="flex flex-col bg-[#09090b]">
              <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-black/40 shrink-0">
                <div className="flex items-center gap-4">
                  <Select value={activeLanguage} onValueChange={handleLanguageChange}>
                    <SelectTrigger className="h-8 w-[140px] bg-white/5 border-white/10 text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Code2 className="w-3.5 h-3.5 text-green-500" />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1c] border-white/10 text-white">
                      <SelectItem value="python">Python</SelectItem>
                      <SelectItem value="java">Java</SelectItem>
                      <SelectItem value="cpp">C++</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="javascript">JavaScript</SelectItem>
                      <SelectItem value="sql">SQL</SelectItem>
                      <SelectItem value="bash">Bash</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileCode className="w-3 h-3" /> {getFileName(activeLanguage)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleRun} disabled={runnerLoading} className="h-7 text-xs gap-1.5"><Play className="w-3 h-3 mr-1"/> Run</Button>
                  <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending || runnerLoading} size="sm" className="h-7 text-xs gap-1.5 bg-green-600 hover:bg-green-500 text-white">{submitMutation.isPending || runnerLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : 'Submit'}</Button>
                </div>
              </div>
              <div className="flex-1 relative">
                <CodeEditor 
                  value={code} 
                  onChange={handleCodeChange} 
                  disableCopyPaste={disableCopyPaste} 
                  language={activeLanguage}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="bg-black border-t border-b border-white/5 h-2 hover:bg-primary/20 transition-colors" />
            
            <ResizablePanel defaultSize={30} className="bg-[#0c0c0e] flex flex-col relative">
              <Tabs value={bottomTab} onValueChange={(v:any) => setBottomTab(v)} className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 bg-black/20 shrink-0">
                  <TabsList className="h-7 bg-white/5 border border-white/10 p-0.5 gap-1">
                    <TabsTrigger value="testcases" className="text-xs h-6 px-3">Test Cases</TabsTrigger>
                    <TabsTrigger value="console" className="text-xs h-6 px-3">Console Output</TabsTrigger>
                  </TabsList>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => setConsoleOutput('')}><RefreshCw className="w-3 h-3"/></Button>
                </div>
                <div className="flex-1 min-h-0 relative">
                  <TabsContent value="testcases" className="h-full m-0 p-0"><TestCaseView testCases={testCases} testResults={testResults} /></TabsContent>
                  <TabsContent value="console" className="h-full m-0 p-0"><div className="h-full p-4 font-mono text-sm overflow-auto bg-[#0a0a0a]"><pre className={cn("whitespace-pre-wrap", consoleOutput.includes('Error') ? "text-red-400" : "text-blue-400")}>{consoleOutput || <span className="text-muted-foreground/40 italic"># No output</span>}</pre></div></TabsContent>
                </div>
              </Tabs>

              {/* WATERMARK */}
              <div className="absolute bottom-2 right-3 pointer-events-none select-none z-50 flex items-center justify-end opacity-20">
                <span className="font-neuropol text-[10px] font-bold tracking-widest text-white">
                  COD
                  <span className="text-[1.2em] lowercase relative top-[0.5px] mx-[0.5px] inline-block">é</span>
                  VO
                </span>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
