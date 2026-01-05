/**
 * Test case handler utility for normalizing test cases from database
 * Ensures all test cases have consistent structure with is_public defaulting to true
 */

export interface NormalizedTestCase {
  input: any;
  output: any;
  is_public: boolean;
}

/**
 * Normalize test cases from database
 * - Ensures is_public defaults to true if not specified
 * - Handles various input formats
 */
export const normalizeTestCases = (testCases: any[]): NormalizedTestCase[] => {
  if (!Array.isArray(testCases)) return [];
  
  return testCases.map((tc, index) => ({
    input: tc.input ?? '',
    output: tc.output ?? '',
    // Default is_public to true if not explicitly set to false
    is_public: tc.is_public !== false,
  }));
};

/**
 * Get public test cases for display and running
 */
export const getPublicTestCases = (testCases: any[]): NormalizedTestCase[] => {
  const normalized = normalizeTestCases(testCases);
  // If no test cases are marked as public, treat all as public for practice problems
  const publicTests = normalized.filter(t => t.is_public);
  return publicTests.length > 0 ? publicTests : normalized;
};

/**
 * Format input value for display
 */
export const formatValue = (val: any): string => {
  if (val === null || val === undefined) return 'null';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

/**
 * Format test input for display in the UI
 */
export const formatTestInput = (input: any): string => {
  if (typeof input === 'string') {
    // Already a string - might be "nums = [1,2,3], target = 9" format
    return input;
  }
  return formatValue(input);
};
