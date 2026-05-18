import type { ASTNode, TreeEditOperation, ASTSimilarityResult } from "./types";

class TreeNode {
  label: string;
  children: TreeNode[];
  parent: TreeNode | null;
  id: string;
  leftmost: TreeNode;
  rightmost: TreeNode;
  keyroots: TreeNode[];

  constructor(node: ASTNode) {
    this.label = node.type + (node.value !== undefined ? `:${node.value}` : "");
    this.children = [];
    this.parent = null;
    this.id = node.id;
    this.leftmost = this;
    this.rightmost = this;
    this.keyroots = [];

    for (const child of node.children) {
      const childNode = new TreeNode(child);
      childNode.parent = this;
      this.children.push(childNode);
    }
  }

  postOrder(): TreeNode[] {
    const result: TreeNode[] = [];
    for (const child of this.children) {
      result.push(...child.postOrder());
    }
    result.push(this);
    return result;
  }

  computeLeftmost(): void {
    if (this.children.length > 0) {
      this.children[0].computeLeftmost();
      this.leftmost = this.children[0].leftmost;
    }
  }

  computeRightmost(): void {
    if (this.children.length > 0) {
      const last = this.children[this.children.length - 1];
      last.computeRightmost();
      this.rightmost = last.rightmost;
    }
  }

  computeKeyroots(): void {
    const postOrder = this.postOrder();
    const keyrootMap = new Map<string, TreeNode>();

    for (const node of postOrder) {
      const leftmostId = node.leftmost.id;
      if (!keyrootMap.has(leftmostId)) {
        keyrootMap.set(leftmostId, node);
      }
    }

    this.keyroots = Array.from(keyrootMap.values());
  }
}

export class ZhangShashaTreeEdit {
  private tree1: TreeNode;
  private tree2: TreeNode;
  private nodes1: TreeNode[];
  private nodes2: TreeNode[];
  private labels1: string[];
  private labels2: string[];
  private operations: TreeEditOperation[];

  constructor(ast1: ASTNode, ast2: ASTNode) {
    this.tree1 = new TreeNode(ast1);
    this.tree2 = new TreeNode(ast2);
    this.nodes1 = [];
    this.nodes2 = [];
    this.labels1 = [];
    this.labels2 = [];
    this.operations = [];

    this.preprocess();
  }

  private preprocess(): void {
    this.tree1.computeLeftmost();
    this.tree1.computeRightmost();
    this.tree1.computeKeyroots();

    this.tree2.computeLeftmost();
    this.tree2.computeRightmost();
    this.tree2.computeKeyroots();

    this.nodes1 = this.tree1.postOrder();
    this.nodes2 = this.tree2.postOrder();

    this.labels1 = this.nodes1.map((n) => n.label);
    this.labels2 = this.nodes2.map((n) => n.label);
  }

  computeDistance(): number {
    const n = this.nodes1.length;
    const m = this.nodes2.length;

    const dp: number[][] = new Array(n + 1)
      .fill(0)
      .map(() => new Array(m + 1).fill(0));

    for (let i = 1; i <= n; i++) {
      dp[i][0] = dp[i - 1][0] + 1;
    }
    for (let j = 1; j <= m; j++) {
      dp[0][j] = dp[0][j - 1] + 1;
    }

    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = this.labels1[i - 1] === this.labels2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      }
    }

    this.backtrackOperations(dp, n, m);

    return dp[n][m];
  }

  private backtrackOperations(dp: number[][], i: number, j: number): void {
    this.operations = [];
    const mappedNodes = new Map<string, string>();

    while (i > 0 || j > 0) {
      if (i === 0) {
        this.operations.push({
          type: "insert",
          node: { type: "Identifier" as const, children: [], id: this.nodes2[j - 1].id },
          parent: {
            type: "Identifier" as const,
            children: [],
            id: this.nodes2[j - 1].parent?.id || "",
          },
          position: 0,
        });
        j--;
      } else if (j === 0) {
        this.operations.push({
          type: "delete",
          node: { type: "Identifier" as const, children: [], id: this.nodes1[i - 1].id },
        });
        i--;
      } else {
        const cost = this.labels1[i - 1] === this.labels2[j - 1] ? 0 : 1;
        if (dp[i][j] === dp[i - 1][j - 1] + cost) {
          if (cost === 1) {
            this.operations.push({
              type: "rename",
              node: { type: "Identifier" as const, children: [], id: this.nodes1[i - 1].id },
              newLabel: this.labels2[j - 1],
            });
          } else {
            mappedNodes.set(this.nodes1[i - 1].id, this.nodes2[j - 1].id);
          }
          i--;
          j--;
        } else if (dp[i][j] === dp[i - 1][j] + 1) {
          this.operations.push({
            type: "delete",
            node: { type: "Identifier" as const, children: [], id: this.nodes1[i - 1].id },
          });
          i--;
        } else {
          this.operations.push({
            type: "insert",
            node: { type: "Identifier" as const, children: [], id: this.nodes2[j - 1].id },
            parent: {
              type: "Identifier" as const,
              children: [],
              id: this.nodes2[j - 1].parent?.id || "",
            },
            position: 0,
          });
          j--;
        }
      }
    }

    this.mappedNodes = mappedNodes;
  }

  private mappedNodes: Map<string, string> = new Map();

  getSimilarity(): ASTSimilarityResult {
    const distance = this.computeDistance();
    const maxNodes = Math.max(this.nodes1.length, this.nodes2.length);
    const score = maxNodes === 0 ? 1 : 1 - distance / (2 * maxNodes);

    return {
      score,
      distance,
      operations: this.operations,
      mappedNodes: this.mappedNodes,
    };
  }
}

export function compareASTs(ast1: ASTNode, ast2: ASTNode): ASTSimilarityResult {
  const comparator = new ZhangShashaTreeEdit(ast1, ast2);
  return comparator.getSimilarity();
}

export function highlightDifferences(ast: ASTNode, operations: TreeEditOperation[]): Set<string> {
  const diffNodes = new Set<string>();

  for (const op of operations) {
    if (op.type === "delete" || op.type === "rename") {
      diffNodes.add(op.node.id);
    } else if (op.type === "insert") {
      diffNodes.add(op.node.id);
    }
  }

  return diffNodes;
}
