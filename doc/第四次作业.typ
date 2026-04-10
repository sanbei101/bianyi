#import "cover.typ": cover
#cover(
  title: "第四次作业",
  course: "编译原理",
  class: "计算231",
  student-id: "2023308250117",
  student-name: "龚浩然",
)

= 作业1：计算机学习助手基础功能升级
== 作业目标

巩固本次课文法句柄、0-3型文法分类、词法分析基础核心概念，完成智能学习助手的基础模块升级，实现自动解析与判定功能。

功能要求

1. 框架复用：沿用之前的主程序框架，集成新功能；
2. 文法句柄基础模块
  1. 内置算术表达式上下文无关文法，讲解句柄的定义；
  2. 输入任意合法句型，自动查找并标注句柄，输出解析结果；
3. 乔姆斯基文法自动判定模块
  1. 实现输入任意文法产生式，自动判定属于0型/1型/2型/3型文法；
  2. 输出判定依据（对应文法的规则特征）；
4. 词法分析基础模块
  1. 定义计算机专业词法单元：关键字、标识符、常数、运算符、界符；

  2. 对简单算术表达式（如 $x = 5 + a * 10$）完成基础词法切分，输出拆分后的符号列表；
5. 专业课问答升级：新增「句柄、四类文法、词法分析」基础概念智能问答。


= 作业2：计算机学习助手进阶功能开发
== 作业目标

深化句柄、四类文法的应用，实现简易词法分析工具，整合所有模块，形成最终版完整的计算机专业课智能学习助手。
功能要求

1. 句柄可视化
  1. 实现基于句柄的最左归约步骤可视化，与最左推导双向对应展示；
  2. 每一步归约自动标注当前句型的句柄，完整演示「推导→归约」流程；
2. 四类文法速查
  1. 制作0/1/2/3型文法交互式对比表（规则、限制、典型例子、应用场景）；
  2. 支持手动输入文法，快速验证分类结果，强化知识点记忆；


= 网页链接

== `https://bianyi.vercel.app`

== 源代码: `https://github.com/sanbei101/bianyi/tree/task4`

#image("assets/截图 2026-04-10 10-21-37.png")
#image("assets/截图 2026-04-10 10-21-37.png")
= 计算机专业课智能学习助手 - 核心算法讲解

== 1. 词法分析 (LexerModule.vue)

=== 算法：状态机逐字符扫描

```typescript
while (i < code.length) {
    char = code[i]

    // 跳过空白符
    if (/\s/.test(char)) { i++; continue }

    // 标识符/关键字识别 ([a-zA-Z_][a-zA-Z0-9_]*)
    if (/[a-zA-Z_]/.test(char)) {
        while (/[a-zA-Z0-9_]/.test(code[i])) val += code[i++]
        tokens.push({ type: keywords.includes(val) ? '关键字' : '标识符', value: val })
    }

    // 常数识别 (\d+)
    if (/\d/.test(char)) {
        while (/\d/.test(code[i])) val += code[i++]
        tokens.push({ type: '常数', value: val })
    }

}
```

=== 五种词法单元


#table(
  columns: (100pt, 1fr),
  align: (center, left),

  [类型], [正则规则 + 示例],
  [关键字], [`[a-zA-Z_]+` 查表，示例],
  [标识符], [`[a-zA-Z_][a-zA-Z0-9_]*`，示例],
  [常数], [`\d+`，示例],
  [运算符], [`[=+\-*/><]`，示例],
  [界符], [`[();,{}]`，示例],
)

=== 示例

输入：`x = 5 + a * 10`


#table(
  columns: (100pt, 1fr),
  align: (center, left),

  [Token], [类型],
  [x], [标识符],
  [=], [运算符],
  [5], [常数],
  [+], [运算符],
  [a], [标识符],
  [\*], [运算符],
  [10], [常数],
)

---

== 2. 乔姆斯基文法分类 (ChomskyModule.vue)

=== 四类文法判定算法

```
对每条产生式 left → right 检测：

0型: left 至少含一个大写字母（非终结符）
1型: |left| ≤ |right|（长度约束），排除 S→ε
2型: left 是单个大写字母
3型: 2型基础上 + (右线性 OR 左线性)
     - 右线性: A → aB 或 A → a（终结符在前，非终结符在后）
     - 左线性: A → Ba 或 A → a（非终结符在前，终结符在后）
```

=== 判定顺序

```
isType3 → isType2 → isType1 → isType0
```

=== 示例


#table(
  columns: (100pt, 1fr),
  align: (center, left),

  [文法], [类型],
  [`S → aSBE`], [0型],
  [`S → aS`, `S → a`], [3型（右线性）],
  [`A → Bc`, `A → c`], [2型],
  [`aA → aB`], [1型],
)
---

== 3. 递归下降分析 (useParser.ts)

=== 文法（消除左递归）

```
E  → T E'
E' → + T E' | - T E' | ε
T  → F T'
T' → * F T' | / F T' | ε
F  → ( E ) | id
```

=== 算法：每个非终结符对应一个 parse 函数

```typescript
function parseE(): boolean {
    derivationSteps.push(`E → T E'`)
    if (!parseT()) return false
    if (!parseE_prime()) return false
    return true
}

function parseE_prime(): boolean {
    if (match('+')) {
        derivationSteps.push(`E' → + T E'`)
        if (!parseT()) return false
        if (!parseE_prime()) return false
        return true
    }
    if (match('-')) {
        derivationSteps.push(`E' → - T E'`)
        if (!parseT()) return false
        if (!parseE_prime()) return false
        return true
    }
    // ε 产生式直接返回
    derivationSteps.push(`E' → ε`)
    return true
}
```

=== 关键点

- `match()` 消耗一个终结符，与输入匹配则 pos++
- ε 产生式直接返回 true
- 失败时 return false，向上回溯
- 成功消耗所有 token 且 pos === tokens.length 时，句子合法

---

== 4. 句柄检测与归约 (useDerivation.ts)

=== 句柄定义

==句柄（Handle）==：句型中最左可归约的产生式右部

在归约过程中，每次归约操作都是将句型中的句柄替换为对应的左部非终结符。

=== 算法流程

```
1. 用预测分析表构建语法树 (buildParseTree)
2. 从叶子节点反向生成推导步骤
3. 最左推导: 找到最左非终结符，替换其产生式
4. 最右推导: 找到最右非终结符，替换其产生式
5. 每一步标注当前句柄
```

=== 最左推导代码

```typescript
// 最左推导 - 找最左非终结符
for (const sym of symbols) {
    if (g.V.includes(sym)) {
        symbols = expandSymbol(symbols, sym, prod)  // 替换
        steps.push(symbols.join(' '))
        handles.push(prod)  // 记录句柄
        break
    }
}
```

=== 最右推导代码

```typescript
// 最右推导 - 找最右非终结符
for (let i = symbols.length - 1; i >= 0; i--) {
    if (g.V.includes(symbols[i])) {
        symbols = expandSymbol(symbols, symbols[i], prod)
        steps.push(symbols.join(' '))
        handles.push(prod)
        break
    }
}
```


---

== 5. 语法树 ASCII 绘制

=== 队列 + 层次遍历算法

```typescript
type TreeNode = { symbol: string; children: TreeNode[] }
const queue = [{ node: root, depth: 0, prefix: '' }]

while (queue.length > 0) {
    const { node, depth, prefix } = queue.shift()!

    // 绘制连接线和符号
    lines.push(prefix + (isLast ? '└─ ' : '├─ ') + node.symbol)

    // 子节点入队（逆序保持顺序）
    for (let i = node.children.length - 1; i >= 0; i--) {
        queue.unshift({
            node: node.children[i],
            depth: depth + 1,
            prefix: newPrefix
        })
    }
}
```

=== 输出示例

```
E
├─ T
│  └─ F
│     └─ id
└─ E'
   ├─ +
   └─ T
      └─ F
         └─ id
```

---

== 6. 二义性检测

=== dangling else 文法

```
S → if E then S | if E then S else S | id
```

=== 二义性原因

句子 `if E1 then if E2 then S1 else S2` 有两种解释：

1. ==else 匹配内层 if==：
  ```
  if E1 then (if E2 then S1) else S2
  ```

2. ==else 匹配外层 if==：
  ```
  if E1 then (if E2 then S1 else S2)
  ```

=== 两种语法树

```ascii
# 树1: else 匹配内层
S
└─ if
   ├─ E
   └─ then
      ├─ S
      │  └─ if
      │     ├─ E
      │     └─ then
      │        └─ S
      └─ else
         └─ S

# 树2: else 匹配外层
S
├─ if
│  ├─ E
│  └─ then
│     └─ S
│        └─ if
│           ├─ E
│           └─ then
│              └─ S
└─ else
   └─ S
```

=== 消除二义性

通过文法重写消除二义性：

```
S → SS' | id
S' → then S | else S | ε
```


---

== 7. 预测分析表

=== 预测分析表结构

```typescript
const table: Record<string, Record<string, string>> = {
    "E":  { "id": "T E'", "(": "T E'" },
    "E'": { "+": "+ T E'", "-": "- T E'", ")": "ε", "EOF": "ε" },
    "T":  { "id": "F T'", "(": "F T'" },
    "T'": { "*": "* F T'", "/": "/ F T'", "+": "ε", "-": "ε", ")": "ε", "EOF": "ε" },
    "F":  { "id": "id", "(": "( E )" }
};
```

=== 分析算法

```typescript
function parseSymbol(sym: string): TreeNode | null {
    if (sym === "ε") return { symbol: "ε", children: [] }

    if (g.T.includes(sym)) {
        if (lookahead() === sym) {
            pos++
            return { symbol: sym, children: [] }
        }
        return null
    }

    const la = lookahead()
    const prod = table[sym]?.[la]
    if (!prod) return null

    const node: TreeNode = { symbol: sym, children: [], prod }
    const rhs = prod === "ε" ? [] : prod.split(" ")

    for (const s of rhs) {
        const child = parseSymbol(s)
        if (!child) return null
        node.children.push(child)
    }
    return node
}
```

---

== 8. 文件结构总览

```
src/
├── composables/
│   ├── useGrammar.ts      # 文法定义、符号分类、词法单元解析
│   ├── useParser.ts      # 递归下降分析、句型判定
│   ├── useDerivation.ts   # 推导/归约、句柄检测、语法树构建
│   └── useQA.ts          # 问答匹配逻辑
├── components/
│   ├── QAModule.vue       # 智能问答界面
│   ├── GrammarModule.vue  # 文法四元组展示
│   ├── LexerModule.vue    # 词法分析界面
│   ├── ChomskyModule.vue  # 乔姆斯基文法分类界面
│   └── ParserModule.vue  # 句型判定、推导、归约界面
└── types/
    └── index.ts          # 类型定义
```
