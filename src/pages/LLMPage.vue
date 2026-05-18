<script setup lang="ts">
import { ref } from "vue";
import { NCard, NSpace, NInput, NButton, NGrid, NGridItem, NTag, NAlert } from "naive-ui";
import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";
import type { ParseError } from "@/core/types";

const code = ref(`int main() {
    int a = 10
    return a + ;
}`);

const errors = ref<ParseError[]>([]);
const syncSet = ref<Set<string>>(new Set([";", "}", "$"]));
const llmDiagnosis = ref<string>("");
const rawDiagnosis = ref<string>("");

const analyze = () => {
  const tokens = tokenize(code.value);
  const result = parseTokens(tokens);
  errors.value = result.errors;
};

const diagnoseWithLLM = async () => {
  llmDiagnosis.value = "LLM 诊断结果:\n\n";
  for (const error of errors.value) {
    llmDiagnosis.value += `错误位置: 第 ${error.line} 行, 第 ${error.column} 列\n`;
    llmDiagnosis.value += `错误信息: ${error.message}\n`;
    llmDiagnosis.value += `期望: ${error.expected.join(", ")}\n`;
    llmDiagnosis.value += `实际: ${error.got}\n\n`;
  }
};

const diagnoseRaw = () => {
  rawDiagnosis.value = "原文直送诊断:\n\n";
  for (const error of errors.value) {
    rawDiagnosis.value += `语法错误: ${error.message}\n`;
  }
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard title="源代码 (含错误)">
        <NInput v-model:value="code" type="textarea" :rows="10" placeholder="输入源代码..." />
        <template #footer>
          <NSpace>
            <NButton type="primary" @click="analyze">语法分析</NButton>
            <NButton @click="diagnoseWithLLM">LLM 错误诊断</NButton>
            <NButton @click="diagnoseRaw">原文直送</NButton>
          </NSpace>
        </template>
      </NCard>

      <NGrid v-if="errors.length > 0" :cols="2" :x-gap="16">
        <NGridItem>
          <NCard title="捕获的错误">
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
          <NCard title="同步集合">
            <NSpace>
              <NTag v-for="token in syncSet" :key="token">{{ token }}</NTag>
            </NSpace>
          </NCard>
        </NGridItem>
      </NGrid>

      <NGrid v-if="llmDiagnosis || rawDiagnosis" :cols="2" :x-gap="16">
        <NGridItem v-if="llmDiagnosis">
          <NCard title="LLM 诊断">
            <pre>{{ llmDiagnosis }}</pre>
          </NCard>
        </NGridItem>
        <NGridItem v-if="rawDiagnosis">
          <NCard title="原文直送">
            <pre>{{ rawDiagnosis }}</pre>
          </NCard>
        </NGridItem>
      </NGrid>
    </NSpace>
  </div>
</template>
