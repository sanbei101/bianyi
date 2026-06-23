// 词法分析相关类型
export type TokenType =
  | "KEYWORD"
  | "IDENTIFIER"
  | "NUMBER"
  | "STRING"
  | "OPERATOR"
  | "DELIMITER"
  | "COMMENT"
  | "WHITESPACE"
  | "UNKNOWN"
  | "EOF";

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};

// AST 节点类型
export type ASTNodeType =
  | "Program"
  | "Statement"
  | "Expression"
  | "Identifier"
  | "NumberLiteral"
  | "StringLiteral"
  | "BinaryExpression"
  | "UnaryExpression"
  | "Assignment"
  | "Declaration"
  | "IfStatement"
  | "WhileStatement"
  | "Block"
  | "CallExpression"
  | "FunctionDeclaration"
  | "Parameter"
  | "ReturnStatement"
  | "Error";

export type ASTNode = {
  type: ASTNodeType;
  value?: string | number;
  children: ASTNode[];
  parent?: ASTNode;
  line?: number;
  column?: number;
  id: string;
};

// 文法相关类型
export type GrammarType = "Type0" | "Type1" | "Type2" | "Type3";

export type Production = {
  left: string;
  right: string[];
};

export type Grammar = {
  nonTerminals: Set<string>;
  terminals: Set<string>;
  productions: Production[];
  startSymbol: string;
};

// LL(1) 分析相关类型
export type FirstSet = Map<string, Set<string>>;
export type FollowSet = Map<string, Set<string>>;
export type PredictTable = Map<string, Map<string, Production | null>>;

export type LL1AnalysisResult = {
  firstSets: FirstSet;
  followSets: FollowSet;
  predictTable: PredictTable;
  conflicts: Conflict[];
  isLL1: boolean;
};

export type Conflict = {
  type: "FIRST-FIRST" | "FIRST-FOLLOW";
  nonTerminal: string;
  terminal: string;
  productions: Production[];
};

// 错误诊断相关类型
export type ParseError = {
  message: string;
  line: number;
  column: number;
  expected: string[];
  got: string;
};

export type PanicModeResult = {
  errors: ParseError[];
  recovered: boolean;
  syncSet: Set<string>;
};

// 语义分析相关类型
export type SymbolEntry = {
  name: string;
  type: string;
  scope: number;
  line: number;
  column: number;
  isDefined: boolean;
};

export type SymbolTable = {
  entries: Map<string, SymbolEntry[]>;
  currentScope: number;
  scopeStack: number[];
};

export type SemanticError = {
  message: string;
  line: number;
  column: number;
  type: "REDEFINED" | "UNDEFINED" | "TYPE_MISMATCH";
};

// LLM 相关类型
export type ConstraintType = "TOKEN" | "PRODUCTION" | "AST";

export type LLMConstraint = {
  type: ConstraintType;
  allowedValues: string[];
  description: string;
};

export type LLMGenerationResult = {
  text: string;
  tokens: Token[];
  isValid: boolean;
  violations: string[];
};

// AST 相似度相关类型
export type TreeEditOperation =
  | { type: "insert"; node: ASTNode; parent: ASTNode; position: number }
  | { type: "delete"; node: ASTNode }
  | { type: "rename"; node: ASTNode; newLabel: string };

export type ASTSimilarityResult = {
  score: number;
  distance: number;
  operations: TreeEditOperation[];
  mappedNodes: Map<string, string>;
};
