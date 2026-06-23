import type { ASTNode, TreeEditOperation, ASTSimilarityResult } from "../types";

// ── 内部节点表示（扁平化，后序编号） ──────────────────
type FlatNode = {
  label: string;
  id: string;
  children: number[]; // 子节点的后序编号
  leftmost: number; // 最左叶子后代的后序编号
  parent: number; // 父节点的后序编号，-1 表示根
};

function flattenTree(root: ASTNode): FlatNode[] {
  const nodes: FlatNode[] = [];

  function dfs(node: ASTNode): number {
    const childIndices = node.children.map((c) => dfs(c));
    const idx = nodes.length;
    nodes.push({
      label: node.type + (node.value !== undefined ? `:${node.value}` : ""),
      id: node.id,
      children: childIndices,
      leftmost: childIndices.length > 0 ? nodes[childIndices[0]].leftmost : idx,
      parent: -1,
    });
    return idx;
  }

  dfs(root);

  // 回填 parent
  for (let i = 0; i < nodes.length; i++) {
    for (const c of nodes[i].children) {
      nodes[c].parent = i;
    }
  }

  return nodes;
}

// ── Zhang-Shasha 树编辑距离 ───────────────────────────
export function computeTreeEditDistance(ast1: ASTNode, ast2: ASTNode): number {
  const t1 = flattenTree(ast1);
  const t2 = flattenTree(ast2);
  const n = t1.length;
  const m = t2.length;

  if (n === 0) return m;
  if (m === 0) return n;

  // keyroots：后序遍历中，最左叶子不同于父节点最左叶子的节点
  function getKeyroots(nodes: FlatNode[]): number[] {
    const seen = new Set<number>();
    const roots: number[] = [];
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (!seen.has(nodes[i].leftmost)) {
        seen.add(nodes[i].leftmost);
        roots.push(i);
      }
    }
    return roots.reverse();
  }

  const kr1 = getKeyroots(t1);
  const kr2 = getKeyroots(t2);

  // treeDist[i][j]：以 i 为根的子树 与 以 j 为根的子树 的编辑距离
  const treeDist: number[][] = Array.from({ length: n }, () => Array.from<number>({ length: m }).fill(0));

  // 逐对 keyroot 计算
  for (const i of kr1) {
    for (const j of kr2) {
      // l1/l2: keyroot 子树中各节点的 leftmost 值
      // 收集 i 子树中所有节点（后序遍历中，leftmost 在 i 的 leftmost 和 i 之间）
      const lm1 = t1[i].leftmost;
      const lm2 = t2[j].leftmost;

      const size1 = i - lm1 + 1;
      const size2 = j - lm2 + 1;

      // forestDist[a][b]：前缀 forest 的距离
      const fd: number[][] = Array.from({ length: size1 + 1 }, () =>
        Array.from<number>({ length: size2 + 1 }).fill(0),
      );

      // base cases
      for (let a = 1; a <= size1; a++) {
        fd[a][0] = fd[a - 1][0] + 1;
      }
      for (let b = 1; b <= size2; b++) {
        fd[0][b] = fd[0][b - 1] + 1;
      }

      for (let a = 1; a <= size1; a++) {
        const nodeI = lm1 + a - 1;
        for (let b = 1; b <= size2; b++) {
          const nodeJ = lm2 + b - 1;

          const isPath1 = t1[nodeI].leftmost === lm1;
          const isPath2 = t2[nodeJ].leftmost === lm2;

          if (isPath1 && isPath2) {
            // 都在最左路径上：计算标签替换代价，并记录到 treeDist
            fd[a][b] = Math.min(
              fd[a - 1][b] + 1,
              fd[a][b - 1] + 1,
              fd[a - 1][b - 1] + (t1[nodeI].label === t2[nodeJ].label ? 0 : 1),
            );
            treeDist[nodeI][nodeJ] = fd[a][b];
          } else {
            // 至少一个是独立子树的根：用已计算的 treeDist 整棵替换
            fd[a][b] = Math.min(
              fd[a - 1][b] + 1,
              fd[a][b - 1] + 1,
              fd[a - 1][b - 1] + treeDist[nodeI][nodeJ],
            );
          }
        }
      }

      treeDist[i][j] = fd[size1][size2];
    }
  }

  return treeDist[n - 1][m - 1];
}

// ── 提取编辑操作（通过后序遍历比较） ──────────────────
function extractOperations(ast1: ASTNode, ast2: ASTNode): TreeEditOperation[] {
  const ops: TreeEditOperation[] = [];
  const t1 = flattenTree(ast1);
  const t2 = flattenTree(ast2);

  const labels1 = t1.map((n) => n.label);
  const labels2 = t2.map((n) => n.label);
  const ids1 = t1.map((n) => n.id);
  const ids2 = t2.map((n) => n.id);

  const n = t1.length;
  const m = t2.length;

  // 基于后序遍历的 DP 回溯，提取最小编辑脚本
  const dp: number[][] = Array.from({ length: n + 1 }, () =>
    Array.from<number>({ length: m + 1 }).fill(0),
  );
  for (let i = 1; i <= n; i++) dp[i][0] = i;
  for (let j = 1; j <= m; j++) dp[0][j] = j;
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const cost = labels1[i - 1] === labels2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }

  // 回溯
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i === 0) {
      ops.push({ type: "insert", node: { type: "Identifier" as const, children: [], id: ids2[j - 1] }, parent: { type: "Identifier" as const, children: [], id: "" }, position: 0 });
      j--;
    } else if (j === 0) {
      ops.push({ type: "delete", node: { type: "Identifier" as const, children: [], id: ids1[i - 1] } });
      i--;
    } else {
      const cost = labels1[i - 1] === labels2[j - 1] ? 0 : 1;
      if (dp[i][j] === dp[i - 1][j - 1] + cost) {
        if (cost === 1) {
          ops.push({ type: "rename", node: { type: "Identifier" as const, children: [], id: ids1[i - 1] }, newLabel: labels2[j - 1] });
        }
        i--; j--;
      } else if (dp[i][j] === dp[i - 1][j] + 1) {
        ops.push({ type: "delete", node: { type: "Identifier" as const, children: [], id: ids1[i - 1] } });
        i--;
      } else {
        ops.push({ type: "insert", node: { type: "Identifier" as const, children: [], id: ids2[j - 1] }, parent: { type: "Identifier" as const, children: [], id: "" }, position: 0 });
        j--;
      }
    }
  }

  return ops;
}

// ── 差异节点高亮 ──────────────────────────────────────
export function highlightDifferences(ast1: ASTNode, ast2: ASTNode): { nodes1: Set<string>; nodes2: Set<string> } {
  const ops = extractOperations(ast1, ast2);
  const nodes1 = new Set<string>();
  const nodes2 = new Set<string>();

  for (const op of ops) {
    if (op.type === "delete" || op.type === "rename") {
      nodes1.add(op.node.id);
    }
    if (op.type === "insert") {
      nodes2.add(op.node.id);
    }
    if (op.type === "rename") {
      // rename 意味着两个节点对应，标记右侧
      nodes2.add(op.node.id);
    }
  }

  return { nodes1, nodes2 };
}

// ── 对外接口 ──────────────────────────────────────────
export function compareASTs(ast1: ASTNode, ast2: ASTNode): ASTSimilarityResult {
  const t1 = flattenTree(ast1);
  const t2 = flattenTree(ast2);
  const maxNodes = Math.max(t1.length, t2.length);

  const distance = computeTreeEditDistance(ast1, ast2);
  const operations = extractOperations(ast1, ast2);
  const score = maxNodes === 0 ? 1 : 1 - distance / (2 * maxNodes);

  return { score, distance, operations, mappedNodes: new Map() };
}
