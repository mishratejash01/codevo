/**
 * Enhanced Judge Engine for Practice Solver
 * 
 * Provides robust output comparison with support for:
 * - Order-agnostic comparison (for "return in any order" problems)
 * - Floating point tolerance
 * - Deep array/object comparison
 * - Language-specific normalization
 */

export interface JudgeOptions {
  orderAgnostic?: boolean;     // Allow different ordering in arrays
  floatTolerance?: number;     // Epsilon for floating point comparison (default: 1e-6)
  ignoreWhitespace?: boolean;  // Strip all whitespace before comparing
  ignoreCase?: boolean;        // Case-insensitive comparison
}

/**
 * Deep sort an array recursively for order-agnostic comparison
 */
const deepSort = (arr: any[]): any[] => {
  return arr
    .map(item => {
      if (Array.isArray(item)) {
        return deepSort(item);
      }
      return item;
    })
    .sort((a, b) => {
      const aStr = JSON.stringify(a);
      const bStr = JSON.stringify(b);
      return aStr.localeCompare(bStr);
    });
};

/**
 * Compare two floating point numbers with tolerance
 */
const floatEquals = (a: number, b: number, epsilon: number = 1e-6): boolean => {
  if (Math.abs(a - b) < epsilon) return true;
  
  // Also check relative error for larger numbers
  if (Math.abs(b) > epsilon) {
    const relativeError = Math.abs((a - b) / b);
    if (relativeError < epsilon) return true;
  }
  
  return false;
};

/**
 * Deep compare two values with optional floating point tolerance
 */
const deepEquals = (a: any, b: any, floatTolerance?: number): boolean => {
  // Handle null/undefined
  if (a === null && b === null) return true;
  if (a === undefined && b === undefined) return true;
  if (a === null || b === null) return false;
  if (a === undefined || b === undefined) return false;
  
  // Handle arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEquals(a[i], b[i], floatTolerance)) return false;
    }
    return true;
  }
  
  // Handle numbers with optional float tolerance
  if (typeof a === 'number' && typeof b === 'number') {
    if (floatTolerance !== undefined) {
      return floatEquals(a, b, floatTolerance);
    }
    return a === b;
  }
  
  // Handle objects
  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!deepEquals(a[key], b[key], floatTolerance)) return false;
    }
    return true;
  }
  
  // Primitive comparison
  return a === b;
};

/**
 * Normalize common output format differences across languages
 */
const normalizeForComparison = (s: string): string => {
  return s
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/\[\s+/g, '[')         // Remove space after [
    .replace(/\s+\]/g, ']')         // Remove space before ]
    .replace(/,\s+/g, ',')          // Remove space after comma
    .replace(/True/g, 'true')       // Python -> JS boolean
    .replace(/False/g, 'false')
    .replace(/None/g, 'null')       // Python -> JS null
    .replace(/nullptr/g, 'null')    // C++ -> JS null
    .trim();
};

/**
 * Try to parse a string as JSON, handling Python-style formatting
 */
const tryParseJSON = (s: string): { success: boolean; value: any } => {
  try {
    // First try direct parse
    const value = JSON.parse(s);
    return { success: true, value };
  } catch {
    // Try with quote normalization (Python uses single quotes)
    try {
      const normalized = s.replace(/'/g, '"');
      const value = JSON.parse(normalized);
      return { success: true, value };
    } catch {
      return { success: false, value: null };
    }
  }
};

/**
 * Main comparison function with enhanced options
 */
export const compareOutputs = (
  actual: string,
  expected: string,
  options: JudgeOptions = {}
): boolean => {
  const {
    orderAgnostic = false,
    floatTolerance = 1e-6,
    ignoreWhitespace = false,
    ignoreCase = false,
  } = options;
  
  // 1. Basic trim
  let cleanActual = actual.trim();
  let cleanExpected = expected.trim();
  
  // 2. Optional whitespace removal
  if (ignoreWhitespace) {
    cleanActual = cleanActual.replace(/\s+/g, '');
    cleanExpected = cleanExpected.replace(/\s+/g, '');
  }
  
  // 3. Optional case normalization
  if (ignoreCase) {
    cleanActual = cleanActual.toLowerCase();
    cleanExpected = cleanExpected.toLowerCase();
  }
  
  // 4. Exact match check
  if (cleanActual === cleanExpected) return true;
  
  // 5. Normalize common formatting differences
  const normActual = normalizeForComparison(cleanActual);
  const normExpected = normalizeForComparison(cleanExpected);
  
  if (normActual === normExpected) return true;
  
  // 6. Try JSON parsing for structured comparison
  const parsedActual = tryParseJSON(normActual);
  const parsedExpected = tryParseJSON(normExpected);
  
  if (parsedActual.success && parsedExpected.success) {
    // If order-agnostic, sort arrays before comparing
    if (orderAgnostic) {
      const sortedActual = Array.isArray(parsedActual.value) 
        ? deepSort(parsedActual.value) 
        : parsedActual.value;
      const sortedExpected = Array.isArray(parsedExpected.value) 
        ? deepSort(parsedExpected.value) 
        : parsedExpected.value;
      
      if (deepEquals(sortedActual, sortedExpected, floatTolerance)) return true;
    }
    
    // Standard deep comparison with float tolerance
    if (deepEquals(parsedActual.value, parsedExpected.value, floatTolerance)) return true;
  }
  
  // 7. Line-by-line comparison (for multi-line outputs)
  const actualLines = cleanActual.split('\n').map(l => l.trimEnd());
  const expectedLines = cleanExpected.split('\n').map(l => l.trimEnd());
  
  if (actualLines.length === expectedLines.length) {
    let allMatch = true;
    for (let i = 0; i < actualLines.length; i++) {
      if (normalizeForComparison(actualLines[i]) !== normalizeForComparison(expectedLines[i])) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  
  // 8. Numeric comparison with tolerance (for single numbers)
  const actualNum = parseFloat(cleanActual);
  const expectedNum = parseFloat(cleanExpected);
  if (!isNaN(actualNum) && !isNaN(expectedNum)) {
    if (floatEquals(actualNum, expectedNum, floatTolerance)) return true;
  }
  
  // 9. Array of floats comparison
  if (parsedActual.success && parsedExpected.success) {
    const actualArr = parsedActual.value;
    const expectedArr = parsedExpected.value;
    
    if (Array.isArray(actualArr) && Array.isArray(expectedArr)) {
      if (actualArr.length === expectedArr.length) {
        let allClose = true;
        for (let i = 0; i < actualArr.length; i++) {
          if (typeof actualArr[i] === 'number' && typeof expectedArr[i] === 'number') {
            if (!floatEquals(actualArr[i], expectedArr[i], floatTolerance)) {
              allClose = false;
              break;
            }
          } else if (actualArr[i] !== expectedArr[i]) {
            allClose = false;
            break;
          }
        }
        if (allClose) return true;
      }
    }
  }
  
  return false;
};

/**
 * Get a detailed comparison result with diff info
 */
export interface ComparisonResult {
  passed: boolean;
  normalizedActual: string;
  normalizedExpected: string;
  differenceType?: 'exact' | 'format' | 'order' | 'value' | 'type';
}

export const compareWithDetails = (
  actual: string,
  expected: string,
  options: JudgeOptions = {}
): ComparisonResult => {
  const passed = compareOutputs(actual, expected, options);
  const normalizedActual = normalizeForComparison(actual.trim());
  const normalizedExpected = normalizeForComparison(expected.trim());
  
  let differenceType: ComparisonResult['differenceType'];
  
  if (passed) {
    differenceType = undefined;
  } else if (actual.trim() === expected.trim()) {
    differenceType = 'exact';
  } else if (normalizedActual === normalizedExpected) {
    differenceType = 'format';
  } else {
    // Try to determine if it's an order issue
    const parsedActual = tryParseJSON(normalizedActual);
    const parsedExpected = tryParseJSON(normalizedExpected);
    
    if (parsedActual.success && parsedExpected.success) {
      if (Array.isArray(parsedActual.value) && Array.isArray(parsedExpected.value)) {
        const sortedActual = deepSort(parsedActual.value);
        const sortedExpected = deepSort(parsedExpected.value);
        if (JSON.stringify(sortedActual) === JSON.stringify(sortedExpected)) {
          differenceType = 'order';
        } else {
          differenceType = 'value';
        }
      } else {
        differenceType = 'value';
      }
    } else {
      differenceType = 'type';
    }
  }
  
  return {
    passed,
    normalizedActual,
    normalizedExpected,
    differenceType,
  };
};
