import type { SymbolTable, SymbolEntry, SemanticError, ASTNode } from "./types";

export class SemanticAnalyzer {
  private symbolTable: SymbolTable;
  private errors: SemanticError[];

  constructor() {
    this.symbolTable = {
      entries: new Map(),
      currentScope: 0,
      scopeStack: [0],
    };
    this.errors = [];
  }

  analyze(ast: ASTNode): { symbolTable: SymbolTable; errors: SemanticError[] } {
    this.visitNode(ast);
    return { symbolTable: this.symbolTable, errors: this.errors };
  }

  getSymbolTable(): SymbolTable {
    return this.symbolTable;
  }

  getErrors(): SemanticError[] {
    return this.errors;
  }

  enterScope(): void {
    this.symbolTable.currentScope++;
    this.symbolTable.scopeStack.push(this.symbolTable.currentScope);
  }

  exitScope(): void {
    this.symbolTable.scopeStack.pop();
  }

  declareSymbol(name: string, type: string, line: number, column: number): void {
    const scope = this.symbolTable.currentScope;
    const key = `${name}_${scope}`;

    if (this.symbolTable.entries.has(key)) {
      this.errors.push({
        message: `Variable '${name}' is already defined in this scope`,
        line,
        column,
        type: "REDEFINED",
      });
      return;
    }

    const entry: SymbolEntry = {
      name,
      type,
      scope,
      line,
      column,
      isDefined: true,
    };

    if (!this.symbolTable.entries.has(name)) {
      this.symbolTable.entries.set(name, []);
    }
    this.symbolTable.entries.get(name)!.push(entry);
  }

  lookupSymbol(name: string): SymbolEntry | null {
    for (let i = this.symbolTable.scopeStack.length - 1; i >= 0; i--) {
      const scope = this.symbolTable.scopeStack[i];
      const entries = this.symbolTable.entries.get(name);
      if (entries) {
        for (const entry of entries) {
          if (entry.scope === scope) {
            return entry;
          }
        }
      }
    }
    return null;
  }

  private visitNode(node: ASTNode): void {
    switch (node.type) {
      case "Program":
        this.visitChildren(node);
        break;
      case "Block":
        this.enterScope();
        this.visitChildren(node);
        this.exitScope();
        break;
      case "Declaration":
        this.visitDeclaration(node);
        break;
      case "FunctionDeclaration":
        this.visitFunctionDeclaration(node);
        break;
      case "Identifier":
        this.visitIdentifier(node);
        break;
      case "Assignment":
        this.visitAssignment(node);
        break;
      case "IfStatement":
        this.visitIfStatement(node);
        break;
      case "WhileStatement":
        this.visitWhileStatement(node);
        break;
      case "ReturnStatement":
        this.visitReturnStatement(node);
        break;
      case "CallExpression":
        this.visitCallExpression(node);
        break;
      default:
        this.visitChildren(node);
    }
  }

  private visitChildren(node: ASTNode): void {
    for (const child of node.children) {
      this.visitNode(child);
    }
  }

  private visitDeclaration(node: ASTNode): void {
    const type = String(node.value || "");
    const idNode = node.children.find((c) => c.type === "Identifier");

    if (idNode) {
      this.declareSymbol(String(idNode.value || ""), type, idNode.line || 0, idNode.column || 0);
    }

    for (const child of node.children) {
      if (child.type !== "Identifier") {
        this.visitNode(child);
      }
    }
  }

  private visitFunctionDeclaration(node: ASTNode): void {
    const returnType = String(node.value || "");
    const nameNode = node.children.find((c) => c.type === "Identifier");

    if (nameNode) {
      this.declareSymbol(
        String(nameNode.value || ""),
        `function:${returnType}`,
        nameNode.line || 0,
        nameNode.column || 0,
      );
    }

    // 进入函数作用域
    this.enterScope();

    // 处理参数 - 参数在函数作用域内声明
    const paramsNode = node.children.find((c) => c.type === "Parameter");
    if (paramsNode) {
      for (const param of paramsNode.children) {
        const paramValue = String(param.value || "");
        const parts = paramValue.split(" ");
        if (parts.length === 2) {
          this.declareSymbol(parts[1], parts[0], param.line || 0, param.column || 0);
        }
      }
    }

    // 处理函数体
    const bodyNode = node.children.find((c) => c.type === "Block");
    if (bodyNode) {
      this.visitNode(bodyNode);
    }

    this.exitScope();
  }

  private visitIdentifier(node: ASTNode): void {
    const name = String(node.value || "");
    const symbol = this.lookupSymbol(name);

    if (!symbol) {
      this.errors.push({
        message: `Variable '${name}' is not defined`,
        line: node.line || 0,
        column: node.column || 0,
        type: "UNDEFINED",
      });
    }
  }

  private visitAssignment(node: ASTNode): void {
    if (node.children.length >= 1) {
      const left = node.children[0];
      if (left.type === "Identifier") {
        const name = String(left.value || "");
        const symbol = this.lookupSymbol(name);

        if (!symbol) {
          this.errors.push({
            message: `Variable '${name}' is not defined`,
            line: left.line || 0,
            column: left.column || 0,
            type: "UNDEFINED",
          });
        }
      }
    }

    this.visitChildren(node);
  }

  private visitIfStatement(node: ASTNode): void {
    if (node.children.length >= 1) {
      this.visitNode(node.children[0]);
    }
    if (node.children.length >= 2) {
      this.visitNode(node.children[1]);
    }
    if (node.children.length >= 3) {
      this.visitNode(node.children[2]);
    }
  }

  private visitWhileStatement(node: ASTNode): void {
    if (node.children.length >= 1) {
      this.visitNode(node.children[0]);
    }
    if (node.children.length >= 2) {
      this.visitNode(node.children[1]);
    }
  }

  private visitReturnStatement(node: ASTNode): void {
    this.visitChildren(node);
  }

  private visitCallExpression(node: ASTNode): void {
    if (node.children.length >= 1) {
      const callee = node.children[0];
      if (callee.type === "Identifier") {
        const name = String(callee.value || "");
        const symbol = this.lookupSymbol(name);

        if (!symbol) {
          this.errors.push({
            message: `Function '${name}' is not defined`,
            line: callee.line || 0,
            column: callee.column || 0,
            type: "UNDEFINED",
          });
        } else if (!symbol.type.startsWith("function:")) {
          this.errors.push({
            message: `'${name}' is not a function`,
            line: callee.line || 0,
            column: callee.column || 0,
            type: "TYPE_MISMATCH",
          });
        }
      }
    }

    for (let i = 1; i < node.children.length; i++) {
      this.visitNode(node.children[i]);
    }
  }
}

export function analyzeSemantics(ast: ASTNode): {
  symbolTable: SymbolTable;
  errors: SemanticError[];
} {
  const analyzer = new SemanticAnalyzer();
  return analyzer.analyze(ast);
}
