/**
 * Structure Inference Utility
 * Determines which Node variant (Graph, Random, N-ary, Doubly) is needed based on problem context
 */

export type NodeVariant = 'Node_Graph' | 'Node_Random' | 'Node_NAry' | 'Node_Doubly' | null;

// Map of known problem slugs to their required Node variant
const SLUG_TO_NODE_VARIANT: Record<string, NodeVariant> = {
  // Graph problems
  'clone-graph': 'Node_Graph',
  'number-of-connected-components-in-an-undirected-graph': 'Node_Graph',
  'graph-valid-tree': 'Node_Graph',
  'find-the-town-judge': 'Node_Graph',
  
  // Random pointer problems
  'copy-list-with-random-pointer': 'Node_Random',
  
  // N-ary tree problems
  'n-ary-tree-preorder-traversal': 'Node_NAry',
  'n-ary-tree-postorder-traversal': 'Node_NAry',
  'n-ary-tree-level-order-traversal': 'Node_NAry',
  'maximum-depth-of-n-ary-tree': 'Node_NAry',
  'serialize-and-deserialize-n-ary-tree': 'Node_NAry',
  
  // Doubly linked / multilevel problems
  'flatten-a-multilevel-doubly-linked-list': 'Node_Doubly',
};

/**
 * Infer which Node variant is needed based on problem context
 */
export const inferNodeVariant = (
  problemSlug?: string,
  problemTags?: string[],
  userCode?: string
): NodeVariant => {
  // 1. Check explicit slug mapping (most reliable)
  if (problemSlug && SLUG_TO_NODE_VARIANT[problemSlug]) {
    return SLUG_TO_NODE_VARIANT[problemSlug];
  }

  // 2. Check code hints
  if (userCode) {
    // Graph node - has neighbors
    if (userCode.includes('.neighbors') || userCode.includes('->neighbors')) {
      return 'Node_Graph';
    }
    // Random pointer - has random
    if (userCode.includes('.random') || userCode.includes('->random')) {
      return 'Node_Random';
    }
    // Doubly linked / multilevel - has child + prev
    if ((userCode.includes('.child') || userCode.includes('->child')) && 
        (userCode.includes('.prev') || userCode.includes('->prev'))) {
      return 'Node_Doubly';
    }
    // N-ary tree - has children
    if (userCode.includes('.children') || userCode.includes('->children')) {
      return 'Node_NAry';
    }
  }

  // 3. Check tags
  if (problemTags) {
    const tagsLower = problemTags.map(t => t.toLowerCase());
    if (tagsLower.includes('graph')) return 'Node_Graph';
    if (tagsLower.includes('n-ary-tree')) return 'Node_NAry';
  }

  return null;
};

/**
 * Check if code needs Node class injection (uses Node but doesn't define it)
 */
export const needsNodeInjection = (code: string): boolean => {
  // Check if code uses Node
  const usesNode = /\bNode\b/.test(code);
  // Check if code already defines Node class
  const definesNode = /(class|struct)\s+Node\s*[{(:]/.test(code);
  
  return usesNode && !definesNode;
};
