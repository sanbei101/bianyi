import type { Token, ASTNode, ASTNodeType, ParseError } from "./types";

export class RecursiveDescentParser {
  private tokens: Token[];
  private pos: number;
  private errors: ParseError[];
  private syncTokens: Set<string>;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
    this.errors = [];
    this.syncTokens = new Set([";", "}", "$"]);
  }

  parse(): ASTNode {
    return this.parseProgram();
  }

  getErrors(): ParseError[] {
    return this.errors;
  }

  private current(): Token {
    return this.pos < this.tokens.length
      ? this.tokens[this.pos]
      : { type: "EOF", value: "", line: -1, column: -1 };
  }

  private _peek(_offset: number = 0): Token {
    const idx = this.pos + offset;
    return idx < this.tokens.length
      ? this.tokens[idx]
      : { type: "EOF", value: "", line: -1, column: -1 };
  }

  private advance(): Token {
    const token = this.current();
    this.pos++;
    return token;
  }

  private expect(type: Token["type"], value?: string): Token | null {
    const token = this.current();
    if (token.type !== type || (value && token.value !== value)) {
      this.addError(
        `Expected ${type}${value ? ` '${value}'` : ""}, got ${token.type} '${token.value}'`,
        [value || type],
      );
      return null;
    }
    return this.advance();
  }

  private match(type: Token["type"], value?: string): boolean {
    const token = this.current();
    return token.type === type && (!value || token.value === value);
  }

  private addError(message: string, expected: string[]): void {
    const token = this.current();
    this.errors.push({
      message,
      line: token.line,
      column: token.column,
      expected,
      got: token.value,
    });
  }

  private synchronize(): void {
    while (!this.syncTokens.has(this.current().value) && this.current().type !== "EOF") {
      this.advance();
    }
    if (this.syncTokens.has(this.current().value)) {
      this.advance();
    }
  }

  private createNode(
    type: ASTNodeType,
    value?: string | number,
    line?: number,
    column?: number,
  ): ASTNode {
    return {
      type,
      value,
      children: [],
      line,
      column,
      id: `${type}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private parseProgram(): ASTNode {
    const node = this.createNode("Program");
    node.line = 1;
    node.column = 1;

    while (this.current().type !== "EOF") {
      const stmt = this.parseStatement();
      if (stmt) {
        stmt.parent = node;
        node.children.push(stmt);
      }
    }

    return node;
  }

  private parseStatement(): ASTNode | null {
    if (
      this.match("KEYWORD", "int") ||
      this.match("KEYWORD", "float") ||
      this.match("KEYWORD", "char") ||
      this.match("KEYWORD", "void")
    ) {
      return this.parseDeclaration();
    }
    if (this.match("KEYWORD", "if")) {
      return this.parseIfStatement();
    }
    if (this.match("KEYWORD", "while")) {
      return this.parseWhileStatement();
    }
    if (this.match("KEYWORD", "for")) {
      return this.parseForStatement();
    }
    if (this.match("KEYWORD", "return")) {
      return this.parseReturnStatement();
    }
    if (this.match("DELIMITER", "{")) {
      return this.parseBlock();
    }
    if (this.match("KEYWORD", "break") || this.match("KEYWORD", "continue")) {
      return this.parseJumpStatement();
    }

    return this.parseExpressionStatement();
  }

  private parseDeclaration(): ASTNode | null {
    const node = this.createNode("Declaration");
    const typeToken = this.advance();
    node.value = typeToken.value;
    node.line = typeToken.line;
    node.column = typeToken.column;

    const nameToken = this.expect("IDENTIFIER");
    if (!nameToken) {
      this.synchronize();
      return null;
    }

    const idNode = this.createNode("Identifier", nameToken.value, nameToken.line, nameToken.column);
    idNode.parent = node;
    node.children.push(idNode);

    if (this.match("DELIMITER", "(")) {
      return this.parseFunctionDeclaration(node);
    }

    if (this.match("OPERATOR", "=")) {
      this.advance();
      const init = this.parseExpression();
      if (init) {
        init.parent = node;
        node.children.push(init);
      }
    }

    this.expect("DELIMITER", ";");
    return node;
  }

  private parseFunctionDeclaration(declNode: ASTNode): ASTNode | null {
    const node = this.createNode("FunctionDeclaration");
    node.line = declNode.line;
    node.column = declNode.column;
    node.value = declNode.value;

    if (declNode.children.length > 0) {
      declNode.children[0].parent = node;
      node.children.push(declNode.children[0]);
    }

    this.expect("DELIMITER", "(");

    const params = this.createNode("Parameter");
    params.line = this.current().line;
    params.column = this.current().column;
    params.parent = node;
    node.children.push(params);

    while (!this.match("DELIMITER", ")") && this.current().type !== "EOF") {
      if (
        this.match("KEYWORD", "int") ||
        this.match("KEYWORD", "float") ||
        this.match("KEYWORD", "char")
      ) {
        const type = this.advance();
        const name = this.expect("IDENTIFIER");
        if (name) {
          const param = this.createNode(
            "Parameter",
            `${type.value} ${name.value}`,
            name.line,
            name.column,
          );
          param.parent = params;
          params.children.push(param);
        }
      }
      if (this.match("DELIMITER", ",")) {
        this.advance();
      } else {
        break;
      }
    }

    this.expect("DELIMITER", ")");

    const body = this.parseBlock();
    if (body) {
      body.parent = node;
      node.children.push(body);
    }

    return node;
  }

  private parseBlock(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("Block");
    node.line = token.line;
    node.column = token.column;

    if (!this.expect("DELIMITER", "{")) {
      this.synchronize();
      return null;
    }

    while (!this.match("DELIMITER", "}") && this.current().type !== "EOF") {
      const stmt = this.parseStatement();
      if (stmt) {
        stmt.parent = node;
        node.children.push(stmt);
      }
    }

    this.expect("DELIMITER", "}");
    return node;
  }

  private parseIfStatement(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("IfStatement");
    node.line = token.line;
    node.column = token.column;

    this.advance();
    this.expect("DELIMITER", "(");

    const cond = this.parseExpression();
    if (cond) {
      cond.parent = node;
      node.children.push(cond);
    }

    this.expect("DELIMITER", ")");

    const thenStmt = this.parseStatement();
    if (thenStmt) {
      thenStmt.parent = node;
      node.children.push(thenStmt);
    }

    if (this.match("KEYWORD", "else")) {
      this.advance();
      const elseStmt = this.parseStatement();
      if (elseStmt) {
        elseStmt.parent = node;
        node.children.push(elseStmt);
      }
    }

    return node;
  }

  private parseWhileStatement(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("WhileStatement");
    node.line = token.line;
    node.column = token.column;

    this.advance();
    this.expect("DELIMITER", "(");

    const cond = this.parseExpression();
    if (cond) {
      cond.parent = node;
      node.children.push(cond);
    }

    this.expect("DELIMITER", ")");

    const body = this.parseStatement();
    if (body) {
      body.parent = node;
      node.children.push(body);
    }

    return node;
  }

  private parseForStatement(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("Statement");
    node.value = "for";
    node.line = token.line;
    node.column = token.column;

    this.advance();
    this.expect("DELIMITER", "(");

    if (!this.match("DELIMITER", ";")) {
      const init =
        this.match("KEYWORD", "int") ||
        this.match("KEYWORD", "float") ||
        this.match("KEYWORD", "char")
          ? this.parseDeclaration()
          : this.parseExpression();
      if (init) {
        init.parent = node;
        node.children.push(init);
      }
    }
    this.expect("DELIMITER", ";");

    if (!this.match("DELIMITER", ";")) {
      const cond = this.parseExpression();
      if (cond) {
        cond.parent = node;
        node.children.push(cond);
      }
    }
    this.expect("DELIMITER", ";");

    if (!this.match("DELIMITER", ")")) {
      const update = this.parseExpression();
      if (update) {
        update.parent = node;
        node.children.push(update);
      }
    }
    this.expect("DELIMITER", ")");

    const body = this.parseStatement();
    if (body) {
      body.parent = node;
      node.children.push(body);
    }

    return node;
  }

  private parseReturnStatement(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("ReturnStatement");
    node.line = token.line;
    node.column = token.column;

    this.advance();

    if (!this.match("DELIMITER", ";")) {
      const expr = this.parseExpression();
      if (expr) {
        expr.parent = node;
        node.children.push(expr);
      }
    }

    this.expect("DELIMITER", ";");
    return node;
  }

  private parseJumpStatement(): ASTNode | null {
    const token = this.current();
    const node = this.createNode("Statement");
    node.value = token.value;
    node.line = token.line;
    node.column = token.column;

    this.advance();
    this.expect("DELIMITER", ";");
    return node;
  }

  private parseExpressionStatement(): ASTNode | null {
    const expr = this.parseExpression();
    if (expr) {
      this.expect("DELIMITER", ";");
    }
    return expr;
  }

  private parseExpression(): ASTNode | null {
    return this.parseAssignment();
  }

  private parseAssignment(): ASTNode | null {
    const left = this.parseOr();

    if (
      this.match("OPERATOR", "=") ||
      this.match("OPERATOR", "+=") ||
      this.match("OPERATOR", "-=") ||
      this.match("OPERATOR", "*=") ||
      this.match("OPERATOR", "/=")
    ) {
      const op = this.advance();
      const right = this.parseOr();

      if (left && right) {
        const node = this.createNode("Assignment", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        return node;
      }
    }

    return left;
  }

  private parseOr(): ASTNode | null {
    let left = this.parseAnd();

    while (this.match("OPERATOR", "||")) {
      const op = this.advance();
      const right = this.parseAnd();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseAnd(): ASTNode | null {
    let left = this.parseEquality();

    while (this.match("OPERATOR", "&&")) {
      const op = this.advance();
      const right = this.parseEquality();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseEquality(): ASTNode | null {
    let left = this.parseRelational();

    while (this.match("OPERATOR", "==") || this.match("OPERATOR", "!=")) {
      const op = this.advance();
      const right = this.parseRelational();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseRelational(): ASTNode | null {
    let left = this.parseAdditive();

    while (
      this.match("OPERATOR", "<") ||
      this.match("OPERATOR", ">") ||
      this.match("OPERATOR", "<=") ||
      this.match("OPERATOR", ">=")
    ) {
      const op = this.advance();
      const right = this.parseAdditive();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseAdditive(): ASTNode | null {
    let left = this.parseMultiplicative();

    while (this.match("OPERATOR", "+") || this.match("OPERATOR", "-")) {
      const op = this.advance();
      const right = this.parseMultiplicative();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseMultiplicative(): ASTNode | null {
    let left = this.parseUnary();

    while (
      this.match("OPERATOR", "*") ||
      this.match("OPERATOR", "/") ||
      this.match("OPERATOR", "%")
    ) {
      const op = this.advance();
      const right = this.parseUnary();
      if (left && right) {
        const node = this.createNode("BinaryExpression", op.value, op.line, op.column);
        left.parent = node;
        right.parent = node;
        node.children.push(left, right);
        left = node;
      }
    }

    return left;
  }

  private parseUnary(): ASTNode | null {
    if (
      this.match("OPERATOR", "!") ||
      this.match("OPERATOR", "-") ||
      this.match("OPERATOR", "++") ||
      this.match("OPERATOR", "--")
    ) {
      const op = this.advance();
      const operand = this.parseUnary();
      if (operand) {
        const node = this.createNode("UnaryExpression", op.value, op.line, op.column);
        operand.parent = node;
        node.children.push(operand);
        return node;
      }
    }

    return this.parsePostfix();
  }

  private parsePostfix(): ASTNode | null {
    let left = this.parsePrimary();

    while (true) {
      if (this.match("DELIMITER", "(")) {
        this.advance();
        const node = this.createNode("CallExpression");
        node.line = left?.line;
        node.column = left?.column;
        if (left) {
          left.parent = node;
          node.children.push(left);
        }

        while (!this.match("DELIMITER", ")") && this.current().type !== "EOF") {
          const arg = this.parseExpression();
          if (arg) {
            arg.parent = node;
            node.children.push(arg);
          }
          if (this.match("DELIMITER", ",")) {
            this.advance();
          } else {
            break;
          }
        }

        this.expect("DELIMITER", ")");
        left = node;
      } else if (this.match("DELIMITER", "[")) {
        this.advance();
        const index = this.parseExpression();
        this.expect("DELIMITER", "]");
        if (left && index) {
          const node = this.createNode("BinaryExpression", "[]");
          node.line = left.line;
          node.column = left.column;
          left.parent = node;
          index.parent = node;
          node.children.push(left, index);
          left = node;
        }
      } else if (this.match("OPERATOR", "++") || this.match("OPERATOR", "--")) {
        const op = this.advance();
        if (left) {
          const node = this.createNode("UnaryExpression", `${op.value}_post`, op.line, op.column);
          left.parent = node;
          node.children.push(left);
          left = node;
        }
      } else {
        break;
      }
    }

    return left;
  }

  private parsePrimary(): ASTNode | null {
    const token = this.current();

    if (this.match("NUMBER")) {
      this.advance();
      return this.createNode(
        "NumberLiteral",
        Number.parseFloat(token.value),
        token.line,
        token.column,
      );
    }

    if (this.match("STRING")) {
      this.advance();
      return this.createNode("StringLiteral", token.value, token.line, token.column);
    }

    if (this.match("IDENTIFIER")) {
      this.advance();
      return this.createNode("Identifier", token.value, token.line, token.column);
    }

    if (this.match("DELIMITER", "(")) {
      this.advance();
      const expr = this.parseExpression();
      this.expect("DELIMITER", ")");
      return expr;
    }

    this.addError(`Unexpected token: ${token.value}`, ["expression"]);
    this.advance();
    return null;
  }
}

export function parseTokens(tokens: Token[]): { ast: ASTNode | null; errors: ParseError[] } {
  const parser = new RecursiveDescentParser(tokens);
  const ast = parser.parse();
  const errors = parser.getErrors();
  return { ast, errors };
}
