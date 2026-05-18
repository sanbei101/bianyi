import type { Token, TokenType } from "./types";

const keywords = new Set([
  "if",
  "else",
  "while",
  "for",
  "return",
  "int",
  "float",
  "char",
  "void",
  "const",
  "break",
  "continue",
]);

const operators = new Set([
  "+",
  "-",
  "*",
  "/",
  "%",
  "=",
  "==",
  "!=",
  "<",
  ">",
  "<=",
  ">=",
  "&&",
  "||",
  "!",
  "&",
  "|",
  "^",
  "<<",
  ">>",
  "++",
  "--",
  "+=",
  "-=",
  "*=",
  "/=",
]);

const delimiters = new Set(["(", ")", "{", "}", "[", "]", ";", ",", ".", "->"]);

export class Lexer {
  private source: string;
  private pos: number;
  private line: number;
  private column: number;
  private tokens: Token[];

  constructor(source: string) {
    this.source = source;
    this.pos = 0;
    this.line = 1;
    this.column = 1;
    this.tokens = [];
  }

  tokenize(): Token[] {
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) break;

      const char = this.peek();

      if (this.isAlpha(char) || char === "_") {
        this.readIdentifierOrKeyword();
      } else if (this.isDigit(char)) {
        this.readNumber();
      } else if (char === '"' || char === "'") {
        this.readString();
      } else if (char === "/" && this.peekNext() === "/") {
        this.skipLineComment();
      } else if (char === "/" && this.peekNext() === "*") {
        this.skipBlockComment();
      } else if (this.isOperatorStart(char)) {
        this.readOperator();
      } else if (this.isDelimiter(char)) {
        this.readDelimiter();
      } else {
        this.addToken("UNKNOWN", char);
        this.advance();
      }
    }

    this.addToken("EOF", "");
    return this.tokens;
  }

  private peek(): string {
    return this.pos < this.source.length ? this.source[this.pos] : "\0";
  }

  private peekNext(): string {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : "\0";
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;
    if (char === "\n") {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }
    return char;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  private skipLineComment(): void {
    while (this.pos < this.source.length && this.peek() !== "\n") {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    this.advance();
    this.advance();
    while (this.pos < this.source.length) {
      if (this.peek() === "*" && this.peekNext() === "/") {
        this.advance();
        this.advance();
        break;
      }
      this.advance();
    }
  }

  private readIdentifierOrKeyword(): void {
    const startLine = this.line;
    const startCol = this.column;
    let value = "";

    while (this.pos < this.source.length && (this.isAlphaNum(this.peek()) || this.peek() === "_")) {
      value += this.advance();
    }

    const type: TokenType = keywords.has(value) ? "KEYWORD" : "IDENTIFIER";
    this.tokens.push({
      type,
      value,
      line: startLine,
      column: startCol,
    });
  }

  private readNumber(): void {
    const startLine = this.line;
    const startCol = this.column;
    let value = "";
    let hasDot = false;

    while (this.pos < this.source.length) {
      const char = this.peek();
      if (this.isDigit(char)) {
        value += this.advance();
      } else if (char === "." && !hasDot) {
        hasDot = true;
        value += this.advance();
      } else {
        break;
      }
    }

    this.tokens.push({
      type: "NUMBER",
      value,
      line: startLine,
      column: startCol,
    });
  }

  private readString(): void {
    const startLine = this.line;
    const startCol = this.column;
    const quote = this.advance();
    let value = "";

    while (this.pos < this.source.length && this.peek() !== quote) {
      if (this.peek() === "\\") {
        this.advance();
        const escapeChar = this.advance();
        switch (escapeChar) {
          case "n":
            value += "\n";
            break;
          case "t":
            value += "\t";
            break;
          case "r":
            value += "\r";
            break;
          case "\\":
            value += "\\";
            break;
          case '"':
            value += '"';
            break;
          case "'":
            value += "'";
            break;
          default:
            value += escapeChar;
        }
      } else {
        value += this.advance();
      }
    }

    if (this.peek() === quote) {
      this.advance();
    }

    this.tokens.push({
      type: "STRING",
      value,
      line: startLine,
      column: startCol,
    });
  }

  private readOperator(): void {
    const startLine = this.line;
    const startCol = this.column;
    let value = this.advance();

    const twoChar = value + this.peek();
    if (operators.has(twoChar)) {
      value += this.advance();
    } else if (this.peek() === "=" && operators.has(`${value  }=`)) {
      value += this.advance();
    }

    this.tokens.push({
      type: "OPERATOR",
      value,
      line: startLine,
      column: startCol,
    });
  }

  private readDelimiter(): void {
    const startLine = this.line;
    const startCol = this.column;
    let value = this.advance();

    const twoChar = value + this.peek();
    if (delimiters.has(twoChar)) {
      value += this.advance();
    }

    this.tokens.push({
      type: "DELIMITER",
      value,
      line: startLine,
      column: startCol,
    });
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column,
    });
  }

  private isAlpha(char: string): boolean {
    return /[a-z]/i.test(char);
  }

  private isDigit(char: string): boolean {
    return /\d/.test(char);
  }

  private isAlphaNum(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private isOperatorStart(char: string): boolean {
    return "+-*/%=!<>&|^".includes(char);
  }

  private isDelimiter(char: string): boolean {
    return "(){}[];.,->".includes(char);
  }
}

export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
