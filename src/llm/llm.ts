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
  stream?: boolean;
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

// ── 流式响应类型 ──────────────────────────────────────
export type DeepSeekStreamDelta = {
  content?: string;
  reasoning_content?: string;
  role?: "assistant";
};

export type DeepSeekStreamChoice = {
  index: number;
  delta: DeepSeekStreamDelta;
  finish_reason: "stop" | "length" | null;
};

export type DeepSeekStreamChunk = {
  id: string;
  model: string;
  choices: DeepSeekStreamChoice[];
  created: number;
};

// ── Client ───────────────────────────────────────────
const API_KEY = import.meta.env.VITE_DEEP_SEEK_KEY as string;
const BASE_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-v4-pro";

/** 按空白+标点切分,每个标点独立成 token */
function splitTokens(text: string): string[] {
  return text.match(/[a-zA-Z_]\w*|[+\-*/(){}[\];,=<>!&|]|\S+/g) ?? [];
}

function buildBody(system: string, user: string, stream: boolean): DeepSeekRequest {
  return {
    model: MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    thinking: { type: "disabled" },
    max_tokens: 4096,
    temperature: 0.7,
    stream,
  } as DeepSeekRequest;
}

async function chat(system: string, user: string): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(buildBody(system, user, false)),
  });

  const data: DeepSeekResponse = await res.json();
  return data.choices[0]?.message?.content ?? "";
}

/** 流式调用,onChunk 接收增量 delta */
async function chatStream(
  system: string,
  user: string,
  onChunk: (delta: string) => void,
): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(buildBody(system, user, true)),
  });

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let full = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6).trim();
      if (data === "[DONE]") continue;

      try {
        const chunk: DeepSeekStreamChunk = JSON.parse(data);
        const delta = chunk.choices[0]?.delta?.content;
        if (delta) {
          full += delta;
          onChunk(delta);
        }
      } catch {
        // skip malformed chunks
      }
    }
  }

  return full;
}

const DIAGNOSE_SYSTEM = `你是编译原理助教。用中文简短诊断语法错误,格式如下,不要废话:

**原因**:一句话说明为什么出错(如"第2行末尾缺少分号")
**修正**:给出修正后的代码片段(只给关键行,不要完整程序)

要求:不超过5行,不解释基础概念,不重复错误信息。`;

export async function diagnoseError(
  error: ParseError,
  sourceCode: string,
  syncSet: Set<string>,
  onChunk?: (text: string) => void,
): Promise<string> {
  const user = `学生代码:
\`\`\`
${sourceCode}
\`\`\`

错误详情:
- 位置:第 ${error.line} 行,第 ${error.column} 列
- 错误信息:${error.message}
- 期望 Token:${error.expected.join(", ")}
- 实际 Token:${error.got}
- 同步符号集合:${Array.from(syncSet).join(", ")}`;

  return onChunk ? chatStream(DIAGNOSE_SYSTEM, user, onChunk) : chat(DIAGNOSE_SYSTEM, user);
}

export async function diagnoseRaw(
  sourceCode: string,
  errorMessages: string[],
  onChunk?: (text: string) => void,
): Promise<string> {
  const system = `你是编译原理助教。用中文简短诊断语法错误，格式如下，不要废话：

**原因**：一句话说明出错原因
**修正**：给出修正后的关键代码行

要求：不超过5行，不解释基础概念。`;
  const user = `学生代码:\n\`\`\`\n${sourceCode}\n\`\`\`\n\n错误信息:\n${errorMessages.join("\n")}`;

  return onChunk ? chatStream(system, user, onChunk) : chat(system, user);
}

export async function generateWithConstraints(
  prompt: string,
  constraints: LLMConstraint[],
  onChunk?: (delta: string) => void,
): Promise<LLMGenerationResult> {
  const constraintDesc = constraints
    .map((c) => `[${c.description}]${c.allowedValues.join(", ")}`)
    .join("\n");

  const text = onChunk
    ? await chatStream(
        `你是一个代码生成器。严格遵守以下约束,只使用允许的符号,不要输出任何额外解释:\n\n${constraintDesc}`,
        prompt,
        onChunk,
      )
    : await chat(
        `你是一个代码生成器。严格遵守以下约束,只使用允许的符号,不要输出任何额外解释:\n\n${constraintDesc}`,
        prompt,
      );

  const violations: string[] = [];
  for (const c of constraints) {
    if (c.type === "TOKEN") {
      for (const t of splitTokens(text)) {
        if (t.trim() && !c.allowedValues.includes(t)) {
          violations.push(`Token "${t}" 不在允许集合中`);
        }
      }
    }
  }

  return { text, tokens: [], isValid: violations.length === 0, violations };
}

// ── 无约束生成 ────────────────────────────────────────
export async function generateWithoutConstraints(
  prompt: string,
  onChunk?: (delta: string) => void,
): Promise<LLMGenerationResult> {
  const text = onChunk
    ? await chatStream("你是一个代码生成器。", prompt, onChunk)
    : await chat("你是一个代码生成器。", prompt);
  return { text, tokens: [], isValid: true, violations: [] };
}

// ── 对照实验 ─────────────────────────────────────────
export async function compareConstrainedVsUnconstrained(
  prompt: string,
  constraints: LLMConstraint[],
  callbacks?: {
    constrainedChunk?: (delta: string) => void;
    unconstrainedChunk?: (delta: string) => void;
  },
): Promise<{
  constrained: LLMGenerationResult;
  unconstrained: LLMGenerationResult;
  complianceRate: number;
}> {
  const [constrained, unconstrained] = await Promise.all([
    generateWithConstraints(prompt, constraints, callbacks?.constrainedChunk),
    generateWithoutConstraints(prompt, callbacks?.unconstrainedChunk),
  ]);

  const total = constraints.length;
  const satisfied = constraints.filter((c) => {
    if (c.type === "TOKEN") {
      return splitTokens(constrained.text).every((t) => !t || c.allowedValues.includes(t));
    }
    return true;
  }).length;

  return { constrained, unconstrained, complianceRate: total > 0 ? satisfied / total : 1 };
}

// ── 工具函数 ─────────────────────────────────────────
export function createTokenConstraint(allowedTokens: string[]): LLMConstraint {
  return { type: "TOKEN", allowedValues: allowedTokens, description: "允许的终结符" };
}
