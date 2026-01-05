/**
 * Problem Type Detection and Handling
 * 
 * Supports different problem types:
 * - algorithm: Standard input -> function -> output
 * - design: Class-based with command execution (e.g., LRUCache)
 * - interactive: Hidden API problems (e.g., isBadVersion)
 */

export type ProblemType = 'algorithm' | 'design' | 'interactive';

export interface ProblemMetadata {
  type: ProblemType;
  isOrderAgnostic?: boolean;
  hiddenHeader?: {
    python?: string;
    java?: string;
    cpp?: string;
  };
  customValidator?: string;
}

/**
 * Detect problem type from test case input format
 */
export const detectProblemType = (testInput: string): ProblemType => {
  if (!testInput) return 'algorithm';
  
  const trimmed = testInput.trim();
  
  // Design pattern: input is array of commands like ["LRUCache", "put", "get"]
  // Usually followed by another array of arguments [[2], [1, 1], [1]]
  if (trimmed.startsWith('["') && trimmed.includes('"]')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        // First element is the class name (constructor)
        const firstElement = parsed[0];
        // Common design problem class names
        const designPatterns = [
          'LRUCache', 'LFUCache', 'MinStack', 'MaxStack',
          'MedianFinder', 'RandomizedSet', 'RandomizedCollection',
          'Trie', 'WordDictionary', 'AllOne', 'Twitter',
          'MyQueue', 'MyStack', 'MyHashMap', 'MyHashSet',
          'BSTIterator', 'NestedIterator', 'PeekingIterator',
          'Codec', 'Solution', // For Shuffle an Array, etc.
        ];
        
        if (designPatterns.some(p => firstElement.includes(p))) {
          return 'design';
        }
        
        // If first element looks like a class name (PascalCase)
        if (/^[A-Z][a-zA-Z0-9]+$/.test(firstElement)) {
          return 'design';
        }
      }
    } catch {
      // Not valid JSON, treat as algorithm
    }
  }
  
  return 'algorithm';
};

/**
 * Check if a problem uses a hidden API (interactive problem)
 */
export const isInteractiveProblem = (problemTags?: string[], problemTitle?: string): boolean => {
  const interactiveKeywords = [
    'guess', 'bad version', 'pick', 'read', 'isBadVersion',
    'guess number', 'first bad version', 'interactive',
  ];
  
  const title = problemTitle?.toLowerCase() || '';
  
  // Check title for interactive keywords
  if (interactiveKeywords.some(keyword => title.includes(keyword))) {
    return true;
  }
  
  // Check tags
  if (problemTags?.some(tag => tag.toLowerCase() === 'interactive')) {
    return true;
  }
  
  return false;
};

/**
 * Generate hidden header code for interactive problems
 */
export const generateHiddenHeader = (
  problemType: string,
  testCase: { input: string; output: string },
  language: 'python' | 'java' | 'cpp'
): string | null => {
  // First Bad Version
  if (problemType.includes('bad_version') || problemType.includes('first_bad')) {
    // Extract the bad version number from expected output
    const badVersion = parseInt(testCase.output);
    if (isNaN(badVersion)) return null;
    
    if (language === 'python') {
      return `# Hidden API - DO NOT MODIFY
_bad_version = ${badVersion}
def isBadVersion(version: int) -> bool:
    return version >= _bad_version
`;
    }
    if (language === 'java') {
      return `// Hidden API - DO NOT MODIFY
class VersionControl {
    static int badVersion = ${badVersion};
    static boolean isBadVersion(int version) {
        return version >= badVersion;
    }
}
`;
    }
    if (language === 'cpp') {
      return `// Hidden API - DO NOT MODIFY
int _bad_version = ${badVersion};
bool isBadVersion(int version) {
    return version >= _bad_version;
}
`;
    }
  }
  
  // Guess Number Higher Lower
  if (problemType.includes('guess_number')) {
    const pick = parseInt(testCase.output);
    if (isNaN(pick)) return null;
    
    if (language === 'python') {
      return `# Hidden API - DO NOT MODIFY
_pick = ${pick}
def guess(num: int) -> int:
    if num == _pick: return 0
    return -1 if num > _pick else 1
`;
    }
    if (language === 'java') {
      return `// Hidden API - DO NOT MODIFY
class GuessGame {
    static int pick = ${pick};
    static int guess(int num) {
        if (num == pick) return 0;
        return num > pick ? -1 : 1;
    }
}
`;
    }
    if (language === 'cpp') {
      return `// Hidden API - DO NOT MODIFY
int _pick = ${pick};
int guess(int num) {
    if (num == _pick) return 0;
    return num > _pick ? -1 : 1;
}
`;
    }
  }
  
  return null;
};

/**
 * Parse design problem input format
 * Input: commands = ["LRUCache", "put", "get"], args = [[2], [1, 1], [1]]
 * Returns structured command sequence
 */
export interface DesignCommand {
  method: string;
  args: any[];
  isConstructor: boolean;
}

export const parseDesignInput = (input: string): DesignCommand[] | null => {
  try {
    // Try to parse as two arrays: commands and arguments
    // Format: ["cmd1", "cmd2"], [[arg1], [arg2, arg3]]
    const parts = input.split(/\],\s*\[/).map(p => p.trim());
    
    if (parts.length < 2) return null;
    
    // Reconstruct the arrays
    let commandsStr = parts[0];
    if (!commandsStr.startsWith('[')) commandsStr = '[' + commandsStr;
    if (!commandsStr.endsWith(']')) commandsStr = commandsStr + ']';
    
    let argsStr = parts.slice(1).join('],[');
    if (!argsStr.startsWith('[')) argsStr = '[' + argsStr;
    if (!argsStr.endsWith(']')) argsStr = argsStr + ']';
    argsStr = '[' + argsStr + ']'; // Wrap in outer array
    
    const commands = JSON.parse(commandsStr);
    const args = JSON.parse(argsStr);
    
    if (!Array.isArray(commands) || !Array.isArray(args)) return null;
    if (commands.length !== args.length) return null;
    
    return commands.map((method, index) => ({
      method,
      args: args[index] || [],
      isConstructor: index === 0,
    }));
  } catch {
    return null;
  }
};

/**
 * Generate wrapper code for design problems
 */
export const generateDesignWrapper = (
  className: string,
  commands: DesignCommand[],
  language: 'python' | 'java' | 'cpp'
): string => {
  if (language === 'python') {
    let code = `# Design problem driver code\nresults = []\n`;
    code += `obj = ${className}(${commands[0].args.join(', ')})\nresults.append(None)\n`;
    
    for (let i = 1; i < commands.length; i++) {
      const cmd = commands[i];
      code += `results.append(obj.${cmd.method}(${cmd.args.join(', ')}))\n`;
    }
    
    code += `print(_serialize_output(results))`;
    return code;
  }
  
  if (language === 'java') {
    let code = `// Design problem driver code\nList<Object> results = new ArrayList<>();\n`;
    code += `${className} obj = new ${className}(${commands[0].args.join(', ')});\nresults.add(null);\n`;
    
    for (let i = 1; i < commands.length; i++) {
      const cmd = commands[i];
      code += `results.add(obj.${cmd.method}(${cmd.args.join(', ')}));\n`;
    }
    
    code += `System.out.println(serializeOutput(results));`;
    return code;
  }
  
  if (language === 'cpp') {
    let code = `// Design problem driver code\nvector<string> results;\n`;
    code += `${className}* obj = new ${className}(${commands[0].args.join(', ')});\nresults.push_back("null");\n`;
    
    for (let i = 1; i < commands.length; i++) {
      const cmd = commands[i];
      code += `auto res${i} = obj->${cmd.method}(${cmd.args.join(', ')});\n`;
      code += `results.push_back(to_string(res${i}));\n`;
    }
    
    code += `cout << "["; for(size_t i=0;i<results.size();i++){if(i>0)cout<<",";cout<<results[i];}cout<<"]";`;
    return code;
  }
  
  return '';
};
