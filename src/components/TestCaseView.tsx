import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_public: boolean;
}

interface TestResult {
  passed: boolean;
  output: string;
  error?: string | null;
}

interface TestCaseViewProps {
  testCases: TestCase[];
  testResults: Record<string, TestResult>;
}

export const TestCaseView = ({ testCases, testResults }: TestCaseViewProps) => {
  if (testCases.length === 0) {
    return <div className="text-muted-foreground text-center p-4">No test cases available.</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 p-4">
        {testCases.map((test, index) => {
          const result = testResults[test.id];
          const hasRun = !!result;
          
          return (
            <Card key={test.id} className={cn("border border-white/10 bg-white/5", hasRun && !result.passed ? "border-red-500/20 bg-red-500/5" : "")}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {hasRun ? (
                      result.passed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-muted" />
                    )}
                    <span className="font-mono text-sm font-medium text-white">
                      Test Case {index + 1}
                      {test.is_public ? "" : " (Hidden)"}
                    </span>
                  </div>
                  {hasRun && (
                    <span className={cn("text-xs font-bold uppercase", result.passed ? "text-green-500" : "text-red-500")}>
                      {result.passed ? "Passed" : "Failed"}
                    </span>
                  )}
                </div>

                {/* --- ALWAYS VISIBLE SECTION (Input & Expected) --- */}
                {test.is_public && (
                   <div className="space-y-2 mb-2">
                     <div className="grid grid-cols-[70px_1fr] gap-2 text-xs font-mono">
                       <span className="text-muted-foreground font-semibold">Input:</span>
                       <span className="text-white bg-black/40 px-2 py-1 rounded font-medium break-all">{test.input}</span>
                     </div>
                     <div className="grid grid-cols-[70px_1fr] gap-2 text-xs font-mono">
                        <span className="text-muted-foreground font-semibold">Expected:</span>
                        <span className="text-green-400 bg-green-950/20 px-2 py-1 rounded font-medium break-all">{test.expected_output}</span>
                      </div>
                   </div>
                )}

                {/* --- RESULTS SECTION (Only after Run) --- */}
                {hasRun && (
                  <div className="space-y-2 mt-2 border-t border-white/5 pt-2">
                    <div className="grid grid-cols-[70px_1fr] gap-2 text-xs font-mono">
                      <span className="text-muted-foreground font-semibold">Output:</span>
                      <span className={cn(
                        "px-2 py-1 rounded font-medium break-all",
                        result.passed ? "text-white bg-black/40" : "text-red-400 bg-red-950/20"
                      )}>
                         {result.output || <span className="italic opacity-50">No output</span>}
                      </span>
                    </div>

                    {result.error && !result.passed && (
                      <div className="mt-2 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-500/20 break-all whitespace-pre-wrap">
                        <span className="font-semibold">Error:</span> {result.error}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
};
