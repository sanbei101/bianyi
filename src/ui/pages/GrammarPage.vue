<script setup lang="ts">
import { NCard, NSpace, NInput, NButton, NTag, NTimeline, NTimelineItem } from "naive-ui";
import { ref } from "vue";

import { GrammarAnalyzer, parseGrammar } from "@/core/grammar";
import type { GrammarType, Production } from "@/core/types";

const grammarText = ref(`E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`);

const chomskyType = ref<GrammarType | null>(null);
const derivations = ref<Production[]>([]);
const handle = ref<Production | null>(null);
const inputString = ref("id + id * id");
const derivationSteps = ref<string[]>([]);

const buildDerivationSteps = (prods: Production[], start: string): string[] => {
  const steps: string[] = [start];
  let current = start;

  for (const prod of prods) {
    // 只替换第一个匹配的非终结符(最左推导)
    const index = current.indexOf(prod.left);
    if (index !== -1) {
      current =
        current.slice(0, index) + prod.right.join(" ") + current.slice(index + prod.left.length);
      steps.push(current);
    }
  }

  return steps;
};

const analyze = () => {
  try {
    const grammar = parseGrammar(grammarText.value);
    const analyzer = new GrammarAnalyzer(grammar);
    chomskyType.value = analyzer.detectChomskyType();

    // 使用setTimeout避免阻塞UI
    setTimeout(() => {
      const input = inputString.value.split(/\s+/);
      const result = analyzer.getLeftmostDerivation(input);
      if (result) {
        derivations.value = result;
        derivationSteps.value = buildDerivationSteps(result, grammar.startSymbol);
      }

      handle.value = analyzer.findHandle(input);
    }, 0);
  } catch (e) {
    console.error(e);
  }
};

const getTypeLabel = (type: GrammarType) => {
  const labels: Record<GrammarType, string> = {
    Type0: "0型 (无限制文法)",
    Type1: "1型 (上下文有关)",
    Type2: "2型 (上下文无关)",
    Type3: "3型 (正则文法)",
  };
  return labels[type];
};

const getTypeColor = (type: GrammarType): "error" | "warning" | "success" | "info" => {
  const colors: Record<GrammarType, "error" | "warning" | "success" | "info"> = {
    Type0: "error",
    Type1: "warning",
    Type2: "success",
    Type3: "info",
  };
  return colors[type];
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard title="文法定义">
        <NInput
          v-model:value="grammarText"
          type="textarea"
          :rows="10"
          placeholder="输入文法产生式，格式: A -> B C"
        />
        <template #footer>
          <NSpace>
            <NButton type="primary" @click="analyze">分析文法</NButton>
          </NSpace>
        </template>
      </NCard>

      <NCard v-if="chomskyType" title="Chomsky 类型判定">
        <NTag :type="getTypeColor(chomskyType)" size="large">
          {{ getTypeLabel(chomskyType) }}
        </NTag>
      </NCard>

      <NCard title="最左推导">
        <NInput v-model:value="inputString" placeholder="输入要推导的字符串 (空格分隔)" />
        <NTimeline v-if="derivationSteps.length > 0" class="mt-4">
          <NTimelineItem
            v-for="(step, index) in derivationSteps"
            :key="index"
            :title="`步骤 ${index}`"
            :content="step"
          />
        </NTimeline>
      </NCard>

      <NCard v-if="handle" title="句柄定位">
        <p>句柄: {{ handle.left }} -> {{ handle.right.join(" ") }}</p>
      </NCard>
    </NSpace>
  </div>
</template>
