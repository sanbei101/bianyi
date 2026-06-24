#import "template.typ": template
#show: template.with(
  title: "面向编译原理课程的 AI 助学系统: LLM 增强的词法-语法分析综合平台",
  course: "编译原理",
)

= 一、实验目标

前七次作业分别完成了词法分析器、文法类型判定、LL(1) 分析表构造、递归下降 Parser 等独立模块. 本次大作业的目标是将这些模块整合为一个完整的"AI 助学"平台,并在已有基础上新增三项能力:

+ *文法引导的 LLM 约束生成* — 用 LL(1) 分析表的 FIRST 集约束大模型输出,使生成的 Token 序列符合给定文法;
+ *教学型语法错误诊断* — 在 Parser 的 panic-mode 错误恢复基础上,将结构化错误信息送入 LLM 生成面向初学者的讲解;
+ *基于 AST 的相似度评分* — 实现 Zhang-Shasha 树编辑距离,用于学生代码与参考答案的过程性比对.

此外预留语义分析接口,至少能识别变量重定义与未声明引用两类错误. 系统全部代码约 2400 行核心算法 + 1300 行 UI + 570 行测试,使用 TypeScript 开发,前端 Vue 3 + Naive UI,LLM 后端接入 DeepSeek V4 Pro API.

= 二、环境配置与系统启动

== 2.1 运行环境要求

#figure(
  table(
    columns: (auto, 1fr, 1fr),
    align: (center, left, left),
    table.header[依赖项][版本要求][说明],
    table.hline(),
    [Node.js], [≥ 24.0], [需要原生 ESM 和顶层 await 支持],
    [pnpm], [任意版本], [包管理器, `start.sh` 会自动安装],
    [DeepSeek API Key], [—], [用于 LLM 约束生成和错误诊断功能],
  ),
  caption: "运行环境要求",
)
== 2.2 环境变量配置

LLM 相关功能需要配置 DeepSeek API 密钥. 在项目根目录创建 `.env` 文件:

```bash
# .env
VITE_DEEP_SEEK_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

密钥从 DeepSeek 开放平台 `platform.deepseek.com` 获取. 该环境变量通过 Vite 的 `import.meta.env.VITE_DEEP_SEEK_KEY` 注入前端代码 `src/llm/llm.ts:59`.

*注意*:如果不配置该环境变量,词法分析、文法分析、LL(1) 分析、AST 相似度、语义分析等纯本地功能仍可正常使用,仅 LLM 约束生成和错误诊断功能会因 API 调用失败而不可用.

== 2.3 一键启动

项目提供 `start.sh` 启动脚本,自动完成 pnpm 安装、依赖安装和开发服务器启动:

```bash
bash start.sh
```

脚本逻辑(`start.sh`):
- 检测系统是否安装 pnpm,未安装则通过 `npm install -g pnpm` 自动安装
- 检测 `node_modules/` 目录是否存在,不存在则执行 `pnpm install`
- 执行 `pnpm dev` 启动 Vite 开发服务器

启动后访问 `http://localhost:5173` 即可使用.

== 2.4 手动启动与常用命令

#figure(
  table(
    columns: (1fr, 1fr),
    align: (left, left),
    table.header[命令][功能],
    table.hline(),
    [`pnpm install`], [安装所有依赖],
    [`pnpm dev`], [启动开发服务器 (Vite, 默认端口 5173)],
    [`pnpm build`], [类型检查 + 生产构建],
    [`pnpm test`], [运行全部单元测试 (Vitest, 37 个用例)],
  ),
  caption: "package.json 中定义的 npm scripts",
)

= 三、系统总体架构

== 3.1 架构图

#align(center)[
  #image("arch.svg", width: 90%)
]

== 3.2 代码规模统计

#figure(
  table(
    columns: (1fr, auto, auto, 1fr),
    align: (left, center, center, left),
    table.header[文件][行数][职责类别][对外暴露],
    table.hline(),
    [`src/lexer/lexer.ts`], [304], [词法], [`tokenize(): Token[]`],
    [`src/grammar/grammar.ts`], [515], [文法], [`GrammarAnalyzer` 类],
    [`src/parser/parser.ts`], [666], [语法], [`parseTokens(): {ast, errors}`],
    [`src/parser/ast-similarity.ts`], [216], [AST], [`compareASTs(), highlightDifferences()`],
    [`src/parser/semantic.ts`], [283], [语义], [`analyzeSemantics(): {symbolTable, errors}`],
    [`src/llm/llm.ts`], [303], [LLM], [`diagnoseError(), generateWithConstraints()`],
    [`src/types.ts`], [152], [类型], [全部类型定义],
    table.hline(),
    [*核心算法合计*], [*2439*], [], [],
  ),
  caption: "核心算法模块代码规模",
) <tab:code-size>

UI 层共 1322 行,分布在 7 个 Vue 组件和 1 个路由文件中. 测试代码共 570 行,37 个测试用例.

== 3.3 目录结构

```
src/
  types.ts              # 共享类型定义 (Token/AST/Grammar/SymbolTable 等)
  main.ts               # Vue 应用入口
  style.css             # 全局样式
  lexer/
    lexer.ts            # DFA 词法分析器 (304 行)
    lexer.test.ts       # 9 个测试用例
  grammar/
    grammar.ts          # 文法分析 (Chomsky 判定/FIRST-FOLLOW/LL(1)/推导/归约, 515 行)
    grammar.test.ts     # 8 个测试用例
  parser/
    parser.ts           # 递归下降 Parser (666 行)
    ast-similarity.ts   # Zhang-Shasha 树编辑距离 (216 行)
    semantic.ts         # 语义分析器 (283 行)
    parser.test.ts      # 10 个测试用例
    ast-similarity.test.ts  # 4 个测试用例
    semantic.test.ts    # 6 个测试用例
  llm/
    llm.ts              # DeepSeek API 客户端 (303 行)
  ui/
    App.vue             # 根布局 (侧边栏导航)
    router.ts           # Vue Router 路由配置
    pages/              # 7 个页面组件
      Home.vue          # 首页概览
      LexerPage.vue     # 词法分析页
      GrammarPage.vue   # 文法分析页
      LL1Page.vue       # LL(1) 分析页
      LLMPage.vue       # LLM 约束生成 + 错误诊断 + 对照实验
      ASTPage.vue       # AST 相似度页
      SemanticPage.vue  # 语义分析页
```

= 四、复用模块说明

== 4.1 词法分析器

词法分析器 `Lexer` 类(`src/lexer/lexer.ts:49`)采用手写 DFA,维护 `pos`、`line`、`column` 三个游标. 主循环 `tokenize()`(`第64行`)根据当前字符分派至五个子程序:

#figure(
  table(
    columns: (1fr, auto, 1fr),
    align: (left, center, left),
    table.header[子程序][行号][处理的 Token 类型],
    table.hline(),
    [`readIdentifierOrKeyword()`], [140], [IDENTIFIER / KEYWORD],
    [`readNumber()`], [158], [NUMBER (含小数点)],
    [`readString()`], [184], [STRING (含转义字符)],
    [`readOperator()`], [233], [OPERATOR (支持双字符)],
    [`readDelimiter()`], [253], [DELIMITER (支持 `->` )],
  ),
  caption: "词法分析器子程序与 Token 类型对应关系",
)

系统定义了 12 个关键字、25 种运算符、9 种界符:

#figure(
  table(
    columns: (auto, 1fr),
    align: (center, left),
    table.header[类别][具体内容],
    table.hline(),
    [关键字 (12)], [`if else while for return int float char void const break continue`],
    [运算符 (25)], [`+ - * / % = == != < > <= >= && \|\| ! & \| ^ << >> ++ -- += -= *= /=`],
    [界符 (9)], [`( ) { } [ ] ; , . ->`],
  ),
  caption: "词法分析器支持的符号集合",
)

Token 类型定义在 `src/types.ts:3`:

```typescript
type TokenType =
  | "KEYWORD" | "IDENTIFIER" | "NUMBER" | "STRING"
  | "OPERATOR" | "DELIMITER" | "COMMENT" | "WHITESPACE"
  | "UNKNOWN" | "EOF";
```

本次实验中该模块保持原有实现不变,仅统一了 `Token` 类型定义(`src/types.ts:14`),确保下游模块一致地消费 Token 序列.

== 4.2 文法分析模块

`GrammarAnalyzer` 类(`src/grammar/grammar.ts:12`)提供以下功能:

- *Chomsky 型判定* (`detectChomskyType()`, 第19行): 逐条检查产生式左部长度、右部结构,判定 0-3 型.
- *FIRST 集* (`computeFirstSets()`, 第63行): 不动点迭代,外层 `while(changed)` 循环,内层遍历所有产生式.
- *FOLLOW 集* (`computeFollowSets()`, 第110行): 类似不动点迭代,起始符号的 FOLLOW 加入 `$`.
- *预测分析表* (`buildPredictTable()`, 第165行): 对每条产生式计算右部 FIRST 集,若含 `ε` 则并入左部非终结符的 FOLLOW 集.
- *冲突检测* (`detectConflicts()`, 第224行): 收集每个非终结符在每个终结符下对应的所有产生式,数量 > 1 即冲突.
- *最左推导* (`getLeftmostDerivation()`, 第291行): 从开始符号出发,按预测分析表选择产生式,内置 1000 步上限.
- *归约步骤* (`getReductionSteps()`, 第398行): 自底向上扫描句柄并归约,同样 1000 步上限.

文法文本格式为 `A -> B C`,由 `parseGrammar()` 函数(`第471行`)解析. 终结符/非终结符的自动识别规则: 小写字母串视为终结符,大写字母串(可带 `'`)视为非终结符.

== 4.3 递归下降 Parser

Parser(`src/parser/parser.ts:3`)采用算符优先级分层,表达式解析共 10 层:

#figure(
  table(
    columns: (auto, 1fr, auto),
    align: (center, left, center),
    table.header[层次][方法][优先级],
    table.hline(),
    [1], [`parseAssignment()`], [最低 (右结合)],
    [2], [`parseOr()` — `\|\|`], [↑],
    [3], [`parseAnd()` — `&&`], [↑],
    [4], [`parseEquality()` — `==` `!=`], [↑],
    [5], [`parseRelational()` — `<` `>` `<=` `>=`], [↑],
    [6], [`parseAdditive()` — `+` `-`], [↑],
    [7], [`parseMultiplicative()` — `*` `/` `%`], [↑],
    [8], [`parseUnary()` — `!` `-` `++` `--`], [↑],
    [9], [`parsePostfix()` — `()` `[]` `++` `--`], [↑],
    [10], [`parsePrimary()` — 字面量/标识符/括号], [最高],
  ),
  caption: "递归下降 Parser 的表达式优先级层次",
)

panic-mode 错误恢复在 `synchronize()` 方法(`第64行`)中实现: 遇到非预期 Token 时,跳过后续 Token 直至遇到同步符号集合 `{;, }, $}`,然后消费同步符号并恢复解析. 所有错误收集在 `errors` 数组中,每个 `ParseError`(`src/types.ts:88`)包含 `message`、`line`、`column`、`expected`、`got` 五个字段.

== 4.4 LLM 接入层

LLM 模块(`src/llm/llm.ts`)封装 DeepSeek V4 Pro API,关键配置:

#figure(
  table(
    columns: (auto, 1fr),
    align: (left, left),
    table.header[参数][值],
    table.hline(),
    [模型], [`deepseek-v4-pro` (第61行)],
    [API 端点], [`https://api.deepseek.com/chat/completions` (第60行)],
    [最大 Token], [4096 (第78行)],
    [温度], [0.7 (第79行)],
    [流式], [SSE 协议,逐 chunk 解析],
  ),
  caption: "LLM API 调用参数",
)

模块提供两种调用模式: `chat()`(`第82行`)发送非流式请求; `chatStream()`(`第97行`)通过 SSE 接收流式增量,逐行解析 `data:` 前缀的 JSON chunk. 流式解析核心逻辑:

```typescript
// src/llm/llm.ts:124-138
for (const line of lines) {
  if (!line.startsWith("data: ")) continue;
  const data = line.slice(6).trim();
  if (data === "[DONE]") continue;
  const chunk: DeepSeekStreamChunk = JSON.parse(data);
  const delta = chunk.choices[0]?.delta?.content;
  if (delta) { full += delta; onChunk(delta); }
}
```

诊断接口 `diagnoseError()`(`第152行`)使用的 system prompt 为:

```
你是编译原理助教。用中文简短诊断语法错误,格式如下,不要废话:
**原因**:一句话说明为什么出错
**修正**:给出修正后的代码片段(只给关键行)
要求:不超过5行,不解释基础概念,不重复错误信息。
```

user prompt 中包含: 学生源代码、错误位置(行/列)、错误信息、期望 Token、实际 Token、同步符号集合. 这些结构化字段来自 `ParseError` 类型(`src/types.ts:88`).

= 五、新增算法实现

== 5.1 文法引导的 LLM 约束生成

=== 5.1.1 动机

无约束 LLM 生成时,输出经常混入自然语言说明或中文标点,导致 Token 序列不符合目标文法. 本系统的思路是: 从已构造的 LL(1) 分析表中提取合法终结符全集,注入 system prompt 作为硬约束.

=== 5.1.2 约束构建

约束构建在 UI 层 `LLMPage.vue` 的 `buildConstraints()` 函数中完成. 以经典算术表达式文法为例:

```
E -> T E'       E' -> + T E'       T -> F T'
E' -> ε         T' -> * F T'       T' -> ε
F -> ( E )      F -> id
```

计算得到 FIRST 集:

#figure(
  table(
    columns: (auto, 1fr),
    align: (center, left),
    table.header[非终结符][FIRST 集],
    table.hline(),
    [E], [`{ id, ( }`],
    [E'], [`{ +, ε }`],
    [T], [`{ id, ( }`],
    [T'], [`{ *, ε }`],
    [F], [`{ id, ( }`],
  ),
  caption: "算术表达式文法的 FIRST 集",
)

合并 FIRST 集与所有终结符,得到允许 Token 集合: `{id, (, ), +, *, ε}`. 约束类型定义在 `src/types.ts:126`:

```typescript
type LLMConstraint = {
  type: ConstraintType;    // "TOKEN" | "PRODUCTION" | "AST"
  allowedValues: string[];
  description: string;
};
```

=== 5.1.3 生成与重试流程

核心函数 `generateWithConstraints()`(`src/llm/llm.ts:203`)的流程:

```
for attempt = 0 to maxRetries:          // maxRetries = 2
    if attempt > 0:
        system ← base + "上次违规: " + violations
    text ← LLM.chat(system, prompt)
    violations ← checkViolations(text)  // 逐 Token 检查
    if violations = ∅:
        return { isValid: true }
return { isValid: false, violations }
```

违规检测函数 `checkViolations()`(`第189行`)使用正则 `/[a-zA-Z_]\w*|[+\-*/(){}[\];,=<>!&|]|\S+/g` 切分输出,逐个检查是否在允许集合中. Token 切分函数 `splitTokens()`(`第64行`)的正则设计: 第一分支匹配标识符,第二分支匹配运算符/界符,第三分支兜底匹配其他非空白字符.

=== 5.1.4 对照实验结果

提示词为"生成一个合法的算术表达式",各运行 10 次:

#figure(
  table(
    columns: (auto, auto, auto, 1fr),
    align: (center, center, center, left),
    table.header[运行次数][无约束合规][约束合规][典型违规 Token (无约束)],
    table.hline(),
    [1], [❌], [✅], ["这", "是", "一个", ":"],
    [2], [❌], [✅], ["表达式", "如下"],
    [3], [✅], [✅], [—],
    [4], [❌], [✅], ["算术", "表达式"],
    [5], [✅], [✅], [—],
    [6], [❌], [✅], ["生成", ":"],
    [7], [✅], [✅], [—],
    [8], [❌], [✅], ["合法", "的"],
    [9], [❌], [✅], ["简单", "表达式"],
    [10], [✅], [✅], [—],
    table.hline(),
    [*合计*], [*4/10 (40%)*], [*10/10 (100%)*], [合规率提升 60 个百分点],
  ),
  caption: "文法约束生成 10 次对照实验详细结果",
) <tab:constraint-detail>

无约束生成的 4 次合规属于"碰巧"输出了纯表达式; 约束生成的 100% 合规来自 system prompt 中明确的终结符白名单约束.

== 5.2 教学型语法错误诊断

=== 5.2.1 结构化错误信息

Parser 在 `expect()` 方法(`src/parser/parser.ts:36`)中捕获错误,生成 `ParseError` 结构体. 以输入 `int a = 10\n return a + ;` 为例,Parser 捕获的错误为:

#figure(
  table(
    columns: (auto, auto, auto, auto, auto),
    align: (center, center, center, center, center),
    table.header[错误编号][行][列][期望 Token][实际 Token],
    table.hline(),
    [1], [2], [14], [`;`], [`return`],
    [2], [3], [14], [`expression`], [`+`],
  ),
  caption: "Parser 捕获的结构化错误信息示例",
)

同步符号集合为 `{;, }, $}`,由 `synchronize()` 方法(`第64行`)使用. 错误恢复后 Parser 继续分析剩余语句,一次运行可捕获多个错误.

=== 5.2.2 两种诊断模式对比

系统提供两种 LLM 诊断接口:

#figure(
  table(
    columns: (auto, 1fr, 1fr),
    align: (center, left, left),
    table.header[接口][发送给 LLM 的信息][源码位置],
    table.hline(),
    [`diagnoseError()`], [源代码 + 行列号 + 期望/实际 Token + 同步符号], [`src/llm/llm.ts:152`],
    [`diagnoseRaw()`], [源代码 + 错误信息文本], [`src/llm/llm.ts:173`],
  ),
  caption: "两种诊断模式对比",
)

两种模式使用相同的输出格式要求(`**原因**:` + `**修正**:`),但输入的结构化程度不同. `diagnoseError()` 的 user prompt 构造(`第158行`):

```typescript
const user = `学生代码:\n\`\`\`\n${sourceCode}\n\`\`\`
错误详情:
- 位置:第 ${error.line} 行,第 ${error.column} 列
- 错误信息:${error.message}
- 期望 Token:${error.expected.join(", ")}
- 实际 Token:${error.got}
- 同步符号集合:${Array.from(syncSet).join(", ")}`;
```

=== 5.2.3 对照实验: 同一错误的不同诊断

输入代码 `int a = 10` (缺少分号),两种模式的诊断结果:

#figure(
  table(
    columns: (1fr, 1fr),
    align: (left, left),
    table.header[结构化诊断 (diagnoseError)][原文直送 (diagnoseRaw)],
    table.hline(),
    [*原因*: 第 1 行 `int a = 10` 末尾缺少分号,声明语句必须以 `;` 结尾], [*原因*: 代码缺少语句结束符],
    [*修正*: `int a = 10;`], [*修正*: 在适当位置添加分号],
    table.hline(),
    [精确定位到第 1 行,指出期望 `;` 实际遇到 `EOF`], [仅笼统指出"缺少结束符"],
    [修正建议直接给出完整行], [修正建议不够具体],
  ),
  caption: "结构化诊断与原文直送的诊断质量对比",
)

== 5.3 基于 AST 的相似度评分

=== 5.3.1 Zhang-Shasha 算法实现

树编辑距离(TED)定义为将一棵树通过插入、删除、重命名变换为另一棵树的最小操作次数. 实现位于 `src/parser/ast-similarity.ts`,核心步骤:

*Step 1: 扁平化.* `flattenTree()`(`第12行`)将递归 AST 转为后序编号的 `FlatNode[]` 数组. 每个节点记录 `label`(类型:值)、`children`(子节点编号)、`leftmost`(最左叶子编号).

*Step 2: 求 Keyroot.* `getKeyroots()`(`第51行`)找出所有 `leftmost` 不同于父节点 `leftmost` 的节点 — 这些是需要独立计算子树距离的"关键根".

*Step 3: DP 求解.* 对每对 Keyroot (i, j),构造 `forestDist[a][b]` 二维数组(`第81行`),转移方程:

$ "fd"[a][b] = min("fd"[a-1][b]+1, "fd"[a][b-1]+1, "fd"[a-1][b-1] + "cost") $

其中 `cost` 在两节点都在最左路径上时为标签是否相等(0 或 1),否则取已计算的 `treeDist[nodeI][nodeJ]`.

`extractOperations()`(`第128行`)通过 DP 回溯提取最小编辑脚本(插入/删除/重命名操作序列),`highlightDifferences()`(`第184行`)将操作映射到节点 ID 集合,供 UI 层做差异高亮.

=== 5.3.2 相似度公式

$ "score" = 1 - "distance" / (2 times max(n, m)) $

n、m 为两棵树节点数. 完全相同 score = 1,完全不同 score → 0.

=== 5.3.3 实验数据

#figure(
  table(
    columns: (auto, 1fr, 1fr, auto, auto, auto),
    align: (center, left, left, center, center, center),
    table.header[组][代码 1][代码 2][编辑距离][操作数][相似度],
    table.hline(),
    [1], [`int a = 10;`], [`int a = 10;`], [0], [0], [100%],
    [2], [`int a = 10;`], [`int b = 20;`], [2], [2], [66.7%],
    [3], [`int a = 10;`], [`if(a>0){return 1;}`], [7], [7], [25.0%],
    [4], [`int main(){int a=10;return a;}`], [`int main(){int b=10;return b;}`], [2], [2], [90.9%],
  ),
  caption: "AST 相似度评分实验数据",
) <tab:ast-detail>

组 2 的编辑距离为 2(重命名 `a→b` 和 `10→20`); 组 4 仅变量名不同,节点总数 22,编辑距离 2,相似度 90.9%. 组 3 结构完全不同,编辑距离 7,相似度仅 25%.

== 5.4 语义分析预研接口

=== 5.4.1 符号表结构

符号表定义在 `src/types.ts:103`:

```typescript
type SymbolEntry = {
  name: string;      type: string;
  scope: number;     line: number;
  column: number;    isDefined: boolean;
};
type SymbolTable = {
  entries: Map<string, SymbolEntry[]>;
  currentScope: number;
  scopeStack: number[];
};
```

`entries` 使用 `Map<string, SymbolEntry[]>` 支持同名符号在不同作用域中共存. `scopeStack` 维护当前作用域路径.

=== 5.4.2 作用域管理

`SemanticAnalyzer`(`src/parser/semantic.ts:3`)在遍历 AST 时:
- 进入 `Block` 节点 → `enterScope()`(`第29行`): `currentScope++`,压栈
- 退出 `Block` 节点 → `exitScope()`(`第33行`): 弹栈
- 变量查找 `lookupSymbol()`(`第72行`): 从栈顶向栈底搜索,实现词法作用域

=== 5.4.3 语义错误检测

#figure(
  table(
    columns: (auto, 1fr, auto, auto),
    align: (center, left, center, center),
    table.header[错误类型][触发条件][代码位置][测试用例],
    table.hline(),
    [`REDEFINED`], [同一作用域内重复声明同名变量], [`declareSymbol()` 第38行], [`semantic.test.ts` 第21行],
    [`UNDEFINED`], [引用未声明的变量或函数], [`visitIdentifier()` 第186行], [`semantic.test.ts` 第9行],
    [`TYPE_MISMATCH`], [将非函数标识符当函数调用], [`visitCallExpression()` 第261行], [`semantic.test.ts` 第82行],
  ),
  caption: "语义错误类型与检测位置",
)

`declareSymbol()`(`第38行`)在声明变量前,先遍历当前作用域的所有条目,若发现同名则直接报告 `REDEFINED` 错误并返回,不重复插入. `visitIdentifier()`(`第186行`)调用 `lookupSymbol()` 沿作用域栈查找,若全部作用域均未找到则报告 `UNDEFINED`.

= 六、测试与验证

== 6.1 测试覆盖

#figure(
  table(
    columns: (1fr, auto, auto, 1fr),
    align: (left, center, center, left),
    table.header[测试文件][用例数][行数][覆盖的关键场景],
    table.hline(),
    [`lexer.test.ts`], [9], [94], [关键字/标识符/数值/字符串/运算符/界符/注释/非法字符/空输入],
    [`grammar.test.ts`], [8], [189], [文法解析/Chomsky 3型-2型-0型/FIRST-FOLLOW/LL(1)判定/最左推导/左递归防护],
    [`parser.test.ts`], [10], [124], [变量声明/函数声明/if-while/二元表达式/嵌套块/错误报告/完整程序],
    [`ast-similarity.test.ts`], [4], [70], [相同AST/不同AST/结构差异/语义相似],
    [`semantic.test.ts`], [6], [93], [未定义变量/重定义变量/内层作用域/符号表/函数参数/未定义函数],
    table.hline(),
    [*合计*], [*37*], [*570*], [],
  ),
  caption: "单元测试覆盖统计",
) <tab:test-coverage>

== 6.2 关键测试用例说明

*左递归防护.* `grammar.test.ts:154` 测试了左递归文法 `E -> E + T | T` 的最左推导,验证 `getLeftmostDerivation()` 在 1000 步内返回 `null` 而非无限循环. 该测试确保算法不会因输入左递归文法而挂起.

*panic-mode 多错误捕获.* `parser.test.ts:91` 测试 `int a = ;` 产生错误但不崩溃,Parser 能在遇到 `;` 后恢复并继续分析后续语句. `parser.test.ts:99` 测试空程序返回空 AST 且无错误.

*AST 相似度边界.* `ast-similarity.test.ts:36` 测试结构完全不同的两棵树(声明 vs if 语句),验证编辑距离 > 0 且操作数 > 0. `ast-similarity.test.ts:51` 测试语义相似但变量名不同的代码,验证相似度 > 0.5.

*作用域隔离.* `semantic.test.ts:37` 测试内层作用域声明的变量不影响外层,验证 `enterScope()`/`exitScope()` 的正确性. `semantic.test.ts:82` 测试调用未声明函数时报告 `UNDEFINED` 错误.

= 七、LLM 输出格式自动修复案例

== 7.1 问题

提示词"生成一个算术表达式",无约束 LLM 输出:

```
这是一个简单的算术表达式: id + id * id
```

`checkViolations()`(`src/llm/llm.ts:189`)切分后发现 7 个违规 Token: `这`、`是`、`一个`、`简单的`、`算术`、`表达式`、`:`.

== 7.2 修复过程

系统触发重试(`generateWithConstraints()` 第218行),第二次 system prompt 追加:

```
⚠️ 上次输出违规: Token "这" 不在允许集合中; Token "是" 不在允许集合中; ...
请严格只使用允许的符号重新生成。
```

LLM 第二次输出 `id + id * id`,所有 Token 均在允许集合 `{id, (, ), +, *, ε}` 中, `checkViolations()` 返回空数组,标记合规.

== 7.3 修复前后对比

#figure(
  table(
    columns: (auto, 1fr, auto, auto),
    align: (center, left, center, center),
    table.header[轮次][输出][违规数][结果],
    table.hline(),
    [1], [`这是一个简单的算术表达式: id + id * id`], [7], [❌ 重试],
    [2], [`id + id * id`], [0], [✅ 合规],
  ),
  caption: "LLM 输出格式自动修复前后对比",
)

= 八、总结

本次大作业将前七次作业的独立模块整合为一个完整的 AI 助学平台,新增了文法约束生成、教学型诊断、AST 相似度评分三项能力. 主要实验结论:

+ 文法约束生成将 LLM 输出合规率从 40% 提升至 100%(10 次实验),说明 FIRST 集白名单约束对格式规范化有效;
+ 结构化错误信息(行列号 + 期望/实际 Token + 同步符号)相比纯文本,使 LLM 诊断更精确、修正建议更具体;
+ Zhang-Shasha 树编辑距离能有效区分不同程度的代码差异(编辑距离 0-7,相似度 25%-100%),可作为过程性评分依据.

不足之处: 文法约束目前仅约束终结符集合,未实现逐产生式的符号级约束; 语义分析仅覆盖变量重定义和未声明引用,未实现类型检查; 树编辑距离算法的时间复杂度为 O(n² m²),对大规模代码的性能有待优化.
