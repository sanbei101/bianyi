# 文法引导的 LLM 约束生成 — 伪代码

## 1. 核心算法：基于 FIRST 集的约束生成

```
算法: GrammarConstrainedGenerate
输入:
  grammar G           // 文法定义
  prompt P            // 用户提示词
  maxRetries R        // 最大重试次数
输出:
  result { text, isValid, violations }

function GrammarConstrainedGenerate(G, P, R):
    // 步骤1: 计算 FIRST 集合
    firstSets ← ComputeFirstSets(G)

    // 步骤2: 提取允许的终结符集合
    allowedTokens ← {}
    for each (nonTerminal, firstSet) in firstSets:
        for each token in firstSet:
            if token ≠ ε:
                allowedTokens.add(token)
    for each terminal in G.terminals:
        allowedTokens.add(terminal)

    // 步骤3: 带约束生成 + 回退重采样
    for attempt = 0 to R:
        if attempt > 0:
            systemPrompt ← basePrompt + "⚠️ 上次违规: " + violations
        else:
            systemPrompt ← basePrompt + "允许符号: " + allowedTokens

        text ← LLM.generate(systemPrompt, P)

        // 步骤4: FIRST 集合法性校验
        violations ← []
        for each token in Tokenize(text):
            if token ∉ allowedTokens:
                violations.append("Token '" + token + "' 不在允许集合中")

        if violations.isEmpty():
            return { text, isValid: true, violations: [] }

    return { text, isValid: false, violations }
```

## 2. FIRST 集计算

```
算法: ComputeFirstSets
输入: 文法 G = (N, T, P, S)
输出: FIRST 集合映射

function ComputeFirstSets(G):
    first ← { }  // Map<非终结符, Set<符号>>
    for each A in G.nonTerminals:
        first[A] ← {}

    repeat:
        changed ← false
        for each production A → α in G.productions:
            oldSize ← |first[A]|
            if α = ε:
                first[A].add(ε)
            else:
                for each symbol X in α:
                    if X ∈ G.terminals:
                        first[A].add(X)
                        break
                    else if X ∈ G.nonTerminals:
                        first[A] ← first[A] ∪ (first[X] - {ε})
                        if ε ∉ first[X]:
                            break
            if |first[A]| > oldSize:
                changed ← true
    until not changed

    return first
```

## 3. 对照实验流程

```
算法: CompareConstrainedVsUnconstrained
输入: 提示词 P, 文法约束 C
输出: { constrained, unconstrained, complianceRate }

function CompareConstrainedVsUnconstrained(P, C):
    // 并行执行两种生成
    constrained ← GrammarConstrainedGenerate(G, P, maxRetries=2)
    unconstrained ← LLM.generate("你是一个代码生成器", P)

    // 计算合规率
    total ← |C|
    satisfied ← 0
    for each constraint c in C:
        if c.type = TOKEN:
            if all tokens in Tokenize(constrained.text) are in c.allowedValues:
                satisfied += 1

    complianceRate ← satisfied / total

    return { constrained, unconstrained, complianceRate }
```
