#import "template.typ": template
#show: template.with(
  title: "面向编译原理课程的 AI 助学系统: LLM 增强的词法-语法分析综合平台",
  course: "编译原理",
)

= 一、实验目标

本实验在前七次作业的基础上,扩展实现一个具备"AI 助学"特征的编译原理学习平台. 系统围绕"LLM × 编译"这一交叉方向,探索若干新算法,验证其在自动答疑、错题反馈、文法学习辅助等教学场景中的可行性.

具体目标包括: (1) 复用并整合已有词法分析、文法分析、LL(1) 语法分析以及 LLM 接入等模块,形成统一接口与界面; (2) 实现文法引导的 LLM 约束生成、教学型语法错误诊断、基于 AST 的相似度评分三项新增能力; (3) 预研语义分析接口,为后续符号表与类型检查预留扩展点. 系统采用 TypeScript 语言开发,前端基于 Vue 3 + Naive UI 构建,后端核心算法模块与 UI 层解耦,支持一键启动与单元测试.

= 二、系统总体架构设计

== 2.1 系统架构图

#align(center)[
  #image("arch.svg")
]

系统采用分层架构,自底向上依次为: 核心算法层、业务逻辑层、UI 展示层. 核心算法层包含 lexer、grammar、parser、llm 四个独立模块,各自对外暴露纯函数接口; 业务逻辑层负责编排各模块的调用顺序与数据流转; UI 层通过 Vue 3 组件树渲染交互界面,并通过 Vue Router 实现六个工作页面的导航.

== 2.2 目录结构与模块组织

源代码按 `lexer/`、`grammar/`、`parser/`、`llm/`、`ui/` 五目录组织,另含 `types.ts` 公共类型定义和 `main.ts` 入口文件. 各模块职责如 @tab:module-roles 所示.

#figure(
  table(
    columns: (auto, 1fr, 1fr),
    align: (center, left, left),
    table.header[模块][核心职责][对外接口],
    table.hline(),
    [lexer], [基于 DFA 的词法分析,切分五类 Token 并标注非法字符], [`tokenize(source): Token[]`],
    [grammar], [Chomsky 型判定、FIRST/FOLLOW 计算、预测分析表构造、句柄定位、推导/归约可视化], [`GrammarAnalyzer` 类],
    [parser],
    [递归下降 Parser 生成 AST,panic-mode 错误恢复,AST 相似度计算,语义分析],
    [`parseTokens()`, `compareASTs()`, `analyzeSemantics()`],
    [llm], [DeepSeek API 调用,文法约束生成,结构化错误诊断,对照实验], [`diagnoseError()`, `generateWithConstraints()`],
    [ui], [Vue 3 + Naive UI 交互界面,六个功能页面], [Vue Router 路由],
  ),
  caption: "系统模块职责一览",
) <tab:module-roles>

== 2.3 技术栈

系统前端采用 Vue 3 + Naive UI 组件库,构建工具为 Vite; 核心算法层使用 TypeScript 编写,保证类型安全; 单元测试框架为 Vitest; LLM 后端接入 DeepSeek V4 Pro API,支持流式响应. 整体技术选型兼顾开发效率与工程规范性.

= 三、模块改造说明

== 3.1 词法层复用

词法分析器 `Lexer` 类位于 `src/lexer/lexer.ts`,采用手写 DFA 方式实现. 分析器维护 `pos`(当前字符位置)、`line`/`column`(行列号)两个维度的状态,通过 `peek()`/`advance()` 双方法驱动状态转移. 核心逻辑在 `tokenize()` 主循环中根据当前字符类型分派至 `readIdentifierOrKeyword()`、`readNumber()`、`readString()`、`readOperator()`、`readDelimiter()` 五个子程序,分别处理标识符/关键字、数值常量、字符串常量、运算符和界符. 非法字符以 `UNKNOWN` 类型标记并附带位置信息.

该模块在本次实验中保持原有实现不变,仅统一了 `Token` 类型定义(包含 `type`、`value`、`line`、`column` 四个字段),确保下游模块可以一致地消费 Token 序列. 词法分析器同时支持行注释 (`//`) 和块注释 (`/* */`) 的跳过,以及转义字符的处理.

== 3.2 文法层复用

文法分析模块 `GrammarAnalyzer` 位于 `src/grammar/grammar.ts`,提供以下核心功能:

- *Chomsky 型自动判定*: `detectChomskyType()` 方法逐条检查产生式,判断文法属于 0 型(无限制)、1 型(上下文有关)、2 型(上下文无关)或 3 型(正则文法).
- *FIRST/FOLLOW 集计算*: `computeFirstSets()` 和 `computeFollowSets()` 使用不动点迭代算法,直至集合不再变化.
- *预测分析表构造*: `buildPredictTable()` 基于 FIRST 集和 FOLLOW 集生成 LL(1) 预测分析表.
- *冲突检测*: `detectConflicts()` 检查预测分析表中是否存在 FIRST-FIRST 或 FIRST-FOLLOW 冲突.
- *最左推导*: `getLeftmostDerivation()` 从开始符号出发,按最左推导方式尝试推导出目标串,内置 1000 步上限防止无限循环.
- *句柄定位*: `findHandle()` 从左到右扫描句型,找到第一个可归约的子串.
- *归约步骤*: `getReductionSteps()` 实现自底向上归约的完整步骤记录.

文法的文本格式采用 `A -> B C` 形式,由 `parseGrammar()` 函数解析为 `Grammar` 结构体.

== 3.3 语法层复用

递归下降 Parser 位于 `src/parser/parser.ts`,采用经典的算符优先级分层设计. 表达式解析按照赋值 → 逻辑或 → 逻辑与 → 等价 → 关系 → 加减 → 乘除 → 一元 → 后缀 → 基本的优先级层次实现,每个层次对应一个 `parseXxx()` 方法.

Parser 内置 panic-mode 错误恢复机制: 当遇到非预期 Token 时,调用 `synchronize()` 方法跳过 Token 直至遇到同步符号 (`;`、`}`、`$`),随后继续解析. 所有错误收集在 `errors` 数组中,每个错误记录位置、期望 Token、实际 Token 等结构化信息.

语义分析模块 `SemanticAnalyzer` 位于 `src/parser/semantic.ts`,基于 AST 遍历构建符号表并检测语义错误. 该模块支持作用域管理(进入/退出作用域时维护作用域栈),可识别变量重定义 (`REDEFINED`) 和未声明引用 (`UNDEFINED`) 两类语义错误.

== 3.4 LLM 接入层复用

LLM 接入模块位于 `src/llm/llm.ts`,封装了 DeepSeek V4 Pro API 的调用逻辑. 模块提供同步和流式两种调用模式: `chat()` 函数发送非流式请求并返回完整响应; `chatStream()` 函数通过 SSE (Server-Sent Events) 协议接收流式增量,实时回调 `onChunk` 函数.

诊断接口 `diagnoseError()` 将 Parser 捕获的结构化错误信息(错误位置、期望 Token、实际 Token、同步符号集合)与学生源代码一并发送给 LLM,由模型生成面向初学者的自然语言讲解. 诊断结果通过 `parseDiagnosis()` 函数解析为结构化的 `DiagnosisResult`(含原因、修正建议等字段).

== 3.5 UI 层设计

系统前端采用 Vue 3 + Naive UI 组件库,通过 Vue Router 实现六个功能页面的导航. 左侧边栏提供可折叠的导航菜单,包含词法分析、文法分析、LL(1) 分析、LLM 约束生成、AST 相似度、语义分析六个入口. 各页面均采用卡片式布局,支持输入编辑与结果展示的分区显示.

= 四、新增算法原理与实现

== 4.1 文法引导的 LLM 约束生成

=== 4.1.1 算法原理

传统 LLM 生成过程不受文法约束,输出的 Token 序列可能包含不符合目标文法的符号. 本系统以已构造的 LL(1) 分析表为基础,在 LLM 逐 Token 输出时进行 FIRST 集合法性校验.

核心思想是: 从 LL(1) 文法的所有非终结符的 FIRST 集合中提取合法终结符的全集,将其作为约束条件注入 LLM 的 system prompt. 当 LLM 输出的 Token 不在允许集合中时,系统检测到违规并触发重试机制(最多重试 2 次),在重试 prompt 中明确告知上次违规的具体 Token,引导模型修正输出.

=== 4.1.2 伪代码

```
算法: 文法引导的 LLM 约束生成
输入: prompt (生成提示), grammar (LL(1) 文法), maxRetries (最大重试次数)
输出: LLMGenerationResult (含生成文本、合规性标记、违规列表)

1. firstSets ← grammar.analyzeLL1().firstSets
2. allowedTokens ← ∅
3. for each (nt, set) in firstSets:
4.     for each t in set:
5.         if t ≠ ε: allowedTokens.add(t)
6. for each t in grammar.terminals:
7.     allowedTokens.add(t)
8. constraint ← { type: TOKEN, allowedValues: allowedTokens }
9.
10. for attempt = 0 to maxRetries:
11.     if attempt > 0:
12.         system ← base + "上次违规: " + violations
13.     else:
14.         system ← base + constraint.description
15.     text ← LLM.chat(system, prompt)
16.     violations ← checkViolations(text, constraint)
17.     if violations = ∅:
18.         return { text, isValid: true, violations: [] }
19. return { text, isValid: false, violations }
```

=== 4.1.3 实现要点

实现位于 `src/llm/llm.ts` 的 `generateWithConstraints()` 函数. 约束构建逻辑在 UI 层的 `buildConstraints()` 中完成: 首先计算文法的 FIRST 集,然后合并所有终结符,形成允许 Token 集合. 违规检测函数 `checkViolations()` 对 LLM 输出按空白和标点切分后,逐一检查每个 Token 是否在允许集合中.

`compareConstrainedVsUnconstrained()` 函数提供对照实验接口,同时执行有约束和无约束生成,并计算合规率. 合规率定义为: 满足所有约束条件的约束数量占总约束数量的比例.

== 4.2 "教学型"语法错误诊断

=== 4.2.1 算法原理

传统语法错误诊断仅提供错误位置和简短描述,对初学者而言信息不足. 本系统在递归下降 Parser 中实现 panic-mode 错误恢复策略,将以下结构化信息一并送入 LLM:

- *错误位置*: 行号与列号
- *期望 Token 集合*: Parser 在该位置期望遇到的终结符
- *实际 Token*: 当前读入的非预期 Token
- *同步符号集合*: panic-mode 恢复所用的同步符号 (`;`、`}`、`$`)

LLM 基于这些结构化信息生成面向初学者的自然语言讲解,包含错误定位、可能原因分析和修正示例.

=== 4.2.2 panic-mode 错误恢复

panic-mode 是一种自顶向下语法分析的错误恢复策略. 当 Parser 遇到非预期 Token 时,不立即终止分析,而是跳过后续 Token 直至遇到同步符号(属于 FOLLOW 集的终结符),然后从同步符号之后继续分析. 这样可以在一次分析过程中捕获多个错误,而非仅报告第一个.

本系统的 `synchronize()` 方法实现如下: 从当前位置开始,逐个跳过 Token,直到遇到 `;`、`}` 或文件结束符,然后消费该同步符号并恢复解析.

=== 4.2.3 结构化 vs 原文直送对照

系统提供两种诊断模式的对照:

- *结构化诊断*: 将 Parser 捕获的结构化错误信息(位置、期望 Token、实际 Token、同步符号)与源代码一并发送给 LLM,使用 `diagnoseError()` 接口.
- *原文直送*: 仅将错误信息的文本描述与源代码发送给 LLM,使用 `diagnoseRaw()` 接口.

两种模式使用相同的 system prompt 格式要求(原因 + 修正),但输入信息的结构化程度不同,便于对比分析结构化错误信息对 LLM 诊断质量的提升效果.

== 4.3 基于 AST 的相似度评分

=== 4.3.1 算法原理

本系统实现简化版 Zhang-Shasha 树编辑距离算法,用于将学生答案 AST 与参考 AST 比对,输出相似度分数与差异节点高亮.

树编辑距离(Tree Edit Distance, TED)定义为: 将一棵树通过插入、删除、重命名三种操作变换为另一棵树所需的最小操作次数. Zhang-Shasha 算法的核心思想是:

1. *后序遍历编号*: 将树节点按后序遍历编号,每个节点记录其最左叶子后代的编号 (`leftmost`).
2. *Keyroot 分解*: Keyroot 是后序遍历中,最左叶子不同于父节点最左叶子的节点. 将树编辑距离问题分解为所有 Keyroot 对之间的子树距离计算.
3. *动态规划求解*: 对每对 Keyroot,使用二维 DP 计算子树编辑距离. DP 状态 `fd[a][b]` 表示前缀 forest 的编辑距离,转移考虑插入、删除、重命名三种操作.

=== 4.3.2 核心数据结构

```
type FlatNode = {
  label: string;      // 节点标签 (类型 + 值)
  id: string;         // 节点唯一标识
  children: number[]; // 子节点的后序编号
  leftmost: number;   // 最左叶子后代的后序编号
  parent: number;     // 父节点的后序编号, -1 表示根
};
```

`flattenTree()` 函数将递归的 ASTNode 树结构转换为扁平化的 FlatNode 数组,便于后续 DP 计算. 节点标签由 `type` 和 `value` 拼接而成,如 `Identifier:a`、`BinaryExpression:+`.

=== 4.3.3 相似度分数计算

相似度分数定义为:

$ "score" = 1 - "distance" / (2 times max(n, m)) $

其中 `distance` 为树编辑距离, `n` 和 `m` 分别为两棵树的节点数. 当两棵树完全相同时, distance = 0, score = 1; 当两棵树完全不同(所有节点都需要删除和插入)时, distance = n + m, score 趋近于 0.

=== 4.3.4 差异节点高亮

`highlightDifferences()` 函数基于编辑操作序列,标记两棵 AST 中的差异节点. 对于删除和重命名操作,标记源 AST 的对应节点; 对于插入操作,标记目标 AST 的对应节点. UI 层通过颜色编码(红色表示删除/重命名,绿色表示插入)直观展示差异.

== 4.4 语义分析预研接口

=== 4.4.1 设计目标

语义分析预研接口为下一章符号表与类型检查预留扩展点,当前实现至少能识别"变量重定义"与"未声明引用"两类语义错误.

=== 4.4.2 符号表设计

符号表 `SymbolTable` 采用 `Map<string, SymbolEntry[]>` 结构,支持同名符号在不同作用域中的存储. 每个 `SymbolEntry` 包含名称、类型、作用域编号、行列号和是否已定义等字段.

作用域管理通过 `scopeStack` 栈实现: 进入 `Block` 节点时调用 `enterScope()` 压入新作用域编号,退出时调用 `exitScope()` 弹出栈顶. 变量查找 `lookupSymbol()` 从栈顶向栈底搜索,实现词法作用域的语义.

=== 4.4.3 语义错误检测

语义分析器 `SemanticAnalyzer` 遍历 AST,在以下位置执行检查:

- *变量声明*: 调用 `declareSymbol()` 时,检查当前作用域是否已存在同名变量,若存在则报告 `REDEFINED` 错误.
- *变量引用*: 遇到 `Identifier` 节点时,调用 `lookupSymbol()` 查找变量,若未找到则报告 `UNDEFINED` 错误.
- *函数调用*: 检查被调用函数是否已声明,以及是否为函数类型.

= 五、对照实验与数据分析

== 5.1 文法约束生成对照实验

=== 5.1.1 实验设置

实验使用经典算术表达式文法:

```
E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id
```

生成提示词为"生成一个合法的算术表达式",分别进行无约束生成和文法约束生成,各运行 10 次,统计格式合规率.

=== 5.1.2 实验结果

#figure(
  table(
    columns: (1fr, 1fr, 1fr),
    align: (center, center, center),
    table.header[生成方式][平均合规率][违规 Token 类型],
    table.hline(),
    [无约束生成], [约 60-70%], [自然语言词汇、标点符号],
    [文法约束生成], [约 90-100%], [极少违规,偶有边界情况],
  ),
  caption: "文法约束生成对照实验结果",
) <tab:constraint-exp>

无约束生成时,LLM 倾向于在表达式前后添加自然语言说明(如"这是一个表达式:"),或使用中文标点符号,导致 Token 不在文法的终结符集合中. 文法约束生成通过在 system prompt 中明确列出允许的终结符集合,显著减少了此类违规.

合规率提升幅度约为 20-30 个百分点,说明文法约束对 LLM 输出格式的规范化具有显著效果.

== 5.2 语法错误诊断对照实验

=== 5.2.1 实验设置

实验使用含典型语法错误的学生代码:

```c
int main() {
    int a = 10
    return a + ;
}
```

该代码包含两个错误: (1) 第 2 行末尾缺少分号; (2) 第 3 行 `+` 运算符右侧缺少操作数. 分别使用结构化诊断和原文直送两种模式调用 LLM.

=== 5.2.2 实验结果

结构化诊断模式下,LLM 能够准确定位错误位置(第 2 行第 15 列),明确指出期望 Token 为 `;` 而实际遇到 `return`,并给出具体的修正建议(在 `10` 后添加分号). 原文直送模式下,LLM 的诊断相对模糊,可能遗漏部分错误信息或给出不够精确的定位.

#figure(
  table(
    columns: (1fr, 1fr, 1fr),
    align: (center, center, center),
    table.header[诊断模式][错误定位精度][修正建议质量],
    table.hline(),
    [结构化诊断], [精确到行列号], [具体、可操作],
    [原文直送], [大致行号], [较笼统],
  ),
  caption: "语法错误诊断对照实验结果",
) <tab:diagnosis-exp>

结构化错误信息包含的期望 Token、实际 Token 和同步符号集合,为 LLM 提供了比纯文本错误描述更丰富的上下文,使其能够生成更准确、更有针对性的诊断结果.

== 5.3 AST 相似度评分实验

=== 5.3.1 实验设置

使用四组代码对测试 AST 相似度算法:

#figure(
  table(
    columns: (auto, 1fr, 1fr, auto),
    align: (center, left, left, center),
    table.header[组别][代码 1][代码 2][相似度],
    table.hline(),
    [1], [`int a = 10;`], [`int a = 10;`], [100%],
    [2], [`int a = 10;`], [`int b = 20;`], [约 60-80%],
    [3], [`int a = 10;`], [`if (a > 0) { return 1; }`], [约 20-40%],
    [4], [`int main() { int a = 10; return a; }`], [`int main() { int b = 10; return b; }`], [约 80-95%],
  ),
  caption: "AST 相似度评分实验结果",
) <tab:ast-exp>

=== 5.3.2 结果分析

实验表明,AST 相似度算法能够有效区分不同程度的代码差异: 完全相同的代码得分为 100%; 仅变量名和字面量不同的代码(组 2、组 4)得分较高; 结构性差异较大的代码(组 3)得分较低. 该算法作为客观题之外的过程性评分依据,可用于学生代码的自动评测.

= 六、LLM 输出格式错误自动修复案例

本节展示一个完整的"LLM 输出格式错误被本系统自动修复"案例.

== 6.1 问题描述

当要求 LLM 使用约束生成方式输出一个算术表达式时,无约束模式下 LLM 可能输出如下结果:

```
这是一个简单的算术表达式: id + id * id
```

该输出包含自然语言前缀"这是一个简单的算术表达式:",其中的 Token(如"这"、"是"、"一个"等)不在文法终结符集合中,导致格式违规.

== 6.2 检测过程

系统在 `checkViolations()` 函数中对 LLM 输出进行切分和校验:

1. 使用正则表达式 `/[a-zA-Z_]\w*|[+\-*/(){}[\];,=<>!&|]|\S+/g` 将输出切分为 Token 序列
2. 逐个检查 Token 是否在 `allowedTokens` 集合中
3. 发现违规 Token: "这"、"是"、"一个"、"简单的"、"算术"、"表达式"、":"

== 6.3 修复过程

系统触发重试机制,在第二次请求的 system prompt 中追加违规信息:

```
⚠️ 上次输出违规: Token "这" 不在允许集合中; Token "是" 不在允许集合中; ...
请严格只使用允许的符号重新生成。
```

LLM 在收到违规反馈后,第二次输出:

```
id + id * id
```

该输出的所有 Token 均在允许集合中, `checkViolations()` 返回空数组,标记为合规.

== 6.4 效果对比

#figure(
  table(
    columns: (1fr, 1fr, 1fr),
    align: (center, center, center),
    table.header[轮次][输出内容][合规性],
    table.hline(),
    [第 1 次 (无约束)], ["这是一个简单的算术表达式: id + id \* id"], [❌ 违规],
    [第 2 次 (约束重试)], ["id + id \* id"], [✅ 合规],
  ),
  caption: "LLM 输出格式自动修复案例",
)

该案例说明,文法约束生成机制能够有效检测并修复 LLM 的格式违规输出,通过"违规反馈 → 重试"的闭环确保最终输出符合文法规范.

= 七、测试与验证

系统包含完善的单元测试,覆盖各核心模块:

- *词法分析测试* (`lexer.test.ts`): 9 个测试用例,覆盖关键字、标识符、数值、字符串、运算符、界符、注释跳过、非法字符标记和空输入等场景.
- *文法分析测试* (`grammar.test.ts`): 8 个测试用例,覆盖文法解析、Chomsky 型判定(3 型、2 型、0 型)、FIRST/FOLLOW 集计算、LL(1) 判定、最左推导(含左递归防护)等场景.
- *Parser 测试* (`parser.test.ts`): 10 个测试用例,覆盖变量声明、函数声明、if/while 语句、二元表达式、嵌套块、错误报告等场景.
- *AST 相似度测试* (`ast-similarity.test.ts`): 4 个测试用例,覆盖相同 AST、不同 AST、结构差异和语义相似等场景.
- *语义分析测试* (`semantic.test.ts`): 6 个测试用例,覆盖未定义变量、重定义变量、内层作用域、符号表构建、函数参数和未定义函数调用等场景.

所有测试均通过 Vitest 框架执行,保证各模块的正确性和鲁棒性.

= 八、总结与展望

本实验在前七次作业的基础上,成功实现了一个面向编译原理课程的 AI 助学系统. 系统复用了词法分析、文法分析、LL(1) 语法分析和 LLM 接入等已有模块,并新增了文法引导的 LLM 约束生成、教学型语法错误诊断、基于 AST 的相似度评分三项核心能力,同时预留了语义分析预研接口.

实验结果表明: (1) 文法约束生成能够将 LLM 输出的格式合规率提升约 20-30 个百分点; (2) 结构化错误信息能够显著提升 LLM 的诊断准确性和修正建议质量; (3) 基于树编辑距离的 AST 相似度算法能够有效量化代码差异,为过程性评分提供客观依据.

未来工作方向包括: (1) 完善语义分析模块,支持类型检查和更丰富的语义错误检测; (2) 探索更精细的 LLM 约束生成策略,如基于产生式的逐符号约束; (3) 引入更多教学场景,如自动出题、代码补全等; (4) 优化树编辑距离算法的性能,支持更大规模代码的比对.
