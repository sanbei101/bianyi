import type { Token, Production, LLMConstraint, LLMGenerationResult, ParseError } from "../types";

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
};

export class LLMService {
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  async generate(
    messages: LLMMessage[],
    constraints?: LLMConstraint[],
  ): Promise<LLMGenerationResult> {
    const systemPrompt = this.buildConstraintPrompt(constraints);
    const fullMessages: LLMMessage[] = [{ role: "system", content: systemPrompt }, ...messages];

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: fullMessages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content || "";

      return this.validateAndParse(generatedText, constraints);
    } catch (error) {
      return {
        text: "",
        tokens: [],
        isValid: false,
        violations: [`API error: ${error}`],
      };
    }
  }

  private buildConstraintPrompt(constraints?: LLMConstraint[]): string {
    if (!constraints || constraints.length === 0) {
      return "You are a helpful assistant.";
    }

    let prompt =
      "You are a code generation assistant. Generate code following these constraints:\n\n";

    for (const constraint of constraints) {
      prompt += `- ${constraint.description}: ${constraint.allowedValues.join(", ")}\n`;
    }

    prompt += "\nOnly use the allowed values. Do not generate anything else.";

    return prompt;
  }

  private validateAndParse(text: string, constraints?: LLMConstraint[]): LLMGenerationResult {
    const violations: string[] = [];

    if (constraints) {
      for (const constraint of constraints) {
        if (constraint.type === "TOKEN") {
          const tokens = text.split(/\s+/);
          for (const token of tokens) {
            if (!constraint.allowedValues.includes(token)) {
              violations.push(`Token '${token}' is not in allowed tokens`);
            }
          }
        }
      }
    }

    const tokens: Token[] = [];
    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const words = line.split(/\s+/);
      let col = 1;
      for (const word of words) {
        if (word) {
          tokens.push({
            type: "IDENTIFIER",
            value: word,
            line: i + 1,
            column: col,
          });
          col += word.length + 1;
        }
      }
    }

    return {
      text,
      tokens,
      isValid: violations.length === 0,
      violations,
    };
  }

  async diagnoseError(error: ParseError, context: string, syncSet: Set<string>): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: "system",
        content:
          "You are a compiler error diagnostic assistant. Explain parsing errors in a clear, educational way.",
      },
      {
        role: "user",
        content: `Parse error at line ${error.line}, column ${error.column}:
${error.message}

Expected: ${error.expected.join(", ")}
Got: ${error.got}

Context: ${context}

Synchronization set: ${Array.from(syncSet).join(", ")}

Explain this error and suggest how to fix it.`,
      },
    ];

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "Unable to generate diagnosis.";
    } catch (error) {
      return `Error diagnosis failed: ${error}`;
    }
  }

  async compareConstrainedVsUnconstrained(
    prompt: string,
    constraints: LLMConstraint[],
  ): Promise<{
    constrained: LLMGenerationResult;
    unconstrained: LLMGenerationResult;
    complianceRate: number;
  }> {
    const constrainedResult = await this.generate([{ role: "user", content: prompt }], constraints);

    const unconstrainedResult = await this.generate([{ role: "user", content: prompt }]);

    const totalConstraints = constraints.length;
    const satisfiedConstraints = constraints.filter((c) => {
      if (c.type === "TOKEN") {
        const tokens = constrainedResult.text.split(/\s+/);
        return tokens.every((t) => c.allowedValues.includes(t));
      }
      return true;
    }).length;

    const complianceRate = totalConstraints > 0 ? satisfiedConstraints / totalConstraints : 1;

    return {
      constrained: constrainedResult,
      unconstrained: unconstrainedResult,
      complianceRate,
    };
  }
}

export function createLLMConfig(apiKey: string, model = "deepseek-v4-pro"): LLMConfig {
  return {
    apiKey,
    baseUrl: "https://api.deepseek.com/v1",
    model,
    temperature: 0.7,
    maxTokens: 2048,
  };
}

export function createTokenConstraint(allowedTokens: string[]): LLMConstraint {
  return {
    type: "TOKEN",
    allowedValues: allowedTokens,
    description: "Allowed tokens",
  };
}

export function createProductionConstraint(allowedProductions: Production[]): LLMConstraint {
  return {
    type: "PRODUCTION",
    allowedValues: allowedProductions.map((p) => `${p.left} -> ${p.right.join(" ")}`),
    description: "Allowed grammar productions",
  };
}
