import type {
  Grammar,
  GrammarType,
  Production,
  FirstSet,
  FollowSet,
  PredictTable,
  LL1AnalysisResult,
  Conflict,
} from "../types";

export class GrammarAnalyzer {
  private grammar: Grammar;

  constructor(grammar: Grammar) {
    this.grammar = grammar;
  }

  detectChomskyType(): GrammarType {
    let isType3 = true;
    let isType2 = true;
    let isType1 = true;
    let hasNonContextFree = false;

    for (const prod of this.grammar.productions) {
      const leftLen = prod.left.length;
      const rightLen = prod.right.join(" ").length;

      // Type 0: 左边长度可以大于右边 (但右边为空时除外)
      // Type 1: 左边长度 <= 右边长度
      if (leftLen > rightLen && rightLen > 0) {
        isType1 = false;
        isType2 = false;
        isType3 = false;
        hasNonContextFree = true;
      }

      // Type 2: 左边必须是单个非终结符
      if (leftLen !== 1 || !this.grammar.nonTerminals.has(prod.left)) {
        isType2 = false;
        isType3 = false;
        hasNonContextFree = true;
      }

      if (isType3 && prod.right.length > 0) {
        const right = prod.right.join(" ");
        prod.right.some((s) => this.grammar.nonTerminals.has(s));
        const terminalPattern = /^[^A-Z]*(?:[A-Z][^A-Z]*)?$/;
        if (!terminalPattern.test(right)) {
          isType3 = false;
        }
      }
    }

    if (isType3) return "Type3";
    if (isType2) return "Type2";
    // 如果有非上下文无关的产生式,则是 Type 0
    if (hasNonContextFree) return "Type0";
    if (isType1) return "Type1";
    return "Type0";
  }

  computeFirstSets(): FirstSet {
    const first: FirstSet = new Map();

    for (const nt of this.grammar.nonTerminals) {
      first.set(nt, new Set());
    }

    let changed = true;
    while (changed) {
      changed = false;
      for (const prod of this.grammar.productions) {
        const firstSet = first.get(prod.left)!;
        const oldSize = firstSet.size;

        if (prod.right.length === 0 || prod.right[0] === "ε") {
          firstSet.add("ε");
        } else {
          for (const symbol of prod.right) {
            if (this.grammar.terminals.has(symbol)) {
              firstSet.add(symbol);
              break;
            }
            if (this.grammar.nonTerminals.has(symbol)) {
              const symbolFirst = first.get(symbol);
              if (symbolFirst) {
                for (const s of symbolFirst) {
                  if (s !== "ε") {
                    firstSet.add(s);
                  }
                }
                if (!symbolFirst.has("ε")) {
                  break;
                }
              }
            }
          }
        }

        if (firstSet.size > oldSize) {
          changed = true;
        }
      }
    }

    return first;
  }

  computeFollowSets(firstSets: FirstSet): FollowSet {
    const follow: FollowSet = new Map();

    for (const nt of this.grammar.nonTerminals) {
      follow.set(nt, new Set());
    }

    follow.get(this.grammar.startSymbol)!.add("$");

    let changed = true;
    while (changed) {
      changed = false;
      for (const prod of this.grammar.productions) {
        for (let i = 0; i < prod.right.length; i++) {
          const symbol = prod.right[i];
          if (!this.grammar.nonTerminals.has(symbol)) continue;

          const followSet = follow.get(symbol)!;
          const oldSize = followSet.size;

          if (i === prod.right.length - 1) {
            for (const f of follow.get(prod.left)!) {
              followSet.add(f);
            }
          } else {
            const nextSymbol = prod.right[i + 1];
            if (this.grammar.terminals.has(nextSymbol)) {
              followSet.add(nextSymbol);
            } else {
              const nextFirst = firstSets.get(nextSymbol);
              if (nextFirst) {
                for (const f of nextFirst) {
                  if (f !== "ε") {
                    followSet.add(f);
                  }
                }
                if (nextFirst.has("ε")) {
                  for (const f of follow.get(prod.left)!) {
                    followSet.add(f);
                  }
                }
              }
            }
          }

          if (followSet.size > oldSize) {
            changed = true;
          }
        }
      }
    }

    return follow;
  }

  buildPredictTable(firstSets: FirstSet, followSets: FollowSet): PredictTable {
    const table: PredictTable = new Map();

    for (const nt of this.grammar.nonTerminals) {
      table.set(nt, new Map());
    }

    for (const prod of this.grammar.productions) {
      const firstOfRight = this.computeFirstOfString(prod.right, firstSets);

      for (const terminal of firstOfRight) {
        if (terminal !== "ε") {
          const ntTable = table.get(prod.left)!;
          ntTable.set(terminal, prod);
        }
      }

      if (firstOfRight.has("ε")) {
        for (const terminal of followSets.get(prod.left)!) {
          const ntTable = table.get(prod.left)!;
          ntTable.set(terminal, prod);
        }
      }
    }

    return table;
  }

  private computeFirstOfString(symbols: string[], firstSets: FirstSet): Set<string> {
    const result = new Set<string>();

    if (symbols.length === 0 || symbols[0] === "ε") {
      result.add("ε");
      return result;
    }

    for (const symbol of symbols) {
      if (this.grammar.terminals.has(symbol)) {
        result.add(symbol);
        break;
      }
      if (this.grammar.nonTerminals.has(symbol)) {
        const first = firstSets.get(symbol);
        if (first) {
          for (const f of first) {
            if (f !== "ε") {
              result.add(f);
            }
          }
          if (!first.has("ε")) {
            break;
          }
        }
      }
    }

    return result;
  }

  detectConflicts(predictTable: PredictTable): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const [nt] of predictTable) {
      // 检查每个非终结符的预测表行
      const terminalMap: Map<string, Production[]> = new Map();

      // 收集每个终结符对应的所有产生式
      for (const prod of this.grammar.productions) {
        if (prod.left !== nt) continue;

        const firstSets = this.computeFirstSets();
        const followSets = this.computeFollowSets(firstSets);
        const firstOfRight = this.computeFirstOfString(prod.right, firstSets);

        // 对于FIRST集中的每个终结符
        for (const terminal of firstOfRight) {
          if (terminal !== "ε") {
            if (!terminalMap.has(terminal)) {
              terminalMap.set(terminal, []);
            }
            terminalMap.get(terminal)!.push(prod);
          }
        }

        // 如果产生式可以推导出ε,则对于FOLLOW集中的每个终结符
        if (firstOfRight.has("ε")) {
          for (const terminal of followSets.get(nt)!) {
            if (!terminalMap.has(terminal)) {
              terminalMap.set(terminal, []);
            }
            terminalMap.get(terminal)!.push(prod);
          }
        }
      }

      // 检查是否有冲突
      for (const [terminal, prods] of terminalMap) {
        if (prods.length > 1) {
          conflicts.push({
            type: "FIRST-FIRST",
            nonTerminal: nt,
            terminal,
            productions: prods,
          });
        }
      }
    }

    return conflicts;
  }

  analyzeLL1(): LL1AnalysisResult {
    const firstSets = this.computeFirstSets();
    const followSets = this.computeFollowSets(firstSets);
    const predictTable = this.buildPredictTable(firstSets, followSets);
    const conflicts = this.detectConflicts(predictTable);

    return {
      firstSets,
      followSets,
      predictTable,
      conflicts,
      isLL1: conflicts.length === 0,
    };
  }

  getLeftmostDerivation(input: string[]): Production[] | null {
    const derivation: Production[] = [];
    const sententialForm: string[] = [this.grammar.startSymbol];
    let pos = 0;
    let loopCount = 0;
    const maxLoops = 1000; // 防止无限循环

    while (sententialForm.length > 0) {
      loopCount++;
      if (loopCount > maxLoops) {
        return null; // 可能的无限循环
      }

      const symbol = sententialForm[0];

      if (this.grammar.terminals.has(symbol)) {
        if (pos >= input.length || input[pos] !== symbol) {
          return null;
        }
        sententialForm.shift();
        pos++;
      } else if (this.grammar.nonTerminals.has(symbol)) {
        const prod = this.findProduction(symbol, input[pos] || "$");
        if (!prod) {
          return null;
        }
        derivation.push(prod);
        sententialForm.shift();
        if (prod.right[0] !== "ε") {
          sententialForm.unshift(...prod.right);
        }
      } else {
        // 未知符号
        return null;
      }
    }

    return pos === input.length ? derivation : null;
  }

  private findProduction(nonTerminal: string, terminal: string): Production | null {
    // 缓存FIRST和FOLLOW集,避免重复计算
    const firstSets = this.computeFirstSets();
    const followSets = this.computeFollowSets(firstSets);

    for (const prod of this.grammar.productions) {
      if (prod.left !== nonTerminal) continue;

      const firstOfRight = this.computeFirstOfString(prod.right, firstSets);

      if (firstOfRight.has(terminal)) {
        return prod;
      }
      if (firstOfRight.has("ε")) {
        if (followSets.get(nonTerminal)?.has(terminal)) {
          return prod;
        }
      }
    }

    return null;
  }

  findHandle(sententialForm: string[]): Production | null {
    for (let i = 0; i < sententialForm.length; i++) {
      for (const prod of this.grammar.productions) {
        const right = prod.right;
        if (right.length === 0) continue;

        let match = true;
        for (let j = 0; j < right.length; j++) {
          if (sententialForm[i + j] !== right[j]) {
            match = false;
            break;
          }
        }

        if (match) {
          return prod;
        }
      }
    }

    return null;
  }
}

export function parseGrammar(grammarText: string): Grammar {
  const lines = grammarText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));

  const productions: Production[] = [];
  const nonTerminals = new Set<string>();
  const terminals = new Set<string>();
  let startSymbol = "";

  for (const line of lines) {
    const parts = line.split("->");
    if (parts.length !== 2) continue;

    const left = parts[0].trim();
    const right = parts[1].trim().split(/\s+/);

    if (!startSymbol) {
      startSymbol = left;
    }

    nonTerminals.add(left);
    productions.push({ left, right });

    for (const symbol of right) {
      if (symbol === "ε" || /^[a-z]+$/.test(symbol)) {
        if (symbol !== "ε") {
          terminals.add(symbol);
        }
      } else if (/^[A-Z]'*$/.test(symbol)) {
        nonTerminals.add(symbol);
      } else {
        terminals.add(symbol);
      }
    }
  }

  return {
    nonTerminals,
    terminals,
    productions,
    startSymbol,
  };
}
