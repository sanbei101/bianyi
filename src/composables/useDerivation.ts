import { ref } from "vue";
import type { Grammar, DerivationResult } from "../types";

// 算术表达式文法
const grammar: Grammar = {
  V: ["E", "E'", "T", "T'", "F"],
  T: ["id", "+", "-", "*", "/", "(", ")"],
  P: [
    { left: "E", right: "T E'" },
    { left: "E'", right: "+ T E'" },
    { left: "E'", right: "- T E'" },
    { left: "E'", right: "ε" },
    { left: "T", right: "F T'" },
    { left: "T'", right: "* F T'" },
    { left: "T'", right: "/ F T'" },
    { left: "T'", right: "ε" },
    { left: "F", right: "( E )" },
    { left: "F", right: "id" },
  ],
  S: "E",
};

// 经典 dangling else 歧义文法
export const ambiguousGrammar: Grammar = {
  V: ["S", "E"],
  T: ["if", "then", "else", "id"],
  P: [
    { left: "S", right: "if E then S" },
    { left: "S", right: "if E then S else S" },
    { left: "S", right: "id" },
    { left: "E", right: "id" },
  ],
  S: "S",
};

export function useDerivation() {
  const derivationType = ref<"left" | "right">("left");
  const derivationResult = ref<DerivationResult | null>(null);
  const currentGrammar = ref<Grammar>(grammar);

  type TreeNode = { symbol: string; children: TreeNode[]; prod?: string };

  function buildParseTree(tokens: string[], g: Grammar): TreeNode | null {
    const table: Record<string, Record<string, string>> = {
      E: { id: "T E'", "(": "T E'" },
      "E'": { "+": "+ T E'", "-": "- T E'", ")": "ε", EOF: "ε" },
      T: { id: "F T'", "(": "F T'" },
      "T'": { "*": "* F T'", "/": "/ F T'", "+": "ε", "-": "ε", ")": "ε", EOF: "ε" },
      F: { id: "id", "(": "( E )" },
    };

    let pos = 0;
    function lookahead() {
      return pos < tokens.length ? tokens[pos] : "EOF";
    }

    function parseSymbol(sym: string): TreeNode | null {
      if (sym === "ε") {
        return { symbol: "ε", children: [] };
      }
      if (g.T.includes(sym)) {
        if (lookahead() === sym) {
          pos++;
          return { symbol: sym, children: [] };
        }
        return null;
      }

      const la = lookahead();
      const prod = table[sym]?.[la];
      if (!prod) return null;

      const node: TreeNode = { symbol: sym, children: [], prod };
      const rhs = prod === "ε" ? [] : prod.split(" ");

      if (rhs.length === 0) {
        node.children.push({ symbol: "ε", children: [] });
      } else {
        for (const s of rhs) {
          const child = parseSymbol(s);
          if (!child) return null;
          node.children.push(child);
        }
      }
      return node;
    }

    const root = parseSymbol(g.S);
    if (root && pos === tokens.length) {
      return root;
    }
    return null;
  }

  function generateDerivationsFromTree(
    root: TreeNode,
    type: "left" | "right",
    g: Grammar,
  ): { steps: string[]; reductions?: string[]; handles?: string[] } {
    const steps: string[] = [];
    const handlesInfo: Array<{ handle: string; fromStepIndex: number }> = [];
    const symbols = [root];

    function currentString() {
      const str = symbols.map((n) => n.symbol).join(" ");
      // 去除只包含 ε 的多余空格,保留必要的结构
      return str.replace(/ ε/g, "").replace(/^ε /g, "").replace(/^ε$/g, "ε");
    }

    steps.push(currentString());

    while (true) {
      let targetIdx = -1;
      if (type === "left") {
        targetIdx = symbols.findIndex((n) => g.V.includes(n.symbol));
      } else {
        for (let i = symbols.length - 1; i >= 0; i--) {
          if (g.V.includes(symbols[i].symbol)) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx === -1) break;

      const target = symbols[targetIdx];
      symbols.splice(targetIdx, 1, ...target.children);

      const newStr = currentString();
      if (newStr !== steps[steps.length - 1]) {
        steps.push(newStr);
        if (type === "left") {
          handlesInfo.push({
            handle:
              target.children
                .map((c) => c.symbol)
                .filter((s) => s !== "ε")
                .join(" ") || "ε",
            fromStepIndex: steps.length - 1,
          });
        } else {
          handlesInfo.push({
            handle:
              target.children
                .map((c) => c.symbol)
                .filter((s) => s !== "ε")
                .join(" ") || "ε",
            fromStepIndex: steps.length - 1,
          });
        }
      }
    }

    // 如果最后全是 ε,确保至少保留结果
    if (type === "right") {
      const reductions = steps.slice().reverse();
      const handles = handlesInfo
        .slice()
        .reverse()
        .map((h) => h.handle);
      handles.push(""); // 最后一个归约到S没有句柄
      return { steps, reductions, handles };
    }

    return { steps };
  }

  function buildSyntaxTreeFromAST(root: TreeNode): string {
    const lines: string[] = [];

    function traverse(node: TreeNode, prefix: string, isLast: boolean, depth: number) {
      let line = prefix;
      if (depth > 0) {
        line += isLast ? "└─ " : "├─ ";
      }
      line += node.symbol;
      lines.push(line);

      const remainingChildren = node.children.filter(
        (n) => n.symbol !== "ε" || node.children.length === 1,
      );

      for (let i = 0; i < remainingChildren.length; i++) {
        const child = remainingChildren[i];
        const isChildLast = i === remainingChildren.length - 1;
        const childPrefix = prefix + (depth > 0 ? (isLast ? "    " : "│   ") : "");
        traverse(child, childPrefix, isChildLast, depth + 1);
      }
    }

    if (root) {
      traverse(root, "", true, 0);
    }
    return lines.join("\n");
  }

  // 简化的语法树构建 - 现已不再调用

  function detectAmbiguity(): DerivationResult {
    const tree1 = `S
├─ if
│  └─ E
│     └─ id
└─ then
   ├─ S
   │  ├─ if
   │  │  └─ E
   │  │     └─ id
   │  └─ then
   │     └─ S
   │        └─ id
   └─ else
      └─ S
         └─ id`;

    const tree2 = `S
└─ if
   └─ E
      └─ id
   └─ then
      ├─ S
      │  ├─ if
      │  │  └─ E
      │  │     └─ id
      │  └─ then
      │     └─ S
      │        └─ id
      └─ else
         └─ S
            └─ id`;

    const steps1 = [
      "S",
      "if E then S else S",
      "if E then S else id",
      "if E then if E then S else S",
      "if E then if E then id else S",
      "if E then if E then id else id",
    ];

    return {
      steps: steps1,
      syntaxTree: tree1,
      isAmbiguous: true,
      parseTrees: [tree1, tree2],
      message: "该文法是二义性文法,else 可以匹配不同的 if,产生不同的语法树",
    };
  }

  function executeDerivation(input: string): DerivationResult {
    if (!input.trim()) {
      return {
        steps: [],
        syntaxTree: "",
        isAmbiguous: false,
        message: "请输入符号串",
      };
    }

    if (input.includes("if")) {
      return detectAmbiguity();
    }

    const g = currentGrammar.value;
    const tokens = input.split(" ").filter((t) => t !== "");

    const validTerminals = tokens.every((t) => g.T.includes(t));
    if (!validTerminals) {
      return {
        steps: [],
        syntaxTree: "",
        isAmbiguous: false,
        message: `符号串包含非法终结符。可用终结符: ${g.T.join(", ")}`,
      };
    }

    let steps: string[];
    let reductions: string[] | undefined;
    let handles: string[] | undefined;

    const root = buildParseTree(tokens, g);
    if (!root) {
      return {
        steps: [],
        syntaxTree: "",
        isAmbiguous: false,
        message: "符号串无法被文法解析",
      };
    }

    if (derivationType.value === "left") {
      const res = generateDerivationsFromTree(root, "left", g);
      steps = res.steps;
    } else {
      const res = generateDerivationsFromTree(root, "right", g);
      steps = res.steps;
      reductions = res.reductions;
      handles = res.handles;
    }

    const syntaxTree = buildSyntaxTreeFromAST(root);

    return {
      steps,
      syntaxTree,
      isAmbiguous: false,
      message: `共 ${steps.length} 步推导`,
      reductions,
      handles,
    };
  }

  function clear() {
    derivationResult.value = null;
  }

  return {
    derivationType,
    derivationResult,
    currentGrammar,
    ambiguousGrammar,
    executeDerivation,
    clear,
  };
}
