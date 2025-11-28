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

interface TestCaseViewProps {
  testCases: TestCase[];
}

export const TestCaseView = ({ testCases }: TestCaseViewProps) => {
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
                {publicTests.map((_, index) => (
                  <Badge
                    key={index}
                    variant={selectedPublic === index ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setSelectedPublic(index)}
                  >
                    Case {index + 1}
                  </Badge>
                ))}
              </div>
              <TestCaseCard testCase={publicTests[selectedPublic]} />
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

const TestCaseCard = ({ testCase }: { testCase: TestCase }) => (
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
  </div>
);
