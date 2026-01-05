/**
 * LeetCode-style code wrappers for multi-language support
 * Automatically handles driver code injection for Python, JavaScript, TypeScript, Java, and C++
 */

import { parseInputForLanguage } from './inputParser';

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
from typing import List, Optional, Dict, Tuple, Any, Set

# ListNode and TreeNode helpers for common LeetCode problems
class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

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
  const parsedArgs = parseInputForLanguage('python', rawInput); // Use python parsing as fallback
  
  return `${userCode}

// --- Auto-generated Driver Code ---

// ListNode and TreeNode helpers
function ListNode(val, next) {
  this.val = (val===undefined ? 0 : val);
  this.next = (next===undefined ? null : next);
}

function TreeNode(val, left, right) {
  this.val = (val===undefined ? 0 : val);
  this.left = (left===undefined ? null : left);
  this.right = (right===undefined ? null : right);
}

function _buildList(arr) {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function _buildTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i]);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i]);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

function _listToArr(head) {
  const result = [];
  while (head) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function _treeToArr(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node) {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      result.push(null);
    }
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function _serializeOutput(result) {
  if (result === null || result === undefined) return "null";
  if (typeof result === "boolean") return result ? "true" : "false";
  if (result instanceof ListNode) return JSON.stringify(_listToArr(result));
  if (result instanceof TreeNode) return JSON.stringify(_treeToArr(result));
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
               !['require', 'console', 'process', 'Buffer', 'ListNode', 'TreeNode'].includes(key);
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
 * TypeScript driver code - similar to JavaScript but uses TypeScript syntax
 */
const wrapTypeScriptCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  const parsedArgs = parseInputForLanguage('python', rawInput); // Use python parsing as fallback
  
  return `${userCode}

// --- Auto-generated Driver Code ---

class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.next = (next===undefined ? null : next);
  }
}

class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val?: number, left?: TreeNode | null, right?: TreeNode | null) {
    this.val = (val===undefined ? 0 : val);
    this.left = (left===undefined ? null : left);
    this.right = (right===undefined ? null : right);
  }
}

function _buildList(arr: number[]): ListNode | null {
  if (!arr || arr.length === 0) return null;
  const head = new ListNode(arr[0]);
  let curr = head;
  for (let i = 1; i < arr.length; i++) {
    curr.next = new ListNode(arr[i]);
    curr = curr.next;
  }
  return head;
}

function _buildTree(arr: (number | null)[]): TreeNode | null {
  if (!arr || arr.length === 0 || arr[0] === null) return null;
  const root = new TreeNode(arr[0]);
  const queue: TreeNode[] = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift()!;
    if (i < arr.length && arr[i] !== null) {
      node.left = new TreeNode(arr[i] as number);
      queue.push(node.left);
    }
    i++;
    if (i < arr.length && arr[i] !== null) {
      node.right = new TreeNode(arr[i] as number);
      queue.push(node.right);
    }
    i++;
  }
  return root;
}

function _listToArr(head: ListNode | null): number[] {
  const result: number[] = [];
  while (head) {
    result.push(head.val);
    head = head.next;
  }
  return result;
}

function _treeToArr(root: TreeNode | null): (number | null)[] {
  if (!root) return [];
  const result: (number | null)[] = [];
  const queue: (TreeNode | null)[] = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node) {
      result.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    } else {
      result.push(null);
    }
  }
  while (result.length > 0 && result[result.length - 1] === null) {
    result.pop();
  }
  return result;
}

function _serializeOutput(result: any): string {
  if (result === null || result === undefined) return "null";
  if (typeof result === "boolean") return result ? "true" : "false";
  if (result instanceof ListNode) return JSON.stringify(_listToArr(result));
  if (result instanceof TreeNode) return JSON.stringify(_treeToArr(result));
  if (Array.isArray(result)) return JSON.stringify(result);
  if (typeof result === "object") return JSON.stringify(result);
  if (typeof result === "string") return '"' + result + '"';
  return String(result);
}

try {
  let result: any;
  // Try Solution class first (LeetCode style)
  if (typeof Solution !== 'undefined') {
    const sol = new Solution();
    const methodNames = Object.getOwnPropertyNames(Object.getPrototypeOf(sol))
      .filter(m => m !== 'constructor' && typeof (sol as any)[m] === 'function');
    if (methodNames.length > 0) {
      result = (sol as any)[methodNames[0]](${parsedArgs});
    }
  }
  
  console.log(_serializeOutput(result));
} catch (e: any) {
  console.error("Runtime Error:", e.name + ":", e.message);
}
`;
};

/**
 * Java driver code - wraps Solution class with Main method
 * Fixed: Better handling of array parameters via explicit method finding and invocation
 */
const wrapJavaCode = (
  userCode: string,
  rawInput: string,
  methodSignature?: MethodSignature
): string => {
  // For Java, we need to generate direct method calls instead of using reflection
  // Parse the raw input to extract values
  const parsedArgs = parseInputForLanguage('java', rawInput);
  
  // Common imports needed for LeetCode problems
  const imports = `import java.util.*;
import java.util.stream.*;
`;

  // Check if user code already has a main method
  if (userCode.includes('public static void main')) {
    return imports + userCode;
  }
  
  // Check if user already has imports
  const hasImports = userCode.includes('import java');
  
  // Detect the method name and signature from user code
  // Match patterns like: public int[] twoSum(int[] nums, int target)
  const methodPatterns = [
    /public\s+(?:static\s+)?(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)/,
    /(\w+(?:<[^>]+>)?(?:\[\])?)\s+(\w+)\s*\(([^)]*)\)\s*\{/
  ];
  
  let detectedMethod = 'solve';
  let returnType = 'Object';
  let paramList = '';
  
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match) {
      returnType = match[1];
      detectedMethod = match[2];
      paramList = match[3];
      if (detectedMethod !== 'Solution' && detectedMethod !== 'main') {
        break;
      }
    }
  }
  
  // Wrap with main class if user only has Solution class
  if (userCode.includes('class Solution') && !userCode.includes('class Main')) {
    return `${imports}

// ListNode and TreeNode for common problems
class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}

class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;
    TreeNode() {}
    TreeNode(int val) { this.val = val; }
    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}

${userCode}

class Main {
    public static void main(String[] args) {
        try {
            Solution sol = new Solution();
            
            // Direct method call with parsed arguments
            ${returnType} result = sol.${detectedMethod}(${parsedArgs});
            System.out.println(serializeOutput(result));
            
        } catch (Exception e) {
            System.err.println("Runtime Error: " + e.getClass().getSimpleName() + ": " + e.getMessage());
            e.printStackTrace(System.err);
        }
    }
    
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
    }
}
`;
  }
  
  return hasImports ? userCode : imports + userCode;
};

/**
 * C++ driver code - includes common headers and wraps Solution class
 * Fixed: Better method name detection for complex return types
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
#include <numeric>
using namespace std;
`;

  // Check if user already has includes
  const hasIncludes = userCode.includes('#include');
  const hasMain = userCode.includes('int main');
  
  if (hasMain) {
    return hasIncludes ? userCode : includes + userCode;
  }
  
  // ListNode and TreeNode definitions
  const dataStructures = `
// --- ListNode and TreeNode for common problems ---
struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};

ListNode* buildList(vector<int>& arr) {
    if (arr.empty()) return nullptr;
    ListNode* head = new ListNode(arr[0]);
    ListNode* curr = head;
    for (size_t i = 1; i < arr.size(); i++) {
        curr->next = new ListNode(arr[i]);
        curr = curr->next;
    }
    return head;
}

string listToString(ListNode* head) {
    string result = "[";
    while (head) {
        result += to_string(head->val);
        if (head->next) result += ",";
        head = head->next;
    }
    result += "]";
    return result;
}
`;

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
void printResult(const vector<long long>& r) { printVector(r); }
void printResult(const vector<double>& r) { printVector(r); }
void printResult(const vector<string>& r) { printVector(r); }
void printResult(const vector<vector<int>>& r) { printVector2D(r); }
void printResult(const vector<vector<string>>& r) { printVector2D(r); }
void printResult(const vector<bool>& r) { 
    cout << "[";
    for (size_t i = 0; i < r.size(); i++) {
        if (i > 0) cout << ",";
        cout << (r[i] ? "true" : "false");
    }
    cout << "]";
}
void printResult(ListNode* r) { cout << listToString(r); }
`;

  // Detect method name from Solution class using improved regex
  // This regex handles complex return types like vector<vector<int>>, ListNode*, pair<int,int>, etc.
  const methodPatterns = [
    // Match method with complex template return types: vector<vector<int>> methodName(
    /(?:const\s+)?(?:static\s+)?(?:(?:vector|list|set|map|unordered_map|unordered_set|pair|tuple|optional|queue|stack|deque|priority_queue)\s*<[^>]*(?:<[^>]*>)?[^>]*>\s*\*?\s*&?\s*)(\w+)\s*\(/,
    // Match method with pointer/reference return types: ListNode* methodName(, TreeNode* methodName(
    /(?:const\s+)?(?:static\s+)?(?:ListNode|TreeNode|Node)\s*\*\s*(\w+)\s*\(/,
    // Match method with simple return types: int methodName(, bool methodName(, string methodName(
    /(?:const\s+)?(?:static\s+)?(?:int|long\s+long|double|float|bool|char|string|void|size_t|unsigned)\s+(\w+)\s*\(/,
    // Fallback: any function-like pattern after common keywords
    /(?:public|private|protected)?\s*(?:const\s+)?(?:static\s+)?[\w:<>,\s*&]+\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*\{/
  ];

  let detectedMethod = methodSignature?.name || 'solve';
  
  // Try each pattern until we find a match
  for (const pattern of methodPatterns) {
    const match = userCode.match(pattern);
    if (match && match[1]) {
      // Skip constructor (same name as class) and common non-method patterns
      const methodName = match[1];
      if (methodName !== 'Solution' && methodName !== 'main' && !methodName.startsWith('_')) {
        detectedMethod = methodName;
        break;
      }
    }
  }

  // Parse args to generate proper variable declarations for reference parameters
  // This handles cases like vector<int>& nums which need to be declared before use
  const generateCppMainWithDeclarations = () => {
    // For C++, we need to declare variables properly for reference parameters
    // Parse the parsedArgs and create variable declarations
    const args = parsedArgs.split(/,\s*(?![^{}]*\})/).map(a => a.trim()).filter(a => a);
    
    let declarations = '';
    let callArgs: string[] = [];
    
    args.forEach((arg, i) => {
      // Check if it's a vector
      if (arg.startsWith('vector<')) {
        const varName = `arg${i}`;
        declarations += `    auto ${varName} = ${arg};\n`;
        callArgs.push(varName);
      } else {
        callArgs.push(arg);
      }
    });
    
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

  return (hasIncludes ? '' : includes) + dataStructures + userCode + helpers + mainWrapper;
};
