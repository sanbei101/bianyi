import { describe, it, expect } from "vitest";

import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";
import { analyzeSemantics } from "@/core/semantic";

describe("Semantic Analysis", () => {
  it("should detect undefined variable", () => {
    const code = "int main() { return a; }";
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === "UNDEFINED")).toBe(true);
    }
  });

  it("should detect redefined variable", () => {
    const code = `int main() {
      int a = 10;
      int a = 20;
      return a;
    }`;
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.type === "REDEFINED")).toBe(true);
    }
  });

  it("should allow variable in inner scope", () => {
    const code = `int main() {
      int a = 10;
      {
        int b = 20;
        return a + b;
      }
    }`;
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.errors.length).toBe(0);
    }
  });

  it("should build symbol table", () => {
    const code = `int main() {
      int a = 10;
      float b = 3.14;
      return a;
    }`;
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.symbolTable.entries.size).toBeGreaterThan(0);
    }
  });

  it("should handle function parameters", () => {
    const code = `int add(int a, int b) {
      return a + b;
    }`;
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.errors.length).toBe(0);
    }
  });

  it("should detect undefined function call", () => {
    const code = `int main() {
      return foo();
    }`;
    const tokens = tokenize(code);
    const parseResult = parseTokens(tokens);

    if (parseResult.ast) {
      const result = analyzeSemantics(parseResult.ast);
      expect(result.errors.some((e) => e.type === "UNDEFINED")).toBe(true);
    }
  });
});
