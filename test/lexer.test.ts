import { describe, it, expect } from "vitest";
import { tokenize } from "@/core/lexer";

describe("Lexer", () => {
  it("should tokenize keywords", () => {
    const code = "int float char void if else while for return";
    const tokens = tokenize(code);

    expect(tokens.filter((t) => t.type === "KEYWORD").length).toBe(10);
    expect(tokens.some((t) => t.value === "int")).toBe(true);
    expect(tokens.some((t) => t.value === "if")).toBe(true);
    expect(tokens.some((t) => t.value === "return")).toBe(true);
  });

  it("should tokenize identifiers", () => {
    const code = "int main;";
    const tokens = tokenize(code);

    const identifiers = tokens.filter((t) => t.type === "IDENTIFIER");
    expect(identifiers.length).toBe(1);
    expect(identifiers[0].value).toBe("main");
  });

  it("should tokenize numbers", () => {
    const code = "int a = 42; float b = 3.14;";
    const tokens = tokenize(code);

    const numbers = tokens.filter((t) => t.type === "NUMBER");
    expect(numbers.length).toBe(2);
    expect(numbers.some((t) => t.value === "42")).toBe(true);
    expect(numbers.some((t) => t.value === "3.14")).toBe(true);
  });

  it("should tokenize strings", () => {
    const code = 'char *s = "hello world";';
    const tokens = tokenize(code);

    const strings = tokens.filter((t) => t.type === "STRING");
    expect(strings.length).toBe(1);
    expect(strings[0].value).toBe("hello world");
  });

  it("should tokenize operators", () => {
    const code = "a + b - c * d / e % f";
    const tokens = tokenize(code);

    const operators = tokens.filter((t) => t.type === "OPERATOR");
    expect(operators.length).toBe(6);
  });

  it("should tokenize delimiters", () => {
    const code = "( ) { } [ ] ; ,";
    const tokens = tokenize(code);

    const delimiters = tokens.filter((t) => t.type === "DELIMITER");
    expect(delimiters.length).toBe(8);
  });

  it("should track line and column numbers", () => {
    const code = "int a;\nint b;";
    const tokens = tokenize(code);

    const intTokens = tokens.filter((t) => t.value === "int");
    expect(intTokens[0].line).toBe(1);
    expect(intTokens[1].line).toBe(2);
  });

  it("should handle comments", () => {
    const code = `// line comment
int a;
/* block comment */
int b;`;
    const tokens = tokenize(code);

    const identifiers = tokens.filter((t) => t.type === "IDENTIFIER");
    expect(identifiers.length).toBe(2);
    expect(identifiers[0].value).toBe("a");
    expect(identifiers[1].value).toBe("b");
  });

  it("should mark unknown characters", () => {
    const code = "int a @ b;";
    const tokens = tokenize(code);

    expect(tokens.some((t) => t.type === "UNKNOWN")).toBe(true);
  });

  it("should handle empty input", () => {
    const tokens = tokenize("");
    expect(tokens.length).toBe(1);
    expect(tokens[0].type).toBe("EOF");
  });
});
