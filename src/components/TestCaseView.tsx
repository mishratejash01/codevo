import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_public: boolean;
}

// Define structure for test results
interface TestResult {
  output: string;
  passed: boolean;
  error?: string | null;
}

interface TestCaseViewProps {
  testCases: TestCase[];
  testResults?: Record<string, TestResult>;
}

export const TestCaseView = ({ testCases, testResults = {} }: TestCaseViewProps) => {
  const publicTests = testCases.filter(tc => tc.is_public);
  const privateTests = testCases.filter(tc => !tc.is_public);
  const [selectedPublic, setSelectedPublic] = useState(0);
  const [selectedPrivate, setSelectedPrivate] = useState(0);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="public">
        <TabsList>
          <TabsTrigger value="public">
            Public Tests ({publicTests.length})
          </TabsTrigger>
          <TabsTrigger value="private">
            Private Tests ({privateTests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="space-y-4">
          {publicTests.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {publicTests.map((test, index) => {
                  // Check if we have a result for this specific test case
                  const result = testResults[test.id];
                  return (
                    <Badge
                      key={index}
                      variant={selectedPublic === index ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        result 
                          ? result.passed 
                            ? 'border-green-500 text-green-600' 
                            : 'border-red-500 text-red-600'
                          : ''
                      }`}
                      onClick={() => setSelectedPublic(index)}
                    >
                      Case {index + 1}
                    </Badge>
                  );
                })}
              </div>
              <TestCaseCard 
                testCase={publicTests[selectedPublic]} 
                result={testResults[publicTests[selectedPublic].id]} 
              />
            </>
          ) : (
            <p className="text-muted-foreground">No public test cases available</p>
          )}
        </TabsContent>

        <TabsContent value="private" className="space-y-4">
          {privateTests.length > 0 ? (
            <>
              <div className="flex gap-2 flex-wrap">
                {privateTests.map((_, index) => (
                  <Badge
                    key={index}
                    variant={selectedPrivate === index ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedPrivate(index)}
                  >
                    Case {index + 1}
                  </Badge>
                ))}
              </div>
              <TestCaseCard testCase={privateTests[selectedPrivate]} />
            </>
          ) : (
            <p className="text-muted-foreground">No private test cases available</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Updated Card to display Actual Output
const TestCaseCard = ({ testCase, result }: { testCase: TestCase; result?: TestResult }) => (
  <div className="space-y-4">
    <Card>
      <CardContent className="pt-6">
        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Input</h4>
        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
          {testCase.input}
        </pre>
      </CardContent>
    </Card>

    <Card>
      <CardContent className="pt-6">
        <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Expected Output</h4>
        <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
          {testCase.expected_output}
        </pre>
      </CardContent>
    </Card>

    {/* Only show this section if we have run a test */}
    {result && (
      <Card className={result.passed ? "border-green-500" : "border-red-500 border-2"}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm text-muted-foreground">Actual Output</h4>
            <Badge variant={result.passed ? "default" : "destructive"}>
              {result.passed ? "Passed" : "Failed"}
            </Badge>
          </div>
          <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
            {result.output || (result.error ? `Error: ${result.error}` : "<No Output>")}
          </pre>
        </CardContent>
      </Card>
    )}
  </div>
);
