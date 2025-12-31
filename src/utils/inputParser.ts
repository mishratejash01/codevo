/**
 * LeetCode-style input parser
 * Converts test case inputs like "nums = [2,7,11,15], target = 9" to language-specific formats
 */

import { Language } from './codeWrappers';

interface ParsedParam {
  name: string;
  value: string;
  type: 'array' | 'string' | 'number' | 'boolean' | 'array2d' | 'null' | 'linkedlist' | 'tree';
}

/**
 * Parse raw LeetCode-style input string into structured parameters
 */
const parseRawInput = (rawInput: string): ParsedParam[] => {
  if (!rawInput || rawInput.trim() === '') return [];
  
  const params: ParsedParam[] = [];
  const input = rawInput.trim();
  
  // Handle simple case: just values without names (e.g., "[1,2,3], 5")
  if (!input.includes('=')) {
    return parseUnnamedInput(input);
  }
  
  // Parse named parameters (e.g., "nums = [1,2,3], target = 5")
  // Match patterns like: name = value
  const regex = /(\w+)\s*=\s*(.+?)(?=,\s*\w+\s*=|$)/g;
  let match;
  
  while ((match = regex.exec(input)) !== null) {
    const name = match[1].trim();
    let value = match[2].trim();
    
    // Remove trailing comma if present
    if (value.endsWith(',')) {
      value = value.slice(0, -1).trim();
    }
    
    params.push({
      name,
      value,
      type: detectValueType(value, name)
    });
  }
  
  return params;
};

/**
 * Parse unnamed input values
 */
const parseUnnamedInput = (input: string): ParsedParam[] => {
  const params: ParsedParam[] = [];
  let current = '';
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let paramIndex = 0;
  
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    
    if (!inString && (char === '"' || char === "'")) {
      inString = true;
      stringChar = char;
      current += char;
    } else if (inString && char === stringChar && input[i - 1] !== '\\') {
      inString = false;
      current += char;
    } else if (!inString && (char === '[' || char === '{' || char === '(')) {
      depth++;
      current += char;
    } else if (!inString && (char === ']' || char === '}' || char === ')')) {
      depth--;
      current += char;
    } else if (!inString && depth === 0 && char === ',') {
      // End of parameter
      const value = current.trim();
      if (value) {
        params.push({
          name: `param${paramIndex++}`,
          value,
          type: detectValueType(value)
        });
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // Don't forget last parameter
  const value = current.trim();
  if (value) {
    params.push({
      name: `param${paramIndex}`,
      value,
      type: detectValueType(value)
    });
  }
  
  return params;
};

/**
 * Detect the type of a value string
 * Enhanced to detect ListNode and TreeNode patterns
 */
const detectValueType = (value: string, name?: string): ParsedParam['type'] => {
  const trimmed = value.trim();
  
  if (trimmed === 'null' || trimmed === 'None' || trimmed === 'nullptr') {
    return 'null';
  }
  if (trimmed === 'true' || trimmed === 'false' || trimmed === 'True' || trimmed === 'False') {
    return 'boolean';
  }
  if (trimmed.startsWith('[[') || trimmed.startsWith('[[ ')) {
    return 'array2d';
  }
  
  // Check for LinkedList pattern based on parameter name
  if (name && (name.toLowerCase().includes('head') || name.toLowerCase().includes('list'))) {
    if (trimmed.startsWith('[') && !trimmed.startsWith('[[')) {
      return 'linkedlist';
    }
  }
  
  // Check for Tree pattern based on parameter name
  if (name && (name.toLowerCase().includes('root') || name.toLowerCase().includes('tree'))) {
    if (trimmed.startsWith('[')) {
      return 'tree';
    }
  }
  
  if (trimmed.startsWith('[')) {
    return 'array';
  }
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    return 'string';
  }
  if (!isNaN(Number(trimmed))) {
    return 'number';
  }
  return 'string';
};

/**
 * Convert parsed parameters to language-specific format
 */
export const parseInputForLanguage = (language: Language, rawInput: string): string => {
  const params = parseRawInput(rawInput);
  
  if (params.length === 0) return '';
  
  const convertedValues = params.map(param => {
    switch (language) {
      case 'python':
        return convertToPython(param);
      case 'javascript':
      case 'typescript':
        return convertToJavaScript(param);
      case 'java':
        return convertToJava(param);
      case 'cpp':
        return convertToCpp(param);
      default:
        return param.value;
    }
  });
  
  return convertedValues.join(', ');
};

/**
 * Convert to Python format (mostly passthrough, Python is very flexible)
 */
const convertToPython = (param: ParsedParam): string => {
  const { value, type } = param;
  
  if (type === 'null') return 'None';
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' ? 'True' : 'False';
  }
  if (type === 'linkedlist') {
    // Convert array to ListNode using helper
    return `_build_list(${value})`;
  }
  if (type === 'tree') {
    // Convert array to TreeNode using helper
    return `_build_tree(${value})`;
  }
  if (type === 'string') {
    // Ensure proper string quoting
    if (!value.startsWith('"') && !value.startsWith("'")) {
      return `"${value}"`;
    }
  }
  return value;
};

/**
 * Convert to JavaScript format (mostly passthrough)
 */
const convertToJavaScript = (param: ParsedParam): string => {
  const { value, type } = param;
  
  if (type === 'null') return 'null';
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' ? 'true' : 'false';
  }
  if (type === 'linkedlist') {
    return `_buildList(${value})`;
  }
  if (type === 'tree') {
    return `_buildTree(${value})`;
  }
  if (type === 'string') {
    if (!value.startsWith('"') && !value.startsWith("'")) {
      return `"${value}"`;
    }
  }
  return value;
};

/**
 * Convert to Java format - arrays need special handling
 */
const convertToJava = (param: ParsedParam): string => {
  const { value, type } = param;
  
  if (type === 'null') return 'null';
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' ? 'true' : 'false';
  }
  if (type === 'string') {
    // Ensure double quotes for Java strings
    const unquoted = value.replace(/^['"]|['"]$/g, '');
    return `"${unquoted}"`;
  }
  if (type === 'linkedlist') {
    // For Java, we need to pass the array and let the driver build the list
    return `buildList(${convertArrayToJava(value)})`;
  }
  if (type === 'tree') {
    // Similar for trees
    return convertArrayToJava(value);
  }
  if (type === 'array') {
    return convertArrayToJava(value);
  }
  if (type === 'array2d') {
    return convertArray2DToJava(value);
  }
  return value;
};

/**
 * Convert array to Java format
 */
const convertArrayToJava = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 'new int[]{}';
    }
    
    const firstElement = parsed[0];
    if (typeof firstElement === 'number') {
      if (Number.isInteger(firstElement)) {
        return `new int[]{${parsed.join(', ')}}`;
      }
      return `new double[]{${parsed.join(', ')}}`;
    }
    if (typeof firstElement === 'string') {
      const strings = parsed.map((s: string) => `"${s}"`).join(', ');
      return `new String[]{${strings}}`;
    }
    if (typeof firstElement === 'boolean') {
      const bools = parsed.map((b: boolean) => b ? 'true' : 'false').join(', ');
      return `new boolean[]{${bools}}`;
    }
    
    // Default to int array
    return `new int[]{${parsed.join(', ')}}`;
  } catch {
    return value;
  }
};

/**
 * Convert 2D array to Java format
 */
const convertArray2DToJava = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return value;
    
    const inner = parsed.map((arr: any[]) => {
      if (typeof arr[0] === 'string') {
        return `{${arr.map((s: string) => `"${s}"`).join(', ')}}`;
      }
      return `{${arr.join(', ')}}`;
    }).join(', ');
    
    if (parsed[0] && typeof parsed[0][0] === 'string') {
      return `new String[][]{${inner}}`;
    }
    return `new int[][]{${inner}}`;
  } catch {
    return value;
  }
};

/**
 * Convert to C++ format
 */
const convertToCpp = (param: ParsedParam): string => {
  const { value, type } = param;
  
  if (type === 'null') return 'nullptr';
  if (type === 'boolean') {
    return value.toLowerCase() === 'true' ? 'true' : 'false';
  }
  if (type === 'string') {
    const unquoted = value.replace(/^['"]|['"]$/g, '');
    return `"${unquoted}"`;
  }
  if (type === 'linkedlist') {
    // For C++, pass to buildList helper
    const arr = convertArrayToCpp(value);
    return `buildList(${arr})`;
  }
  if (type === 'tree') {
    return convertArrayToCpp(value);
  }
  if (type === 'array') {
    return convertArrayToCpp(value);
  }
  if (type === 'array2d') {
    return convertArray2DToCpp(value);
  }
  return value;
};

/**
 * Convert array to C++ vector format
 */
const convertArrayToCpp = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return 'vector<int>{}';
    }
    
    const firstElement = parsed[0];
    if (typeof firstElement === 'number') {
      return `vector<int>{${parsed.join(', ')}}`;
    }
    if (typeof firstElement === 'string') {
      const strings = parsed.map((s: string) => `"${s}"`).join(', ');
      return `vector<string>{${strings}}`;
    }
    if (typeof firstElement === 'boolean') {
      const bools = parsed.map((b: boolean) => b ? 'true' : 'false').join(', ');
      return `vector<bool>{${bools}}`;
    }
    
    return `vector<int>{${parsed.join(', ')}}`;
  } catch {
    return value;
  }
};

/**
 * Convert 2D array to C++ format
 */
const convertArray2DToCpp = (value: string): string => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return value;
    
    const inner = parsed.map((arr: any[]) => {
      if (typeof arr[0] === 'string') {
        return `{${arr.map((s: string) => `"${s}"`).join(', ')}}`;
      }
      return `{${arr.join(', ')}}`;
    }).join(', ');
    
    if (parsed[0] && typeof parsed[0][0] === 'string') {
      return `vector<vector<string>>{${inner}}`;
    }
    return `vector<vector<int>>{${inner}}`;
  } catch {
    return value;
  }
};

/**
 * Normalize output for comparison (handles different formatting between languages)
 */
export const normalizeOutput = (output: string): string => {
  if (!output) return '';
  
  let normalized = output.trim();
  
  // Remove trailing newlines
  normalized = normalized.replace(/\n+$/, '');
  
  // Normalize boolean output
  normalized = normalized.replace(/True/g, 'true').replace(/False/g, 'false');
  
  // Normalize None/null/nullptr
  normalized = normalized.replace(/None/g, 'null').replace(/nullptr/g, 'null');
  
  // Normalize array formatting: remove spaces after commas and brackets
  normalized = normalized.replace(/\[\s+/g, '[').replace(/\s+\]/g, ']');
  normalized = normalized.replace(/,\s+/g, ',');
  
  // Handle Python tuple vs list (convert tuples to arrays)
  normalized = normalized.replace(/\(/g, '[').replace(/\)/g, ']');
  
  // Remove quotes around entire output if present
  if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'"))) {
    const inner = normalized.slice(1, -1);
    // Only unquote if it's a simple string result
    if (!inner.includes('[') && !inner.includes('{')) {
      normalized = inner;
    }
  }
  
  return normalized;
};
