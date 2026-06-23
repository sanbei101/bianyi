import { describe, it, expect } from "vitest";

import { compareASTs } from "@/core/ast-similarity";
import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";

describe("AST Similarity", () => {
  it("should return perfect similarity for identical ASTs", () => {
    const code = "int a = 10;";
    const tokens = tokenize(code);
    const result1 = parseTokens(tokens);
    const result2 = parseTokens(tokens);

    if (result1.ast && result2.ast) {
      const similarity = compareASTs(result1.ast, result2.ast);
      expect(similarity.score).toBe(1);
      expect(similarity.distance).toBe(0);
    }
  });

  it("should detect differences between ASTs", () => {
    const code1 = "int a = 10;";
    const code2 = "int b = 20;";
    const tokens1 = tokenize(code1);
    const tokens2 = tokenize(code2);
    const result1 = parseTokens(tokens1);
    const result2 = parseTokens(tokens2);

    if (result1.ast && result2.ast) {
      const similarity = compareASTs(result1.ast, result2.ast);
      expect(similarity.score).toBeLessThan(1);
      expect(similarity.distance).toBeGreaterThan(0);
    }
  });

  it("should handle structurally different ASTs", () => {
    const code1 = "int a = 10;";
    const code2 = "if (a > 0) { return 1; }";
    const tokens1 = tokenize(code1);
    const tokens2 = tokenize(code2);
    const result1 = parseTokens(tokens1);
    const result2 = parseTokens(tokens2);

    if (result1.ast && result2.ast) {
      const similarity = compareASTs(result1.ast, result2.ast);
      expect(similarity.score).toBeLessThan(1);
      expect(similarity.operations.length).toBeGreaterThan(0);
    }
  });

  it("should compute reasonable similarity for semantically similar code", () => {
    const code1 = `int main() {
      int a = 10;
      return a;
    }`;
    const code2 = `int main() {
      int b = 10;
      return b;
    }`;
    const tokens1 = tokenize(code1);
    const tokens2 = tokenize(code2);
    const result1 = parseTokens(tokens1);
    const result2 = parseTokens(tokens2);

    if (result1.ast && result2.ast) {
      const similarity = compareASTs(result1.ast, result2.ast);
      expect(similarity.score).toBeGreaterThan(0.5);
    }
  });
});
