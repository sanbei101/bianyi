<script setup lang="ts">
import {
  NCard,
  NSpace,
  NInput,
  NButton,
  NGrid,
  NGridItem,
  NTag,
  NAlert,
  NTabs,
  NTabPane,
  NTable,
  NStatistic,
} from "naive-ui";
import { ref } from "vue";
import MarkdownRender from "markstream-vue";
import "markstream-vue/index.css";

import { tokenize } from "@/lexer";
import { GrammarAnalyzer, parseGrammar } from "@/grammar";
import { parseTokens } from "@/parser";
import {
  diagnoseError,
  diagnoseRaw,
  generateWithConstraints,
  compareConstrainedVsUnconstrained,
  createTokenConstraint,
} from "@/llm";
import type { ParseError, LLMGenerationResult } from "@/types";

// ── Tab 1: 错误诊断 ───────────────────────────────────
const code = ref(`int main() {
    int a = 10
    return a + ;
}`);
const errors = ref<ParseError[]>([]);
const syncSet = ref<Set<string>>(new Set([";", "}", "$"]));
const llmDiagnosis = ref("");
const rawDiagnosis = ref("");
const diagnosing = ref(false);
const rawDiagnosing = ref(false);

const analyze = () => {
  const tokens = tokenize(code.value);
  const result = parseTokens(tokens);
  errors.value = result.errors;
  llmDiagnosis.value = "";
  rawDiagnosis.value = "";
};

// 结构化错误信息 → LLM（流式）
const diagnoseWithLLM = async () => {
  if (errors.value.length === 0) return;
  diagnosing.value = true;
  llmDiagnosis.value = "";

  try {
    for (const error of errors.value) {
      const header = `### 错误：第 ${error.line} 行第 ${error.column} 列\n\n` +
        `**期望:** \`${error.expected.join(", ")}\`　**实际:** \`${error.got}\`\n\n`;
      llmDiagnosis.value += header;
      await diagnoseError(error, code.value, syncSet.value, (delta) => {
        llmDiagnosis.value += delta;
      });
      llmDiagnosis.value += "\n\n---\n\n";
    }
  } catch (e) {
    llmDiagnosis.value += `\n\n**诊断失败:** ${e}`;
  } finally {
    diagnosing.value = false;
  }
};

// 原文直送 LLM（流式）
const diagnoseRawHandler = async () => {
  if (errors.value.length === 0) return;
  rawDiagnosing.value = true;
  rawDiagnosis.value = "";

  try {
    const errorMsgs = errors.value.map((e) => e.message);
    await diagnoseRaw(code.value, errorMsgs, (delta) => {
      rawDiagnosis.value += delta;
    });
  } catch (e) {
    rawDiagnosis.value += `\n\n**诊断失败:** ${e}`;
  } finally {
    rawDiagnosing.value = false;
  }
};

// ── Tab 2: 文法约束生成 ────────────────────────────────
const grammarText = ref(`E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`);
const generatePrompt = ref("生成一个算术表达式");
const constrainedResult = ref<LLMGenerationResult | null>(null);
const constrainedText = ref("");
const firstSets = ref<Map<string, Set<string>>>(new Map());
const generating = ref(false);

const computeFirstSets = () => {
  try {
    const grammar = parseGrammar(grammarText.value);
    const analyzer = new GrammarAnalyzer(grammar);
    const result = analyzer.analyzeLL1();
    firstSets.value = result.firstSets;
  } catch (e) {
    console.error(e);
  }
};

const buildConstraints = () => {
  computeFirstSets();
  const allowedTokens = new Set<string>();
  for (const [, set] of firstSets.value) {
    for (const t of set) {
      if (t !== "ε") allowedTokens.add(t);
    }
  }
  try {
    const grammar = parseGrammar(grammarText.value);
    for (const t of grammar.terminals) {
      allowedTokens.add(t);
    }
  } catch {
    // ignore
  }
  return [createTokenConstraint(Array.from(allowedTokens))];
};

const generateConstrained = async () => {
  generating.value = true;
  constrainedText.value = "";
  try {
    const constraints = buildConstraints();
    constrainedResult.value = await generateWithConstraints(
      generatePrompt.value,
      constraints,
      (delta) => { constrainedText.value += delta; },
    );
  } catch (e) {
    constrainedResult.value = {
      text: `生成失败: ${e}`,
      tokens: [],
      isValid: false,
      violations: [`${e}`],
    };
  } finally {
    generating.value = false;
  }
};

// ── Tab 3: 对照实验 ────────────────────────────────────
const experimentPrompt = ref("生成一个合法的算术表达式");
const experimentResult = ref<{
  constrained: LLMGenerationResult;
  unconstrained: LLMGenerationResult;
  complianceRate: number;
} | null>(null);
const expConstrainedText = ref("");
const expUnconstrainedText = ref("");
const experimenting = ref(false);

const runExperiment = async () => {
  experimenting.value = true;
  expConstrainedText.value = "";
  expUnconstrainedText.value = "";
  try {
    const constraints = buildConstraints();
    experimentResult.value = await compareConstrainedVsUnconstrained(
      experimentPrompt.value,
      constraints,
      {
        constrainedChunk: (delta) => { expConstrainedText.value += delta; },
        unconstrainedChunk: (delta) => { expUnconstrainedText.value += delta; },
      },
    );
  } catch (e) {
    console.error(e);
  } finally {
    experimenting.value = false;
  }
};

analyze();
computeFirstSets();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NTabs type="line" animated>
        <!-- ═══ Tab 1: 错误诊断 ═══ -->
        <NTabPane name="diagnosis" tab="教学型语法错误诊断">
          <NSpace vertical size="large">
            <NCard title="源代码（含错误）">
              <NInput
                v-model:value="code"
                type="textarea"
                :rows="10"
                placeholder="输入含错误的源代码..."
              />
              <template #footer>
                <NSpace>
                  <NButton type="primary" @click="analyze">语法分析</NButton>
                  <NButton :loading="diagnosing" @click="diagnoseWithLLM">
                    LLM 结构化诊断
                  </NButton>
                  <NButton :loading="rawDiagnosing" @click="diagnoseRawHandler">
                    原文直送 LLM
                  </NButton>
                </NSpace>
              </template>
            </NCard>

            <NGrid v-if="errors.length > 0" :cols="2" :x-gap="16">
              <NGridItem>
                <NCard title="Parser 捕获的错误">
                  <NSpace vertical>
                    <NAlert
                      v-for="(error, idx) in errors"
                      :key="idx"
                      type="error"
                      :title="`错误 ${idx + 1}`"
                    >
                      <p>{{ error.message }}</p>
                      <p>位置: 第 {{ error.line }} 行, 第 {{ error.column }} 列</p>
                      <p>期望: {{ error.expected.join(", ") }}</p>
                      <p>实际: {{ error.got }}</p>
                    </NAlert>
                  </NSpace>
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard title="同步集合（panic-mode）">
                  <NSpace>
                    <NTag v-for="token in syncSet" :key="token">{{ token }}</NTag>
                  </NSpace>
                </NCard>
              </NGridItem>
            </NGrid>

            <NGrid v-if="llmDiagnosis || rawDiagnosis" :cols="2" :x-gap="16">
              <NGridItem>
                <NCard>
                  <template #header>
                    <NSpace align="center">
                      <span>LLM 结构化诊断</span>
                      <NTag type="success" size="small">期望Token + 错误位置 + 同步符号</NTag>
                    </NSpace>
                  </template>
                  <MarkdownRender v-if="llmDiagnosis" :content="llmDiagnosis" />
                </NCard>
              </NGridItem>
              <NGridItem>
                <NCard>
                  <template #header>
                    <NSpace align="center">
                      <span>原文直送 LLM</span>
                      <NTag type="warning" size="small">仅错误信息文本</NTag>
                    </NSpace>
                  </template>
                  <MarkdownRender v-if="rawDiagnosis" :content="rawDiagnosis" />
                </NCard>
              </NGridItem>
            </NGrid>
          </NSpace>
        </NTabPane>

        <!-- ═══ Tab 2: 文法约束生成 ═══ -->
        <NTabPane name="constrained" tab="文法引导的 LLM 约束生成">
          <NSpace vertical size="large">
            <NCard title="文法定义">
              <NInput
                v-model:value="grammarText"
                type="textarea"
                :rows="8"
                placeholder="输入文法产生式..."
              />
            </NCard>

            <NCard title="FIRST 集合">
              <NTable :bordered="true" :single-line="false">
                <thead>
                  <tr>
                    <th>非终结符</th>
                    <th>FIRST 集</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="[nt, set] in firstSets" :key="nt">
                    <td><NTag>{{ nt }}</NTag></td>
                    <td>
                      <NSpace>
                        <NTag v-for="t in set" :key="t" type="info">{{ t }}</NTag>
                      </NSpace>
                    </td>
                  </tr>
                </tbody>
              </NTable>
            </NCard>

            <NCard title="约束生成">
              <NInput v-model:value="generatePrompt" placeholder="输入生成提示词..." />
              <template #footer>
                <NButton type="primary" :loading="generating" @click="generateConstrained">
                  基于 FIRST 集约束生成
                </NButton>
              </template>
            </NCard>

            <NCard v-if="constrainedResult" title="生成结果">
              <NSpace vertical>
                <NAlert :type="constrainedResult.isValid ? 'success' : 'warning'">
                  {{ constrainedResult.isValid ? "✅ 所有 Token 均在 FIRST 集内" : "⚠️ 存在越界 Token" }}
                </NAlert>
                <MarkdownRender v-if="constrainedText" :content="constrainedText" />
                <div v-if="constrainedResult.violations.length > 0">
                  <p class="font-bold mb-2">违规项：</p>
                  <NAlert
                    v-for="(v, i) in constrainedResult.violations"
                    :key="i"
                    type="error"
                    size="small"
                  >
                    {{ v }}
                  </NAlert>
                </div>
              </NSpace>
            </NCard>
          </NSpace>
        </NTabPane>

        <!-- ═══ Tab 3: 对照实验 ═══ -->
        <NTabPane name="experiment" tab="无约束 vs 文法约束 对照实验">
          <NSpace vertical size="large">
            <NCard title="实验设置">
              <p class="mb-4 text-gray-500">
                对同一提示词分别进行"无约束生成"和"文法约束生成"，比较格式合规率。
                约束条件来自文法的 FIRST 集合，仅允许输出合法的终结符 Token。
              </p>
              <NInput v-model:value="experimentPrompt" placeholder="输入实验提示词..." />
              <template #footer>
                <NButton type="primary" :loading="experimenting" @click="runExperiment">
                  运行对照实验
                </NButton>
              </template>
            </NCard>

            <NCard v-if="experimentResult" title="实验结果">
              <NSpace vertical size="large">
                <NGrid :cols="3" :x-gap="16">
                  <NGridItem>
                    <NCard>
                      <NStatistic label="文法约束合规率">
                        <span class="text-2xl font-bold text-green-600">
                          {{ (experimentResult.complianceRate * 100).toFixed(1) }}%
                        </span>
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard>
                      <NStatistic label="约束生成">
                        <NTag :type="experimentResult.constrained.isValid ? 'success' : 'error'" size="large">
                          {{ experimentResult.constrained.isValid ? "合规" : "违规" }}
                        </NTag>
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard>
                      <NStatistic label="无约束生成">
                        <NTag :type="experimentResult.unconstrained.isValid ? 'success' : 'error'" size="large">
                          {{ experimentResult.unconstrained.isValid ? "合规" : "违规" }}
                        </NTag>
                      </NStatistic>
                    </NCard>
                  </NGridItem>
                </NGrid>

                <NGrid :cols="2" :x-gap="16">
                  <NGridItem>
                    <NCard>
                      <template #header>
                        <NSpace align="center">
                          <span>文法约束生成</span>
                          <NTag type="success" size="small">有约束</NTag>
                        </NSpace>
                      </template>
                      <MarkdownRender v-if="expConstrainedText" :content="expConstrainedText" />
                      <div v-if="experimentResult.constrained.violations.length > 0" class="mt-2">
                        <NAlert
                          v-for="(v, i) in experimentResult.constrained.violations"
                          :key="i"
                          type="error"
                          size="small"
                        >
                          {{ v }}
                        </NAlert>
                      </div>
                    </NCard>
                  </NGridItem>
                  <NGridItem>
                    <NCard>
                      <template #header>
                        <NSpace align="center">
                          <span>无约束生成</span>
                          <NTag type="warning" size="small">无约束</NTag>
                        </NSpace>
                      </template>
                      <MarkdownRender v-if="expUnconstrainedText" :content="expUnconstrainedText" />
                      <div v-if="experimentResult.unconstrained.violations.length > 0" class="mt-2">
                        <NAlert
                          v-for="(v, i) in experimentResult.unconstrained.violations"
                          :key="i"
                          type="error"
                          size="small"
                        >
                          {{ v }}
                        </NAlert>
                      </div>
                    </NCard>
                  </NGridItem>
                </NGrid>
              </NSpace>
            </NCard>
          </NSpace>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
