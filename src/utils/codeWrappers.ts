/**
 * LeetCode-style code wrappers for multi-language support
 * Automatically handles driver code injection for Python, Java, and C++
 * 
 * KEY FIXES:
 * - Java: Always inject ListNode/TreeNode since helpers reference them
 * - Java: Helpers placed after data structures to avoid forward references
 * - Design problems: Generates command-based driver code
 * - Interactive problems: Injects hidden API headers
 * - Advanced data structures: Supports Node_Graph, Node_Random, etc.
 */

import { parseRawInputWithTypes } from './inputParser';
import { 
  JAVA_DATA_STRUCTURES, 
  CPP_DATA_STRUCTURES,
  CPP_BUILDERS,
  CPP_HELPERS,
  PYTHON_DATA_STRUCTURES,
  hasDataStructure 
} from './dataStructures';
import { detectProblemType, parseDesignInput, isInteractiveProblem, generateHiddenHeader } from './problemTypes';
import { inferNodeVariant, needsNodeInjection } from './structureInference';
import { toPythonLiteral, toJavaLiteral, toCppLiteral } from './languageLiterals';

export type Language = 'python' | 'java' | 'cpp';

export interface MethodSignature {
  name: string;
  params: { name: string; type: string }[];
  returnType: string;
}

export interface ProblemContext {
  slug?: string;
  title?: string;
  tags?: string[];
  method_signature?: MethodSignature;
}

export interface TestCaseContext {
  input: string;
  output: string;
}

/**
 * Wraps user code with driver code for the specified language
 */
export const wrapCodeForExecution = (
  language: Language,
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature,
  problemContext?: ProblemContext,
  testCaseContext?: TestCaseContext
): string => {
  // Detect problem type
  const problemType = detectProblemType(rawInput);
  
  // Check for interactive problem
  const isInteractive = problemContext && isInteractiveProblem(
    problemContext.tags,
    problemContext.title
  );

  // Route to appropriate wrapper
  if (problemType === 'design') {
    return wrapDesignCode(language, userCode, rawInput);
  }
  
  if (isInteractive && testCaseContext) {
    return wrapInteractiveCode(language, userCode, rawInput, problemContext, testCaseContext);
  }
  
  // Standard algorithm problem
  switch (language) {
    case 'python':
      return wrapPythonCode(userCode, rawInput, methodSignature, problemContext);
    case 'java':
      return wrapJavaCode(userCode, rawInput, methodSignature, problemContext);
    case 'cpp':
      return wrapCppCode(userCode, rawInput, methodSignature, problemContext);
    default:
      return userCode;
  }
};

/**
 * Wrap code for design problems (LRU Cache, Trie, etc.)
 */
const wrapDesignCode = (
  language: Language,
  userCode: string,
  rawInput: string
): string => {
  const commands = parseDesignInput(rawInput);
  if (!commands || commands.length === 0) {
    // Fallback to algorithm wrapper if parsing fails
    return language === 'python' 
      ? wrapPythonCode(userCode, rawInput)
      : language === 'java'
        ? wrapJavaCode(userCode, rawInput)
        : wrapCppCode(userCode, rawInput);
  }

  const className = commands[0].method;

  if (language === 'python') {
    return wrapDesignPython(userCode, className, commands);
  } else if (language === 'java') {
    return wrapDesignJava(userCode, className, commands);
  } else {
    return wrapDesignCpp(userCode, className, commands);
  }
};

/**
 * Python design problem wrapper
 */
const wrapDesignPython = (
  userCode: string,
  className: string,
  commands: Array<{ method: string; args: any[]; isConstructor: boolean }>
): string => {
  let driverCode = `
# --- Design Problem Driver ---
results = []
`;

  // Constructor
  const constructorArgs = commands[0].args.map(toPythonLiteral).join(', ');
  driverCode += `obj = ${className}(${constructorArgs})\n`;
  driverCode += `results.append(None)\n`;

  // Method calls
  for (let i = 1; i < commands.length; i++) {
    const cmd = commands[i];
    const args = cmd.args.map(toPythonLiteral).join(', ');
    driverCode += `results.append(obj.${cmd.method}(${args}))\n`;
  }

  driverCode += `
def _format_result(r):
    if r is None:
        return "null"
    if isinstance(r, bool):
        return "true" if r else "false"
    if isinstance(r, list):
        return "[" + ",".join(_format_result(x) for x in r) + "]"
    return str(r)

print("[" + ",".join(_format_result(r) for r in results) + "]")
`;

  return `import sys
from typing import List, Optional, Dict, Any, Set
from collections import defaultdict, Counter, deque, OrderedDict
from heapq import heappush, heappop, heapify

${userCode}

${driverCode}`;
};

/**
 * Java design problem wrapper
 * CRITICAL: Main class MUST be first for Piston to run it correctly
 */
const wrapDesignJava = (
  userCode: string,
  className: string,
  commands: Array<{ method: string; args: any[]; isConstructor: boolean }>
): string => {
  // Sanitize user code: remove 'public' from class declarations
  const cleanedUserCode = sanitizeJavaCode(userCode);

  // Build driver code
  let driverStatements = '';
  
  // Constructor
  const constructorArgs = commands[0].args.map(v => toJavaLiteral(v)).join(', ');
  driverStatements += `            ${className} obj = new ${className}(${constructorArgs});\n`;
  driverStatements += `            results.add("null");\n`;

  // Method calls - use reflection for flexibility
  for (let i = 1; i < commands.length; i++) {
    const cmd = commands[i];
    const args = cmd.args.map(v => toJavaLiteral(v)).join(', ');
    driverStatements += `            try {\n`;
    driverStatements += `                Object res = obj.${cmd.method}(${args});\n`;
    driverStatements += `                results.add(formatValue(res));\n`;
    driverStatements += `            } catch (Exception e) {\n`;
    driverStatements += `                results.add("null");\n`;
    driverStatements += `            }\n`;
  }

  // Main class FIRST, then user code
  return `import java.util.*;
import java.util.stream.*;

public class Main {
    public static void main(String[] args) {
        try {
            List<String> results = new ArrayList<>();
${driverStatements}
            System.out.println("[" + String.join(",", results) + "]");
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
    
    static String formatValue(Object v) {
        if (v == null) return "null";
        if (v instanceof Boolean) return ((Boolean) v) ? "true" : "false";
        if (v instanceof int[]) return Arrays.toString((int[]) v).replace(" ", "");
        if (v instanceof List) {
            List<?> list = (List<?>) v;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append(formatValue(list.get(i)));
            }
            sb.append("]");
            return sb.toString();
        }
        if (v instanceof String) return "\\"" + v + "\\"";
        return v.toString();
    }
}

${cleanedUserCode}
`;
};

/**
 * C++ design problem wrapper
 */
const wrapDesignCpp = (
  userCode: string,
  className: string,
  commands: Array<{ method: string; args: any[]; isConstructor: boolean }>
): string => {
  let driverCode = `
int main() {
    vector<string> results;
`;

  // Constructor
  const constructorArgs = commands[0].args.map(toCppLiteral).join(', ');
  driverCode += `    ${className}* obj = new ${className}(${constructorArgs});\n`;
  driverCode += `    results.push_back("null");\n`;

  // Method calls
  for (let i = 1; i < commands.length; i++) {
    const cmd = commands[i];
    const args = cmd.args.map(toCppLiteral).join(', ');
    // Use stringstream for conversion
    driverCode += `    {\n`;
    driverCode += `        auto res = obj->${cmd.method}(${args});\n`;
    driverCode += `        stringstream ss;\n`;
    driverCode += `        formatValue(ss, res);\n`;
    driverCode += `        results.push_back(ss.str());\n`;
    driverCode += `    }\n`;
  }

  driverCode += `
    cout << "[";
    for (size_t i = 0; i < results.size(); i++) {
        if (i > 0) cout << ",";
        cout << results[i];
    }
    cout << "]" << endl;
    delete obj;
    return 0;
}
`;

  const includes = `#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <map>
#include <set>
#include <list>
#include <queue>
#include <stack>
#include <algorithm>
#include <sstream>
using namespace std;

template<typename T>
void formatValue(ostream& os, const T& v) { os << v; }
void formatValue(ostream& os, bool v) { os << (v ? "true" : "false"); }
void formatValue(ostream& os, const string& v) { os << "\\"" << v << "\\""; }
template<typename T>
void formatValue(ostream& os, const vector<T>& v) {
    os << "[";
    for (size_t i = 0; i < v.size(); i++) {
        if (i > 0) os << ",";
        formatValue(os, v[i]);
    }
    os << "]";
}
// Handle void returns as "null"
struct NullType {};
void formatValue(ostream& os, NullType) { os << "null"; }

`;

  return includes + userCode + '\n' + driverCode;
};

/**
 * Wrap code for interactive problems (First Bad Version, Guess Number, etc.)
 */
const wrapInteractiveCode = (
  language: Language,
  userCode: string,
  rawInput: string,
  problemContext: ProblemContext,
  testCaseContext: TestCaseContext
): string => {
  // Determine problem type from slug/title
  const problemType = problemContext.slug || problemContext.title?.toLowerCase().replace(/\s+/g, '_') || '';
  
  // Generate hidden header
  const hiddenHeader = generateHiddenHeader(problemType, testCaseContext, language);
  
  if (language === 'python') {
    return wrapInteractivePython(userCode, rawInput, hiddenHeader);
  } else if (language === 'java') {
    return wrapInteractiveJava(userCode, rawInput, hiddenHeader, problemType);
  } else {
    return wrapInteractiveCpp(userCode, rawInput, hiddenHeader);
  }
};

/**
 * Python interactive problem wrapper
 */
const wrapInteractivePython = (
  userCode: string,
  rawInput: string,
  hiddenHeader: string | null
): string => {
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // For interactive problems, first param is usually n (range)
  const nValue = parsedParams.length > 0 ? parsedParams[0].value : '1';

  return `import sys
from typing import List, Optional

${hiddenHeader || ''}

${userCode}

# --- Driver Code ---
try:
    sol = Solution()
    result = sol.firstBadVersion(${nValue}) if hasattr(sol, 'firstBadVersion') else sol.guessNumber(${nValue})
    print(result)
except Exception as e:
    print(f"Runtime Error: {e}", file=sys.stderr)
`;
};

/**
 * Java interactive problem wrapper
 * CRITICAL: Main class FIRST, then hidden API, then user code
 */
const wrapInteractiveJava = (
  userCode: string,
  rawInput: string,
  hiddenHeader: string | null,
  problemType: string
): string => {
  const parsedParams = parseRawInputWithTypes(rawInput);
  const nValue = parsedParams.length > 0 ? parsedParams[0].value : '1';

  // Determine which method to call
  let methodCall = 'firstBadVersion';
  if (problemType.includes('guess')) {
    methodCall = 'guessNumber';
  }

  // Sanitize user code - remove 'public' from Solution class
  // Also handle extends (e.g., Solution extends VersionControl)
  let cleanedUserCode = userCode
    .replace(/public\s+class\s+Solution/g, 'class Solution')
    .replace(/public\s+interface\s+/g, 'interface ')
    .replace(/public\s+enum\s+/g, 'enum ');

  // Main class FIRST
  return `import java.util.*;

public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            int result = sol.${methodCall}(${nValue});
            System.out.println(result);
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
}

${hiddenHeader || ''}

${cleanedUserCode}
`;
};

/**
 * C++ interactive problem wrapper
 */
const wrapInteractiveCpp = (
  userCode: string,
  rawInput: string,
  hiddenHeader: string | null
): string => {
  const parsedParams = parseRawInputWithTypes(rawInput);
  const nValue = parsedParams.length > 0 ? parsedParams[0].value : '1';

  return `#include <iostream>
using namespace std;

${hiddenHeader || ''}

${userCode}

int main() {
    Solution sol;
    // Try both methods
    #ifdef FIRST_BAD_VERSION
    cout << sol.firstBadVersion(${nValue}) << endl;
    #else
    cout << sol.guessNumber(${nValue}) << endl;
    #endif
    return 0;
}
`;
};

/**
 * Sanitize Java user code - remove 'public' from class declarations
 * to allow compilation in Main.java file
 */
const sanitizeJavaCode = (code: string): string => {
  return code
    .replace(/public\s+class\s+(?!Main\b)/g, 'class ')
    .replace(/public\s+interface\s+/g, 'interface ')
    .replace(/public\s+enum\s+/g, 'enum ');
};

/**
 * Parse method signature from code to detect parameter types
 */
const parseMethodParams = (code: string, language: Language): { name: string; type: string }[] => {
  const params: { name: string; type: string }[] = [];
  
  if (language === 'java') {
    const match = code.match(/public\s+(?:static\s+)?[\w<>\[\]]+\s+\w+\s*\(([^)]*)\)/);
    if (match && match[1]) {
      const paramStr = match[1].trim();
      if (paramStr) {
        const paramParts = paramStr.split(/,\s*/);
        for (const part of paramParts) {
          const paramMatch = part.trim().match(/([\w<>\[\]\*]+)\s+(\w+)/);
          if (paramMatch) {
            params.push({ type: paramMatch[1], name: paramMatch[2] });
          }
        }
      }
    }
  } else if (language === 'cpp') {
    const methodPatterns = [
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/,
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)/
    ];
    
    for (const pattern of methodPatterns) {
      const match = code.match(pattern);
      if (match && match[2]) {
        const paramStr = match[2].trim();
        if (paramStr) {
          let depth = 0;
          let current = '';
          const paramParts: string[] = [];
          
          for (const char of paramStr) {
            if (char === '<') depth++;
            else if (char === '>') depth--;
            else if (char === ',' && depth === 0) {
              paramParts.push(current.trim());
              current = '';
              continue;
            }
            current += char;
          }
          if (current.trim()) paramParts.push(current.trim());
          
          for (const part of paramParts) {
            const paramMatch = part.trim().match(/(.*?)\s+(\w+)\s*$/);
            if (paramMatch) {
              params.push({ type: paramMatch[1].trim(), name: paramMatch[2] });
            }
          }
        }
        break;
      }
    }
  }
  
  return params;
};

/**
 * Get required data structures for injection
 * CRITICAL FIX for Java: Always inject ListNode and TreeNode since the helper methods reference them
 */
const getDataStructuresToInject = (
  userCode: string,
  language: Language,
  problemContext?: ProblemContext,
  forceBasicStructures: boolean = false
): string => {
  let structures = '';
  
  // For Java, ALWAYS inject ListNode and TreeNode since JAVA_BUILDERS and JAVA_SERIALIZER reference them
  const alwaysInjectForJava = language === 'java';
  
  // Check standard structures
  const needsListNode = forceBasicStructures || alwaysInjectForJava || 
    (userCode.includes('ListNode') && !hasDataStructure(userCode, 'ListNode'));
  const needsTreeNode = forceBasicStructures || alwaysInjectForJava ||
    (userCode.includes('TreeNode') && !hasDataStructure(userCode, 'TreeNode'));
  
  // Check for Node variants
  const nodeVariant = needsNodeInjection(userCode) 
    ? inferNodeVariant(problemContext?.slug, problemContext?.tags, userCode)
    : null;

  if (language === 'python') {
    if (needsListNode && !hasDataStructure(userCode, 'ListNode')) {
      structures += PYTHON_DATA_STRUCTURES.ListNode + '\n\n';
    }
    if (needsTreeNode && !hasDataStructure(userCode, 'TreeNode')) {
      structures += PYTHON_DATA_STRUCTURES.TreeNode + '\n\n';
    }
    if (nodeVariant) structures += PYTHON_DATA_STRUCTURES[nodeVariant] + '\n\n';
  } else if (language === 'java') {
    // Always inject for Java unless user defined them
    if (!hasDataStructure(userCode, 'ListNode')) {
      structures += JAVA_DATA_STRUCTURES.ListNode + '\n\n';
    }
    if (!hasDataStructure(userCode, 'TreeNode')) {
      structures += JAVA_DATA_STRUCTURES.TreeNode + '\n\n';
    }
    if (nodeVariant && !hasDataStructure(userCode, 'Node')) {
      structures += JAVA_DATA_STRUCTURES[nodeVariant] + '\n\n';
    }
  } else if (language === 'cpp') {
    if (needsListNode && !hasDataStructure(userCode, 'ListNode')) {
      structures += CPP_DATA_STRUCTURES.ListNode + '\n\n';
    }
    if (needsTreeNode && !hasDataStructure(userCode, 'TreeNode')) {
      structures += CPP_DATA_STRUCTURES.TreeNode + '\n\n';
    }
    if (nodeVariant) structures += CPP_DATA_STRUCTURES[nodeVariant] + '\n\n';
  }

  return structures;
};

/**
 * Python driver code - handles Solution class and function calls
 */
const wrapPythonCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature,
  problemContext?: ProblemContext
): string => {
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  const args = parsedParams.map(param => {
    if (param.type === 'linkedlist') return `_build_list(${param.value})`;
    if (param.type === 'tree') return `_build_tree(${param.value})`;
    if (param.type === 'null') return 'None';
    if (param.type === 'boolean') return param.value.toLowerCase() === 'true' ? 'True' : 'False';
    return param.value;
  }).join(', ');

  const dataStructures = getDataStructuresToInject(userCode, 'python', problemContext);

  return `# --- Auto-generated imports and type definitions ---
import sys
import json
from typing import List, Optional, Dict, Tuple, Any, Set
from collections import defaultdict, Counter, deque
from heapq import heappush, heappop, heapify
from functools import lru_cache, reduce
from itertools import permutations, combinations, product
from bisect import bisect_left, bisect_right
import math
import re

${dataStructures}

def _build_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head

def _build_tree(arr):
    if not arr or arr[0] is None: return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while queue and i < len(arr):
        node = queue.pop(0)
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root

def _list_to_arr(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result

def _tree_to_arr(root):
    if not root: return []
    result = []
    queue = [root]
    while queue:
        node = queue.pop(0)
        if node:
            result.append(node.val)
            queue.append(node.left)
            queue.append(node.right)
        else:
            result.append(None)
    while result and result[-1] is None:
        result.pop()
    return result

def _serialize_output(result):
    if result is None:
        return "null"
    if isinstance(result, bool):
        return "true" if result else "false"
    if hasattr(result, 'val') and hasattr(result, 'next'):
        return json.dumps(_list_to_arr(result))
    if hasattr(result, 'val') and hasattr(result, 'left'):
        return json.dumps(_tree_to_arr(result))
    if isinstance(result, (list, tuple)):
        return json.dumps(result)
    if isinstance(result, str):
        return f'"{result}"'
    return str(result)

# --- User's Solution Code ---
${userCode}

# --- Auto-generated Driver Code ---
try:
    if 'Solution' in dir():
        sol = Solution()
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
            result = method(${args})
            print(_serialize_output(result))
    else:
        import types
        funcs = [name for name, obj in list(locals().items()) 
                 if isinstance(obj, types.FunctionType) 
                 and not name.startswith('_')]
        if funcs:
            func = locals()[funcs[-1]]
            result = func(${args})
            print(_serialize_output(result))
except Exception as e:
    import traceback
    print(f"Runtime Error: {type(e).__name__}: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
`;
};

/**
 * Java helper methods - defined as static methods
 * These must be placed AFTER data structure definitions
 */
const getJavaHelpers = (): string => {
  return `
    static ListNode buildList(int[] arr) {
        if (arr == null || arr.length == 0) return null;
        ListNode head = new ListNode(arr[0]);
        ListNode curr = head;
        for (int i = 1; i < arr.length; i++) {
            curr.next = new ListNode(arr[i]);
            curr = curr.next;
        }
        return head;
    }
    
    static String listToString(ListNode head) {
        StringBuilder sb = new StringBuilder("[");
        while (head != null) {
            sb.append(head.val);
            if (head.next != null) sb.append(",");
            head = head.next;
        }
        sb.append("]");
        return sb.toString();
    }
    
    static TreeNode buildTree(Integer[] arr) {
        if (arr == null || arr.length == 0 || arr[0] == null) return null;
        TreeNode root = new TreeNode(arr[0]);
        Queue<TreeNode> queue = new LinkedList<>();
        queue.offer(root);
        int i = 1;
        while (!queue.isEmpty() && i < arr.length) {
            TreeNode node = queue.poll();
            if (i < arr.length && arr[i] != null) {
                node.left = new TreeNode(arr[i]);
                queue.offer(node.left);
            }
            i++;
            if (i < arr.length && arr[i] != null) {
                node.right = new TreeNode(arr[i]);
                queue.offer(node.right);
            }
            i++;
        }
        return root;
    }

    static String serializeOutput(Object result) {
        if (result == null) return "null";
        if (result instanceof int[]) return Arrays.toString((int[]) result).replace(" ", "");
        if (result instanceof Integer[]) return Arrays.toString((Integer[]) result).replace(" ", "");
        if (result instanceof String[]) {
            String[] arr = (String[]) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append("\\"").append(arr[i]).append("\\"");
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof boolean[]) return Arrays.toString((boolean[]) result).replace(" ", "");
        if (result instanceof double[]) return Arrays.toString((double[]) result).replace(" ", "");
        if (result instanceof int[][]) {
            int[][] arr = (int[][]) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < arr.length; i++) {
                sb.append(Arrays.toString(arr[i]).replace(" ", ""));
                if (i < arr.length - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof ListNode) return listToString((ListNode) result);
        if (result instanceof List) {
            List<?> list = (List<?>) result;
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < list.size(); i++) {
                Object item = list.get(i);
                if (item instanceof String) {
                    sb.append("\\"").append(item).append("\\"");
                } else if (item instanceof List) {
                    sb.append(serializeOutput(item));
                } else {
                    sb.append(item);
                }
                if (i < list.size() - 1) sb.append(",");
            }
            sb.append("]");
            return sb.toString();
        }
        if (result instanceof Boolean) return ((Boolean) result) ? "true" : "false";
        if (result instanceof String) return "\\"" + result + "\\"";
        return result.toString();
    }`;
};

/**
 * Java driver code - wraps Solution class with Main method
 * CRITICAL FIX: 
 * 1. Data structures defined BEFORE Main class so helpers can reference them
 * 2. ListNode and TreeNode ALWAYS injected since helpers reference them
 */
const wrapJavaCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature,
  problemContext?: ProblemContext
): string => {
  const methodParams = parseMethodParams(userCode, 'java');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Check if user already has main
  if (userCode.includes('public static void main')) {
    if (!userCode.includes('import java')) {
      return `import java.util.*;
import java.util.stream.*;

${userCode}`;
    }
    return userCode;
  }
  
  // Strip user imports - we'll put them at top
  const userImportMatch = userCode.match(/^((?:import\s+[\w.*]+;\s*)+)/m);
  let userImports = '';
  let cleanedUserCode = userCode;
  
  if (userImportMatch) {
    userImports = userImportMatch[1];
    cleanedUserCode = userCode.replace(userImportMatch[0], '').trim();
  }
  
  // Sanitize: remove 'public' from non-Main classes
  cleanedUserCode = sanitizeJavaCode(cleanedUserCode);
  
  // Get data structures - ALWAYS inject for Java
  const dataStructures = getDataStructuresToInject(userCode, 'java', problemContext, true);
  
  // Detect method name
  const methodPatterns = [
    /public\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)/,
    /(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
  ];
  
  let detectedMethod = 'solve';
  let returnType = 'Object';
  
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match) {
      returnType = match[1];
      detectedMethod = match[2];
      if (detectedMethod !== 'Solution' && detectedMethod !== 'main') {
        break;
      }
    }
  }
  
  // Build call arguments
  const buildCallArgs = () => {
    const callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      
      if (methodParam && methodParam.type.includes('ListNode')) {
        if (param.type === 'array' || param.type === 'linkedlist') {
          try {
            const arr = JSON.parse(param.value);
            callArgs.push(`buildList(new int[]{${arr.join(', ')}})`);
          } catch {
            callArgs.push(`buildList(new int[]{})`);
          }
        } else {
          callArgs.push('null');
        }
      } else if (methodParam && methodParam.type.includes('TreeNode')) {
        if (param.type === 'array' || param.type === 'tree') {
          try {
            const arr = JSON.parse(param.value);
            const intArr = arr.map((v: any) => v === null ? 'null' : v);
            callArgs.push(`buildTree(new Integer[]{${intArr.join(', ')}})`);
          } catch {
            callArgs.push('null');
          }
        } else {
          callArgs.push('null');
        }
      } else if (param.type === 'linkedlist') {
        try {
          const arr = JSON.parse(param.value);
          callArgs.push(`buildList(new int[]{${arr.join(', ')}})`);
        } catch {
          callArgs.push(`buildList(new int[]{})`);
        }
      } else if (param.type === 'tree') {
        try {
          const arr = JSON.parse(param.value);
          const intArr = arr.map((v: any) => v === null ? 'null' : v);
          callArgs.push(`buildTree(new Integer[]{${intArr.join(', ')}})`);
        } catch {
          callArgs.push('null');
        }
      } else if (param.type === 'array') {
        try {
          const arr = JSON.parse(param.value);
          if (arr.length === 0) {
            callArgs.push('new int[]{}');
          } else if (typeof arr[0] === 'number') {
            callArgs.push(`new int[]{${arr.join(', ')}}`);
          } else if (typeof arr[0] === 'string') {
            callArgs.push(`new String[]{${arr.map((s: string) => `"${s}"`).join(', ')}}`);
          } else {
            callArgs.push(`new int[]{${arr.join(', ')}}`);
          }
        } catch {
          callArgs.push(param.value);
        }
      } else if (param.type === 'array2d') {
        try {
          const arr = JSON.parse(param.value);
          const inner = arr.map((row: any[]) => `{${row.join(', ')}}`).join(', ');
          callArgs.push(`new int[][]{${inner}}`);
        } catch {
          callArgs.push(param.value);
        }
      } else if (param.type === 'string') {
        const unquoted = param.value.replace(/^['"]|['"]$/g, '');
        callArgs.push(`"${unquoted}"`);
      } else if (param.type === 'boolean') {
        callArgs.push(param.value.toLowerCase());
      } else if (param.type === 'null') {
        callArgs.push('null');
      } else {
        callArgs.push(param.value);
      }
    }
    
    return callArgs.join(', ');
  };
  
  const callArgs = buildCallArgs();
  
  // CRITICAL FIX: Data structures FIRST, then Main class with helpers
  // This ensures ListNode and TreeNode are defined before helpers reference them
  return `import java.util.*;
import java.util.stream.*;
import java.util.function.*;
import java.math.*;
${userImports}

// --- Data Structures ---
${dataStructures}

// --- User Solution ---
${cleanedUserCode}

// --- Main Driver ---
public class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            ${returnType} result = sol.${detectedMethod}(${callArgs});
            System.out.println(serializeOutput(result));
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
${getJavaHelpers()}
}
`;
};

/**
 * C++ driver code - includes common headers and wraps Solution class
 */
const wrapCppCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature,
  problemContext?: ProblemContext
): string => {
  const methodParams = parseMethodParams(userCode, 'cpp');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
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
#include <numeric>
#include <functional>
#include <bitset>
using namespace std;
`;

  const hasIncludes = userCode.includes('#include');
  const hasMain = userCode.includes('int main');
  
  if (hasMain) {
    return hasIncludes ? userCode : includes + userCode;
  }
  
  const dataStructures = getDataStructuresToInject(userCode, 'cpp', problemContext);
  
  // Detect method name
  const methodPatterns = [
    /(?:const\s+)?(?:static\s+)?(?:(?:vector|list|set|map|unordered_map|unordered_set|pair|tuple|optional|queue|stack|deque|priority_queue)\s*<[^>]*(?:<[^>]*>)?[^>]*>\s*\*?\s*&?\s*)(\w+)\s*\(/,
    /(?:const\s+)?(?:static\s+)?(?:ListNode|TreeNode|Node)\s*\*\s*(\w+)\s*\(/,
    /(?:const\s+)?(?:static\s+)?(?:int|long\s+long|double|float|bool|char|string|void|size_t|unsigned)\s+(\w+)\s*\(/,
    /(?:public|private|protected)?\s*(?:const\s+)?(?:static\s+)?[\w:<>,\s*&]+\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*\{/
  ];

  let detectedMethod = methodSignature?.name || 'solve';
  
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match && match[1]) {
      const methodName = match[1];
      if (methodName !== 'Solution' && methodName !== 'main' && !methodName.startsWith('_')) {
        detectedMethod = methodName;
        break;
      }
    }
  }

  // Generate main with proper variable declarations
  const generateCppMainWithDeclarations = () => {
    let declarations = '';
    let callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      const varName = `arg${i}`;
      
      if (methodParam && (methodParam.type.includes('ListNode*') || methodParam.type.includes('ListNode *'))) {
        if (param.type === 'array' || param.type === 'linkedlist') {
          try {
            const arr = JSON.parse(param.value);
            declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
            declarations += `    ListNode* ${varName} = buildList(${varName}_arr);\n`;
            callArgs.push(varName);
          } catch {
            declarations += `    ListNode* ${varName} = nullptr;\n`;
            callArgs.push(varName);
          }
        } else {
          declarations += `    ListNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (methodParam && (methodParam.type.includes('TreeNode*') || methodParam.type.includes('TreeNode *'))) {
        if (param.type === 'array' || param.type === 'tree') {
          try {
            const arr = JSON.parse(param.value);
            declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
            declarations += `    TreeNode* ${varName} = buildTree(${varName}_arr);\n`;
            callArgs.push(varName);
          } catch {
            declarations += `    TreeNode* ${varName} = nullptr;\n`;
            callArgs.push(varName);
          }
        } else {
          declarations += `    TreeNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'linkedlist') {
        try {
          const arr = JSON.parse(param.value);
          declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
          declarations += `    ListNode* ${varName} = buildList(${varName}_arr);\n`;
          callArgs.push(varName);
        } catch {
          declarations += `    ListNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'tree') {
        try {
          const arr = JSON.parse(param.value);
          declarations += `    vector<int> ${varName}_arr = {${arr.join(', ')}};\n`;
          declarations += `    TreeNode* ${varName} = buildTree(${varName}_arr);\n`;
          callArgs.push(varName);
        } catch {
          declarations += `    TreeNode* ${varName} = nullptr;\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'array' || param.type === 'array2d') {
        try {
          const arr = JSON.parse(param.value);
          if (Array.isArray(arr[0])) {
            const inner = arr.map((row: any[]) => `{${row.join(', ')}}`).join(', ');
            declarations += `    vector<vector<int>> ${varName} = {${inner}};\n`;
          } else if (typeof arr[0] === 'string') {
            declarations += `    vector<string> ${varName} = {${arr.map((s: string) => `"${s}"`).join(', ')}};\n`;
          } else {
            declarations += `    vector<int> ${varName} = {${arr.join(', ')}};\n`;
          }
          callArgs.push(varName);
        } catch {
          declarations += `    auto ${varName} = ${param.value};\n`;
          callArgs.push(varName);
        }
      } else if (param.type === 'string') {
        const unquoted = param.value.replace(/^['"]|['"]$/g, '');
        declarations += `    string ${varName} = "${unquoted}";\n`;
        callArgs.push(varName);
      } else if (param.type === 'null') {
        declarations += `    auto ${varName} = nullptr;\n`;
        callArgs.push(varName);
      } else {
        callArgs.push(param.value);
      }
    }
    
    return `
int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    try {
        Solution sol;
${declarations}        auto result = sol.${detectedMethod}(${callArgs.join(', ')});
        printResult(result);
        cout << endl;
    } catch (const exception& e) {
        cerr << "Runtime Error: " << e.what() << endl;
    }
    
    return 0;
}
`;
  };

  const mainWrapper = generateCppMainWithDeclarations();
  
  // Include builders only if we added structs
  let builders = '';
  if (dataStructures.includes('ListNode') || dataStructures.includes('TreeNode')) {
    builders = CPP_BUILDERS + '\n';
  }

  return (hasIncludes ? '' : includes) + '\n// --- Data Structures ---\n' + dataStructures + builders + userCode + '\n' + CPP_HELPERS + mainWrapper;
};
