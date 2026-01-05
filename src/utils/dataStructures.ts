/**
 * Centralized data structure definitions for all supported languages
 * Includes ListNode, TreeNode, Graph Node, N-ary Tree, Random Pointer, etc.
 * 
 * Used by codeWrappers.ts to inject appropriate definitions based on problem type
 */

// ============= PYTHON DATA STRUCTURES =============

export const PYTHON_DATA_STRUCTURES = {
  ListNode: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next`,
  
  TreeNode: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right`,
  
  // Graph Node for Clone Graph, etc.
  Node_Graph: `class Node:
    def __init__(self, val=0, neighbors=None):
        self.val = val
        self.neighbors = neighbors if neighbors else []`,
  
  // N-ary Tree Node
  Node_NAry: `class Node:
    def __init__(self, val=None, children=None):
        self.val = val
        self.children = children if children else []`,
  
  // Random Pointer Node (Copy List with Random Pointer)
  Node_Random: `class Node:
    def __init__(self, x, next=None, random=None):
        self.val = x
        self.next = next
        self.random = random`,
  
  // Doubly Linked List Node (Flatten Multilevel)
  Node_Doubly: `class Node:
    def __init__(self, val=0, prev=None, next=None, child=None):
        self.val = val
        self.prev = prev
        self.next = next
        self.child = child`,
};

export const PYTHON_BUILDERS = {
  buildList: `def _build_list(arr):
    if not arr: return None
    head = ListNode(arr[0])
    curr = head
    for val in arr[1:]:
        curr.next = ListNode(val)
        curr = curr.next
    return head`,
  
  buildTree: `def _build_tree(arr):
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
    return root`,
  
  listToArr: `def _list_to_arr(head):
    result = []
    while head:
        result.append(head.val)
        head = head.next
    return result`,
  
  treeToArr: `def _tree_to_arr(root):
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
    return result`,
};

// ============= JAVA DATA STRUCTURES =============

export const JAVA_DATA_STRUCTURES = {
  ListNode: `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`,
  
  TreeNode: `class TreeNode {
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
}`,
  
  // Graph Node for Clone Graph, All Paths
  Node_Graph: `class Node {
    public int val;
    public List<Node> neighbors;
    public Node() { val = 0; neighbors = new ArrayList<Node>(); }
    public Node(int _val) { val = _val; neighbors = new ArrayList<Node>(); }
    public Node(int _val, ArrayList<Node> _neighbors) { val = _val; neighbors = _neighbors; }
}`,
  
  // N-ary Tree Node
  Node_NAry: `class Node {
    public int val;
    public List<Node> children;
    public Node() {}
    public Node(int _val) { val = _val; }
    public Node(int _val, List<Node> _children) { val = _val; children = _children; }
}`,
  
  // Random Pointer Node
  Node_Random: `class Node {
    int val;
    Node next;
    Node random;
    public Node(int val) { this.val = val; this.next = null; this.random = null; }
}`,
  
  // Doubly Linked List Node
  Node_Doubly: `class Node {
    public int val;
    public Node prev;
    public Node next;
    public Node child;
}`,
};

export const JAVA_BUILDERS = `
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
    }`;

export const JAVA_SERIALIZER = `
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

// ============= C++ DATA STRUCTURES =============

export const CPP_DATA_STRUCTURES = {
  ListNode: `struct ListNode {
    int val;
    ListNode *next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode *next) : val(x), next(next) {}
};`,
  
  TreeNode: `struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode() : val(0), left(nullptr), right(nullptr) {}
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
    TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}
};`,
  
  // Graph Node
  Node_Graph: `class Node {
public:
    int val;
    vector<Node*> neighbors;
    Node() : val(0), neighbors(vector<Node*>()) {}
    Node(int _val) : val(_val), neighbors(vector<Node*>()) {}
    Node(int _val, vector<Node*> _neighbors) : val(_val), neighbors(_neighbors) {}
};`,
  
  // N-ary Tree Node
  Node_NAry: `class Node {
public:
    int val;
    vector<Node*> children;
    Node() {}
    Node(int _val) : val(_val) {}
    Node(int _val, vector<Node*> _children) : val(_val), children(_children) {}
};`,
  
  // Random Pointer Node
  Node_Random: `class Node {
public:
    int val;
    Node* next;
    Node* random;
    Node(int _val) : val(_val), next(nullptr), random(nullptr) {}
};`,
};

export const CPP_BUILDERS = `
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

TreeNode* buildTree(vector<int>& arr) {
    if (arr.empty()) return nullptr;
    TreeNode* root = new TreeNode(arr[0]);
    queue<TreeNode*> q;
    q.push(root);
    size_t i = 1;
    while (!q.empty() && i < arr.size()) {
        TreeNode* node = q.front();
        q.pop();
        if (i < arr.size() && arr[i] != INT_MIN) {
            node->left = new TreeNode(arr[i]);
            q.push(node->left);
        }
        i++;
        if (i < arr.size() && arr[i] != INT_MIN) {
            node->right = new TreeNode(arr[i]);
            q.push(node->right);
        }
        i++;
    }
    return root;
}`;

export const CPP_HELPERS = `
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
void printResult(ListNode* r) { cout << listToString(r); }`;

// ============= DETECTION UTILITIES =============

/**
 * Check if code already contains a specific data structure definition
 */
export const hasDataStructure = (code: string, structName: string): boolean => {
  // Check for actual class/struct definition, not just comments or usage
  const patterns = [
    new RegExp(`(?<!//.*)(class|struct)\\s+${structName}\\s*[{(:]`, 'm'),
    new RegExp(`^\\s*(class|struct)\\s+${structName}\\s*[{(:]`, 'm'),
  ];
  
  return patterns.some(pattern => pattern.test(code));
};

/**
 * Check if code uses a specific data structure (in parameter types or return types)
 */
export const usesDataStructure = (code: string, structName: string): boolean => {
  // Check for usage patterns like: ListNode*, ListNode l1, Optional[ListNode]
  const patterns = [
    new RegExp(`${structName}\\s*\\*`, 'i'),  // C++ pointer
    new RegExp(`${structName}\\s+\\w+`, 'i'),  // Variable declaration
    new RegExp(`Optional\\[${structName}\\]`, 'i'),  // Python type hint
    new RegExp(`<${structName}>`, 'i'),  // Java generic
  ];
  
  return patterns.some(pattern => pattern.test(code));
};

/**
 * Get required data structures for a piece of code
 */
export const getRequiredStructures = (code: string): string[] => {
  const structures: string[] = [];
  
  if (usesDataStructure(code, 'ListNode') && !hasDataStructure(code, 'ListNode')) {
    structures.push('ListNode');
  }
  if (usesDataStructure(code, 'TreeNode') && !hasDataStructure(code, 'TreeNode')) {
    structures.push('TreeNode');
  }
  
  return structures;
};
