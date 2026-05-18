# 编译原理课程综合实验:AI 助学平台 实现计划

## 1. 目标

构建 LLM 增强的词法-语法分析综合平台,覆盖词法分析、文法判定、LL(1) 分析、约束生成、错误诊断、AST 相似度评分、语义分析预研。

## 2. 技术栈

- Vue 3 (`<script setup lang="ts">`) + Naive UI
- 纯 TypeScript,所有对象类型使用 `type` 别名,禁用 `interface`
- 不要写style,尽可能直接使用Naive里面的组件,实在不行再使用 Tailwind CSS,禁止自定义样式类
- 格式化:`pnpm fmt`,检查:`pnpm lint`
- LLM API: Deepseek v4 pro
- 核心算法:DFA 词法、Chomsky 判定、LL(1) 全套、panic-mode 错误恢复、Zhang-Shasha 树编辑距离

## 4. 核心模块要点

- **词法分析**:DFA 识别关键字/标识符/常数/运算符/界符,输出 Token 列表,标注非法字符。
- **文法层**:Chomsky 0~3 型自动判定,最左推导/归约步骤可视化,句柄定位。
- **LL(1) 语法分析**:FIRST/FOLLOW 计算、预测分析表构造、冲突检测、递归下降 Parser 生成 AST。
- **LLM 约束生成**:以 LL(1) 分析表为约束,生成时限制合法 Token(prompt 约束+过滤),对比无约束生成,报告格式合规率提升。
- **教学错误诊断**:panic 模式下捕获期望 Token、位置、同步集合,送入 LLM 生成自然语言解释,并与"原文直送"对比。
- **AST 相似度评分**:实现 Zhang-Shasha 树编辑距离,输出相似度分数与差异节点高亮。
- **语义预研接口**:符号表支持作用域,检查变量重定义和未声明引用。

## 5. 实施步骤

2. **词法分析器**:实现并集成,Token 表格展示。
3. **文法分析**:Chomsky 判定与推导可视化。
4. **LL(1) 全套**:表格构造、递归下降 Parser、冲突提示。
5. **LLM 接入层**:实现约束解码器与对照实验,错误诊断与对比。
6. **AST 相似度**:树编辑距离实现,相似度展示与差异高亮。
7. **语义分析接口**:符号表+错误收集,预留扩展。
8. **整合测试**:所有模块串联,确保 `pnpm fmt` 和 `pnpm lint` 通过。

## 6. 规范与要求

- 类型定义一律使用 `type`,禁止 `interface`
- 禁止使用 `any`,尽量使用具体类型或泛型约束
- 在`pages/`文件夹下面新建页面,并在src/router.ts中添加路由,禁止在组件中直接使用 `<router-link>` 进行跳转,必须使用 `useRouter` 的 `router.push` 方法进行编程式导航。
- 每次代码修改后,必须执行 pnpm fmt 和 pnpm lint,保证无格式/规则错误。
- 所有核心模块必须编写单元测试(Vitest)。
- vue props必须这么写:

```ts
const props = defineProps<{
  name: string;
  avatar?: string;
}>();
```

- vue emit 事件必须这么写:

```ts
const emit = defineEmits<{
  change: [id: number];
  update: [value: string];
}>();
```
