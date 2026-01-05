/**
 * Language Literals Utility
 * Converts parsed JSON values into language-specific literal syntax
 */

export type Language = 'python' | 'java' | 'cpp';

/**
 * Convert a JavaScript value to a Python literal
 */
export const toPythonLiteral = (value: any): string => {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    return `[${value.map(toPythonLiteral).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
      .map(([k, v]) => `"${k}": ${toPythonLiteral(v)}`)
      .join(', ');
    return `{${entries}}`;
  }
  return String(value);
};

/**
 * Convert a JavaScript value to a Java literal
 */
export const toJavaLiteral = (value: any, targetType?: string): string => {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return String(value);
    return value + 'd'; // double literal
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      // Need type hint for empty arrays
      if (targetType?.includes('String')) return 'new String[]{}';
      if (targetType?.includes('int')) return 'new int[]{}';
      return 'new Object[]{}';
    }
    
    // Check first element type
    const firstEl = value[0];
    if (Array.isArray(firstEl)) {
      // 2D array
      const inner = value.map((row: any[]) => `{${row.map(v => toJavaLiteral(v)).join(', ')}}`).join(', ');
      if (typeof firstEl[0] === 'string') return `new String[][]{${inner}}`;
      return `new int[][]{${inner}}`;
    }
    if (typeof firstEl === 'string') {
      return `new String[]{${value.map((s: string) => `"${s}"`).join(', ')}}`;
    }
    if (typeof firstEl === 'boolean') {
      return `new boolean[]{${value.map((b: boolean) => b ? 'true' : 'false').join(', ')}}`;
    }
    return `new int[]{${value.join(', ')}}`;
  }
  return String(value);
};

/**
 * Convert a JavaScript value to a C++ literal
 */
export const toCppLiteral = (value: any): string => {
  if (value === null || value === undefined) return 'nullptr';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return `"${value.replace(/"/g, '\\"')}"`;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '{}';
    
    const firstEl = value[0];
    if (Array.isArray(firstEl)) {
      // 2D array
      const inner = value.map((row: any[]) => `{${row.map(toCppLiteral).join(', ')}}`).join(', ');
      return `{${inner}}`;
    }
    if (typeof firstEl === 'string') {
      return `{${value.map((s: string) => `"${s}"`).join(', ')}}`;
    }
    return `{${value.map(toCppLiteral).join(', ')}}`;
  }
  return String(value);
};

/**
 * Convert value to language-specific literal
 */
export const toLiteral = (value: any, language: Language, targetType?: string): string => {
  switch (language) {
    case 'python': return toPythonLiteral(value);
    case 'java': return toJavaLiteral(value, targetType);
    case 'cpp': return toCppLiteral(value);
    default: return String(value);
  }
};
