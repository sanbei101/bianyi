import { describe, it, expect } from "vitest";

import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";

describe("Parser", () => {
  it("should parse variable declaration", () => {
    const code = "int a;";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.errors.length).toBe(0);
    expect(result.ast!.type).toBe("Program");
    expect(result.ast!.children.length).toBe(1);
    expect(result.ast!.children[0].type).toBe("Declaration");
  });

  it("should parse variable declaration with initialization", () => {
    const code = "int a = 10;";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.errors.length).toBe(0);
    const decl = result.ast!.children[0];
    expect(decl.type).toBe("Declaration");
    expect(decl.children.length).toBeGreaterThan(1);
  });

  it("should parse function declaration", () => {
    const code = "int add(int a, int b) { return a + b; }";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.errors.length).toBe(0);
    const func = result.ast!.children[0];
    expect(func.type).toBe("FunctionDeclaration");
  });

  it("should parse if statement", () => {
    const code = "if (a > 0) { return 1; }";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    const ifStmt = result.ast!.children[0];
    expect(ifStmt.type).toBe("IfStatement");
  });

  it("should parse if-else statement", () => {
    const code = "if (a > 0) { return 1; } else { return 0; }";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    const ifStmt = result.ast!.children[0];
    expect(ifStmt.type).toBe("IfStatement");
    expect(ifStmt.children.length).toBe(3);
  });

  it("should parse while loop", () => {
    const code = "while (i < 10) { i = i + 1; }";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    const whileStmt = result.ast!.children[0];
    expect(whileStmt.type).toBe("WhileStatement");
  });

  it("should parse binary expressions", () => {
    const code = "int a = 1 + 2 * 3;";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.errors.length).toBe(0);
  });

  it("should parse nested blocks", () => {
    const code = `{ int a; { int b; } }`;
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.errors.length).toBe(0);
  });

  it("should report errors for invalid syntax", () => {
    const code = "int a = ;";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("should parse empty program", () => {
    const code = "";
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.ast!.children.length).toBe(0);
  });

  it("should parse complete program", () => {
    const code = `int main() {
      int a = 10;
      int b = 20;
      if (a > b) {
        return a;
      } else {
        return b;
      }
    }`;
    const tokens = tokenize(code);
    const result = parseTokens(tokens);

    expect(result.ast).not.toBeNull();
    expect(result.ast!.type).toBe("Program");
  });
});
