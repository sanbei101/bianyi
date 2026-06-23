# 编译原理 AI 助学系统

面向编译原理课程的 LLM 增强词法-语法分析综合平台。

## 功能概览

### 复用与整合
- **词法分析** — 基于 DFA 思路的词法分析器，切分关键字、标识符、常数、运算符、界符五类 Token，标注非法字符
- **文法分析** — Chomsky 0–3 型自动判定、句型/句子判定、句柄定位、最左推导/归约步骤可视化、文本式语法树
- **语法分析** — LL(1) 自动计算 FIRST/FOLLOW、构造预测分析表、检测冲突，递归下降 Parser 生成 AST
- **LLM 接入** — DeepSeek API 调用，结构化答疑/批改结果输出

### 新增能力
- **文法引导的 LLM 约束生成** — 以 FIRST 集为约束校验 LLM 输出，越界 Token 自动回退重采样，支持无约束 vs 约束对照实验
- **教学型语法错误诊断** — panic-mode 错误恢复，结构化错误信息送入 LLM 生成面向初学者的讲解，与原文直送对照
- **AST 相似度评分** — Zhang-Shasha 树编辑距离算法，差异节点高亮，过程性评分依据
- **语义分析预研** — 作用域符号表，变量重定义与未声明引用检测

## 快速启动

```bash
# 一键启动（自动安装依赖）
bash start.sh

# 或手动操作
pnpm install
pnpm dev
```

启动后访问 http://localhost:5173

## 目录结构

```
src/
  types.ts              # 共享类型定义
  main.ts               # Vue 入口
  lexer/                # 词法分析器
    lexer.ts            # Token 切分
    lexer.test.ts
  grammar/              # 文法分析
    grammar.ts          # Chomsky 判定、FIRST/FOLLOW、LL(1)、推导/归约
    grammar.test.ts
  parser/               # 语法分析
    parser.ts           # 递归下降 Parser
    semantic.ts         # 语义分析（符号表）
    ast-similarity.ts   # Zhang-Shasha 树编辑距离
    parser.test.ts / semantic.test.ts / ast-similarity.test.ts
  llm/                  # LLM 服务
    llm.ts              # DeepSeek API 客户端
  ui/                   # 前端界面
    App.vue             # 根布局
    router.ts           # 路由
    pages/              # 7 个页面组件
  reports/              # 实验报告与伪代码
```

## 技术栈

- Vue 3 + TypeScript + Naive UI
- Vite 构建
- Vitest 测试
- DeepSeek API (LLM)

## 运行测试

```bash
pnpm test
```
