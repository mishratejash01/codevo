/**
 * LeetCode-style code wrappers for multi-language support
 * Automatically handles driver code injection for Python, Java, and C++
 * 
 * FIXED ISSUES:
 * - Java: Imports placed at very top, before any class definitions
 * - Java: Added Arrays import for serialization
 * - C++: Prevent struct redefinition when starter code has them
 * - Python: Type definitions placed before user code
 */

import { parseRawInputWithTypes } from './inputParser';
import { 
  JAVA_DATA_STRUCTURES, 
  JAVA_BUILDERS, 
  JAVA_SERIALIZER,
  CPP_DATA_STRUCTURES,
  CPP_BUILDERS,
  CPP_HELPERS,
  hasDataStructure 
} from './dataStructures';

export type Language = 'python' | 'java' | 'cpp';

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
    case 'java':
      return wrapJavaCode(userCode, rawInput, methodSignature);
    case 'cpp':
      return wrapCppCode(userCode, rawInput, methodSignature);
    default:
      return userCode;
  }
};

/**
 * Parse method signature from code to detect parameter types
 */
const parseMethodParams = (code: string, language: Language): { name: string; type: string }[] => {
  const params: { name: string; type: string }[] = [];
  
  if (language === 'java') {
    // Match Java method: public ReturnType methodName(Type1 param1, Type2 param2)
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
    // Match C++ method - handles complex types like vector<int>&, ListNode*, etc.
    const methodPatterns = [
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)\s*(?:const)?\s*\{/,
      /(?:const\s+)?(?:static\s+)?[\w<>:*&\s]+\s+(\w+)\s*\(([^)]*)\)/
    ];
    
    for (const pattern of methodPatterns) {
      const match = code.match(pattern);
      if (match && match[2]) {
        const paramStr = match[2].trim();
        if (paramStr) {
          // Split by comma, but be careful of template commas
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
            // Handle patterns like: vector<int>& nums, ListNode* l1, int target
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
 * Python driver code - handles Solution class and function calls
 * FIXED: Type definitions and imports come BEFORE user code
 */
const wrapPythonCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Get parsed parameters with type info to detect ListNode/TreeNode usage
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Build arguments, converting linkedlist/tree types to builders
  const args = parsedParams.map(param => {
    if (param.type === 'linkedlist') {
      return `_build_list(${param.value})`;
    }
    if (param.type === 'tree') {
      return `_build_tree(${param.value})`;
    }
    if (param.type === 'null') return 'None';
    if (param.type === 'boolean') {
      return param.value.toLowerCase() === 'true' ? 'True' : 'False';
    }
    return param.value;
  }).join(', ');

  // Check if user code already has ListNode/TreeNode definitions
  const hasListNode = hasDataStructure(userCode, 'ListNode');
  const hasTreeNode = hasDataStructure(userCode, 'TreeNode');

  // Build data structure definitions (only if not already present)
  let dataStructures = '';
  if (!hasListNode) {
    dataStructures += `
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next
`;
  }
  if (!hasTreeNode) {
    dataStructures += `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right
`;
  }

  // IMPORTANT: Imports and class definitions MUST come BEFORE user code
  // so that type hints like Optional[ListNode] are valid when parsed
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
    """Convert result to LeetCode-style output format"""
    if result is None:
        return "null"
    if isinstance(result, bool):
        return "true" if result else "false"
    if isinstance(result, ListNode):
        return json.dumps(_list_to_arr(result))
    if isinstance(result, TreeNode):
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
    # Try Solution class first (LeetCode style)
    if 'Solution' in dir():
        sol = Solution()
        # Find the first non-dunder method
        methods = [m for m in dir(sol) if not m.startswith('_') and callable(getattr(sol, m))]
        if methods:
            method = getattr(sol, methods[0])
            result = method(${args})
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
            result = func(${args})
            print(_serialize_output(result))
except Exception as e:
    import traceback
    print(f"Runtime Error: {type(e).__name__}: {e}", file=sys.stderr)
    traceback.print_exc(file=sys.stderr)
`;
};

/**
 * Java driver code - wraps Solution class with Main method
 * FIXED: Proper import ordering - imports MUST be at the very top
 * FIXED: Added Arrays import for serialization
 * FIXED: Data structure definitions after imports, before user code
 */
const wrapJavaCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Parse the method parameters to detect ListNode/TreeNode types
  const methodParams = parseMethodParams(userCode, 'java');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
  // Check if user code already has a main method
  if (userCode.includes('public static void main')) {
    // User has their own main, just add imports if missing
    if (!userCode.includes('import java')) {
      return `import java.util.*;
import java.util.stream.*;

${userCode}`;
    }
    return userCode;
  }
  
  // Check if user already has imports - we'll strip them and put them at top
  const userImportMatch = userCode.match(/^((?:import\s+[\w.*]+;\s*)+)/m);
  let userImports = '';
  let cleanedUserCode = userCode;
  
  if (userImportMatch) {
    userImports = userImportMatch[1];
    cleanedUserCode = userCode.replace(userImportMatch[0], '').trim();
  }
  
  // Check if user code already has ListNode/TreeNode definitions
  const hasListNode = hasDataStructure(userCode, 'ListNode');
  const hasTreeNode = hasDataStructure(userCode, 'TreeNode');
  
  // Detect the method name and signature from user code
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
  
  // Build call arguments, checking if method expects ListNode/TreeNode
  const buildCallArgs = () => {
    const callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      
      // Check if the method parameter type is ListNode
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
        // TreeNode handling
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
        // Detected as linkedlist by name
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
  
  // Build data structures section (only if not already present)
  let dataStructures = '';
  if (!hasListNode) {
    dataStructures += JAVA_DATA_STRUCTURES.ListNode + '\n\n';
  }
  if (!hasTreeNode) {
    dataStructures += JAVA_DATA_STRUCTURES.TreeNode + '\n\n';
  }
  
  // Wrap with main class if user only has Solution class
  if (userCode.includes('class Solution') && !userCode.includes('class Main')) {
    const callArgs = buildCallArgs();
    
    // CRITICAL: Imports MUST be at the very top of the file
    // Order: 1. Imports, 2. Data structures, 3. User's Solution, 4. Main wrapper
    return `import java.util.*;
import java.util.stream.*;
import java.util.function.*;
import java.math.*;
${userImports}

${dataStructures}
${cleanedUserCode}

class Main {
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
${JAVA_BUILDERS}
${JAVA_SERIALIZER}
}
`;
  }
  
  // User doesn't have Solution class, just wrap with imports
  return `import java.util.*;
import java.util.stream.*;
${userImports}

${dataStructures}
${cleanedUserCode}`;
};

/**
 * C++ driver code - includes common headers and wraps Solution class
 * FIXED: Prevent struct redefinition when user code already has them
 * FIXED: Better handling of ListNode* parameters
 */
const wrapCppCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // Parse the method parameters to detect ListNode*/TreeNode* types
  const methodParams = parseMethodParams(userCode, 'cpp');
  const parsedParams = parseRawInputWithTypes(rawInput);
  
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
#include <numeric>
#include <functional>
#include <bitset>
using namespace std;
`;

  // Check if user already has includes
  const hasIncludes = userCode.includes('#include');
  const hasMain = userCode.includes('int main');
  
  if (hasMain) {
    return hasIncludes ? userCode : includes + userCode;
  }
  
  // Check if user code already has ListNode/TreeNode definitions
  // This prevents redefinition errors
  const hasListNode = hasDataStructure(userCode, 'ListNode');
  const hasTreeNode = hasDataStructure(userCode, 'TreeNode');
  
  // Build data structures section (only if not already present)
  let dataStructures = '\n// --- Data Structures ---\n';
  if (!hasListNode) {
    dataStructures += CPP_DATA_STRUCTURES.ListNode + '\n\n';
  }
  if (!hasTreeNode) {
    dataStructures += CPP_DATA_STRUCTURES.TreeNode + '\n\n';
  }
  
  // Only add builders if we added the structs
  if (!hasListNode || !hasTreeNode) {
    dataStructures += CPP_BUILDERS + '\n';
  }

  // Detect method name from Solution class using improved regex
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

  // Generate main with proper variable declarations, handling ListNode* params
  const generateCppMainWithDeclarations = () => {
    let declarations = '';
    let callArgs: string[] = [];
    
    for (let i = 0; i < parsedParams.length; i++) {
      const param = parsedParams[i];
      const methodParam = methodParams[i];
      const varName = `arg${i}`;
      
      // Check if method expects ListNode*
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
        // Detected as linkedlist by name
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
            // 2D array
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
        // Number, boolean, or other primitive
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

  return (hasIncludes ? '' : includes) + dataStructures + userCode + '\n' + CPP_HELPERS + mainWrapper;
};
