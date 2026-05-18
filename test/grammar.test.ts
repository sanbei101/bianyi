import { describe, it, expect } from "vitest";
import { GrammarAnalyzer, parseGrammar } from "@/core/grammar";

describe("Grammar", () => {
  describe("parseGrammar", () => {
    it("should parse simple grammar", () => {
      const grammarText = `S -> A B
A -> a
B -> b`;
      const grammar = parseGrammar(grammarText);

      expect(grammar.startSymbol).toBe("S");
      expect(grammar.productions.length).toBe(3);
      expect(grammar.nonTerminals.has("S")).toBe(true);
      expect(grammar.nonTerminals.has("A")).toBe(true);
      expect(grammar.terminals.has("a")).toBe(true);
    });

    it("should parse grammar with epsilon", () => {
      const grammarText = `S -> A
A -> a
A -> ε`;
      const grammar = parseGrammar(grammarText);

      const epsilonProd = grammar.productions.find(
        (p) => p.right.length === 1 && p.right[0] === "ε",
      );
      expect(epsilonProd).toBeDefined();
    });
  });

  describe("Chomsky type detection", () => {
    it("should detect Type 3 (regular) grammar", () => {
      const grammarText = `S -> a S
S -> b`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);

      expect(analyzer.detectChomskyType()).toBe("Type3");
    });

    it("should detect Type 2 (context-free) grammar", () => {
      const grammarText = `S -> A B
A -> a
B -> b`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);

      expect(analyzer.detectChomskyType()).toBe("Type2");
    });

    it("should detect Type 0 grammar", () => {
      const grammarText = `a S b -> a A b
A -> c`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);

      expect(analyzer.detectChomskyType()).toBe("Type0");
    });
  });

  describe("FIRST sets", () => {
    it("should compute FIRST sets correctly", () => {
      const grammarText = `E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);
      const firstSets = analyzer.computeFirstSets();

      expect(firstSets.get("E")).toContain("id");
      expect(firstSets.get("E")).toContain("(");
      expect(firstSets.get("E'")).toContain("+");
      expect(firstSets.get("E'")).toContain("ε");
    });
  });

  describe("FOLLOW sets", () => {
    it("should compute FOLLOW sets correctly", () => {
      const grammarText = `E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);
      const firstSets = analyzer.computeFirstSets();
      const followSets = analyzer.computeFollowSets(firstSets);

      expect(followSets.get("E")).toContain("$");
      expect(followSets.get("E'")).toContain("$");
      expect(followSets.get("E'")).toContain(")");
    });
  });

  describe("LL(1) analysis", () => {
    it("should detect LL(1) grammar", () => {
      const grammarText = `E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);
      const result = analyzer.analyzeLL1();

      expect(result.isLL1).toBe(true);
      expect(result.conflicts.length).toBe(0);
    });

    it("should detect non-LL(1) grammar", () => {
      const grammarText = `S -> A a
S -> B a
A -> ε
B -> ε`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);
      const result = analyzer.analyzeLL1();

      expect(result.isLL1).toBe(false);
    });
  });

  describe("Leftmost derivation", () => {
    it("should compute leftmost derivation", () => {
      const grammarText = `E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`;
      const grammar = parseGrammar(grammarText);
      const analyzer = new GrammarAnalyzer(grammar);
      const derivation = analyzer.getLeftmostDerivation(["id", "+", "id"]);

      expect(derivation).not.toBeNull();
      expect(derivation!.length).toBeGreaterThan(0);
    });
  });
});
