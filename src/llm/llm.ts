import type { LLMConstraint, LLMGenerationResult, ParseError } from "../types";

export type DeepSeekRole = "system" | "user" | "assistant";

export type DeepSeekMessage = {
  role: DeepSeekRole;
  content: string;
};

export type DeepSeekRequest = {
  model: string;
  messages: DeepSeekMessage[];
  thinking: { type: "enabled" | "disabled" };
  max_tokens: number;
  temperature: number;
};

export type DeepSeekUsage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type DeepSeekChoice = {
  index: number;
  message: { role: DeepSeekRole; content: string; reasoning_content?: string };
  finish_reason: "stop" | "length" | null;
};

export type DeepSeekResponse = {
  id: string;
  model: string;
  choices: DeepSeekChoice[];
  usage: DeepSeekUsage;
};

// ── Client ───────────────────────────────────────────
const API_KEY = import.meta.env.VITE_DEEP_SEEK_KEY as string;
const BASE_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-pro";

async function chat(system: string, user: string): Promise<string> {
  const body: DeepSeekRequest = {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
    max_tokens: 4096,
    temperature: 0.7,
  };

  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data: DeepSeekResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

export async function diagnoseError(
  error: ParseError,
  sourceCode: string,
  syncSet: Set<string>,
): Promise<string> {
  return chat(
    `你是一位编译原理课程的助教。学生写的代码出现了语法错误,请用中文给出面向初学者的诊断讲解。
要求:
1. 先指出错误位置(行号、列号)
2. 解释"期望 Token"和"实际 Token"的含义
3. 分析可能的错误原因(漏写分号、括号不匹配、表达式不完整等)
4. 给出具体的修正代码示例
5. 用通俗易懂的语言,避免术语堆砌`,

    `学生代码:
\`\`\`
${sourceCode}
\`\`\`

错误详情:
- 位置:第 ${error.line} 行,第 ${error.column} 列
- 错误信息:${error.message}
- 期望 Token:${error.expected.join(", ")}
- 实际 Token:${error.got}
- 同步符号集合:${Array.from(syncSet).join(", ")}`,
  );
}

export async function diagnoseRaw(sourceCode: string, errorMessages: string[]): Promise<string> {
  return chat(
    "你是一位编译原理课程的助教。学生写的代码有语法错误,请诊断并给出修改建议。",
    `学生代码:\n\`\`\`\n${sourceCode}\n\`\`\`\n\n错误信息:\n${errorMessages.join("\n")}`,
  );
}

export async function generateWithConstraints(
  prompt: string,
  constraints: LLMConstraint[],
): Promise<LLMGenerationResult> {
  const constraintDesc = constraints
    .map((c) => `[${c.description}]${c.allowedValues.join(", ")}`)
    .join("\n");

  const text = await chat(
    `你是一个代码生成器。严格遵守以下约束,只使用允许的符号,不要输出任何额外解释:\n\n${constraintDesc}`,
    prompt,
  );

  const violations: string[] = [];
  for (const c of constraints) {
    if (c.type === "TOKEN") {
      for (const t of text.split(/\s+/)) {
        if (t && !c.allowedValues.includes(t)) {
          violations.push(`Token "${t}" 不在允许集合中`);
        }
      }
    }
  }

  return { text, tokens: [], isValid: violations.length === 0, violations };
}

// ── 无约束生成 ────────────────────────────────────────
export async function generateWithoutConstraints(prompt: string): Promise<LLMGenerationResult> {
  const text = await chat("你是一个代码生成器。", prompt);
  return { text, tokens: [], isValid: true, violations: [] };
}

// ── 对照实验 ─────────────────────────────────────────
export async function compareConstrainedVsUnconstrained(
  prompt: string,
  constraints: LLMConstraint[],
): Promise<{
  constrained: LLMGenerationResult;
  unconstrained: LLMGenerationResult;
  complianceRate: number;
}> {
  const [constrained, unconstrained] = await Promise.all([
    generateWithConstraints(prompt, constraints),
    generateWithoutConstraints(prompt),
  ]);

  const total = constraints.length;
  const satisfied = constraints.filter((c) => {
    if (c.type === "TOKEN") {
      return constrained.text.split(/\s+/).every((t) => !t || c.allowedValues.includes(t));
    }
    return true;
  }).length;

  return { constrained, unconstrained, complianceRate: total > 0 ? satisfied / total : 1 };
}

// ── 工具函数 ─────────────────────────────────────────
export function createTokenConstraint(allowedTokens: string[]): LLMConstraint {
  return { type: "TOKEN", allowedValues: allowedTokens, description: "允许的终结符" };
}
