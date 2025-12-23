/**
 * LeetCode-style code wrappers for multi-language support
 * Automatically handles driver code injection for Python, JavaScript, Java, and C++
 */

import { parseInputForLanguage } from './inputParser';

export type Language = 'python' | 'javascript' | 'java' | 'cpp';

export interface MethodSignature {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
}

/**
 * Wraps user code with driver code for the specified language
 */
export const wrapCodeForExecution = (
  language: Language,
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  switch (language) {
    case 'python':
      return wrapPythonCode(userCode, rawInput, methodSignature);
    case 'javascript':
      return wrapJavaScriptCode(userCode, rawInput, methodSignature);
    case 'java':
      return wrapJavaCode(userCode, rawInput, methodSignature);
    case 'cpp':
      return wrapCppCode(userCode, rawInput, methodSignature);
    default:
      return userCode;
  }
};

/**
 * Python driver code - handles Solution class and function calls
 */
const wrapPythonCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  const parsedArgs = parseInputForLanguage('python', rawInput);
  
  return `${userCode}

# --- Auto-generated Driver Code ---
import sys
import json

def _serialize_output(result):
    """Convert result to LeetCode-style output format"""
    if result is None:
        return "null"
    if isinstance(result, bool):
        return "true" if result else "false"
    if isinstance(result, (list, tuple)):
        return json.dumps(result)
    if isinstance(result, str):
        return f'"{result}"'
    return str(result)

try:
    # Try Solution class first (LeetCode style)
    if 'Solution' in dir():
        sol = Solution()
        # Find the first non-dunder method
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
            result = method(${parsedArgs})
            print(_serialize_output(result))
    else:
        # Try standalone function
        import types
        funcs = [name for name, obj in list(locals().items()) 
                 if isinstance(obj, types.FunctionType) 
                 and not name.startswith('_') 
                 and name != '_serialize_output']
        if funcs:
            func = locals()[funcs[-1]]
            result = func(${parsedArgs})
            print(_serialize_output(result))
except Exception as e:
    import traceback
    print(f"Runtime Error: {type(e).__name__}: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
`;
};

/**
 * JavaScript driver code - handles both function and class style
 */
const wrapJavaScriptCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  const parsedArgs = parseInputForLanguage('javascript', rawInput);
  
  return `${userCode}

// --- Auto-generated Driver Code ---
function _serializeOutput(result) {
  if (result === null || result === undefined) return "null";
  if (typeof result === "boolean") return result ? "true" : "false";
  if (Array.isArray(result)) return JSON.stringify(result);
  if (typeof result === "object") return JSON.stringify(result);
  if (typeof result === "string") return '"' + result + '"';
  return String(result);
}

try {
  let result;
  // Try Solution class first (LeetCode style)
  if (typeof Solution !== 'undefined') {
    const sol = new Solution();
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(sol))
      .filter(m => m !== 'constructor' && typeof sol[m] === 'function');
    if (methodNames.length > 0) {
      result = sol[methodNames[0]](${parsedArgs});
    }
  } else {
    // Find standalone functions (exclude our helpers)
    const funcNames = Object.keys(this || globalThis).filter(key => {
      try {
        return typeof eval(key) === 'function' && 
               !key.startsWith('_') && 
               !['require', 'console', 'process', 'Buffer'].includes(key);
      } catch { return false; }
    });
    
    // Try common LeetCode function patterns
    const commonPatterns = ['twoSum', 'threeSum', 'maxProfit', 'lengthOfLongestSubstring', 'reverse', 'isPalindrome'];
    let funcName = funcNames.find(f => commonPatterns.some(p => f.toLowerCase().includes(p.toLowerCase())));
    
    if (!funcName && funcNames.length > 0) {
      funcName = funcNames[funcNames.length - 1];
    }
    
    if (funcName) {
      result = eval(funcName + '(${parsedArgs})');
    }
  }
  
  console.log(_serializeOutput(result));
} catch (e) {
  console.error("Runtime Error:", e.name + ":", e.message);
}
`;
};

/**
 * Java driver code - wraps Solution class with Main method
 */
const wrapJavaCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  const parsedArgs = parseInputForLanguage('java', rawInput);
  
  // Common imports needed for LeetCode problems
  const imports = `import java.util.*;
import java.util.stream.*;
import java.lang.reflect.*;
`;

  // Check if user code already has a main method
  if (userCode.includes('public static void main')) {
    return imports + userCode;
  }
  
  // Check if user already has imports
  const hasImports = userCode.includes('import java');
  const codeWithImports = hasImports ? userCode : imports + userCode;
  
  // Wrap with main class if user only has Solution class
  if (userCode.includes('class Solution') && !userCode.includes('class Main')) {
    return `${imports}

${userCode}

class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            
            // Find and invoke the first public method (excluding Object methods)
            Method[] methods = Solution.class.getDeclaredMethods();
            Method targetMethod = null;
            for (Method m : methods) {
                if (Modifier.isPublic(m.getModifiers())) {
                    targetMethod = m;
                    break;
                }
            }
            
            if (targetMethod != null) {
                Object result = targetMethod.invoke(sol, ${parsedArgs});
                System.out.println(serializeOutput(result));
            }
        } catch (InvocationTargetException e) {
            System.err.println("Runtime Error: " + e.getCause().getClass().getSimpleName() + ": " + e.getCause().getMessage());
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
        }
    }
    
    static String serializeOutput(Object result) {
        if (result == null) return "null";
        if (result instanceof int[]) return Arrays.toString((int[]) result);
        if (result instanceof Integer[]) return Arrays.toString((Integer[]) result);
        if (result instanceof String[]) return Arrays.toString((String[]) result);
        if (result instanceof boolean[]) return Arrays.toString((boolean[]) result);
        if (result instanceof double[]) return Arrays.toString((double[]) result);
        if (result instanceof List) return result.toString();
        if (result instanceof Boolean) return ((Boolean) result) ? "true" : "false";
        if (result instanceof String) return "\\"" + result + "\\"";
        return result.toString();
    }
}
`;
  }
  
  return codeWithImports;
};

/**
 * C++ driver code - includes common headers and wraps Solution class
 */
const wrapCppCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  const parsedArgs = parseInputForLanguage('cpp', rawInput);
  
  // Common includes needed for LeetCode problems
  const includes = `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <algorithm>
#include <stack>
#include <queue>
#include <deque>
#include <climits>
#include <cmath>
#include <sstream>
using namespace std;
`;

  // Check if user already has includes
  const hasIncludes = userCode.includes('#include');
  const hasMain = userCode.includes('int main');
  
  if (hasMain) {
    return hasIncludes ? userCode : includes + userCode;
  }
  
  // Helper functions for output serialization
  const helpers = `
// --- Auto-generated helper functions ---
template<typename T>
void printVector(const vector<T>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        cout << v[i];
    }
    cout << "]";
}

template<>
void printVector(const vector<string>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        cout << "\\"" << v[i] << "\\"";
    }
    cout << "]";
}

template<typename T>
void printVector2D(const vector<vector<T>>& v) {
    cout << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) cout << ",";
        printVector(v[i]);
    }
    cout << "]";
}

void printResult(int r) { cout << r; }
void printResult(long long r) { cout << r; }
void printResult(double r) { cout << r; }
void printResult(bool r) { cout << (r ? "true" : "false"); }
void printResult(const string& r) { cout << "\\"" << r << "\\""; }
void printResult(const vector<int>& r) { printVector(r); }
void printResult(const vector<string>& r) { printVector(r); }
void printResult(const vector<vector<int>>& r) { printVector2D(r); }
void printResult(const vector<bool>& r) { 
    cout << "[";
    for (size_t i = 0; i < r.size(); i++) {
        if (i > 0) cout << ",";
        cout << (r[i] ? "true" : "false");
    }
    cout << "]";
}
`;

  const mainWrapper = `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    try {
        Solution sol;
        auto result = sol.${methodSignature?.name || 'solve'}(${parsedArgs});
        printResult(result);
        cout << endl;
    } catch (const exception& e) {
        cerr << "Runtime Error: " << e.what() << endl;
    }
    
    return 0;
}
`;

  // If we have method signature, use it directly
  if (methodSignature?.name) {
    return (hasIncludes ? '' : includes) + userCode + helpers + mainWrapper;
  }
  
  // Try to detect method name from Solution class
  const methodMatch = userCode.match(/(?:int|bool|string|vector<[^>]+>|void|double|long long)\s+(\w+)\s*\(/);
  const detectedMethod = methodMatch ? methodMatch[1] : 'solve';
  
  const dynamicMain = `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    try {
        Solution sol;
        auto result = sol.${detectedMethod}(${parsedArgs});
        printResult(result);
        cout << endl;
    } catch (const exception& e) {
        cerr << "Runtime Error: " << e.what() << endl;
    }
    
    return 0;
}
`;

  return (hasIncludes ? '' : includes) + userCode + helpers + dynamicMain;
};
