<script setup lang="ts">
import { NCard, NSpace, NInput, NButton, NTable, NTabs, NTabPane, NAlert } from "naive-ui";
import { ref } from "vue";

import { GrammarAnalyzer, parseGrammar } from "@/grammar";
import type { FirstSet, FollowSet, PredictTable, Conflict } from "@/types";

const grammarText = ref(`E -> T E'
E' -> + T E'
E' -> ε
T -> F T'
T' -> * F T'
T' -> ε
F -> ( E )
F -> id`);

const firstSets = ref<FirstSet | null>(null);
const followSets = ref<FollowSet | null>(null);
const predictTable = ref<PredictTable | null>(null);
const conflicts = ref<Conflict[]>([]);
const isLL1 = ref<boolean>(false);

const analyze = () => {
  try {
    const grammar = parseGrammar(grammarText.value);
    const analyzer = new GrammarAnalyzer(grammar);
    const result = analyzer.analyzeLL1();

    firstSets.value = result.firstSets;
    followSets.value = result.followSets;
    predictTable.value = result.predictTable;
    conflicts.value = result.conflicts;
    isLL1.value = result.isLL1;
  } catch (e) {
    console.error(e);
  }
};

const getFirstSetDisplay = (set: FirstSet): { symbol: string; first: string }[] => {
  return Array.from(set.entries()).map(([symbol, first]) => ({
    symbol,
    first: Array.from(first).join(", "),
  }));
};

const getFollowSetDisplay = (set: FollowSet): { symbol: string; follow: string }[] => {
  return Array.from(set.entries()).map(([symbol, follow]) => ({
    symbol,
    follow: Array.from(follow).join(", "),
  }));
};

const getPredictTableDisplay = (
  table: PredictTable,
): { nonTerminal: string; terminals: { terminal: string; production: string }[] }[] => {
  return Array.from(table.entries()).map(([nt, row]) => ({
    nonTerminal: nt,
    terminals: Array.from(row.entries()).map(([t, prod]) => ({
      terminal: t,
      production: prod ? `${prod.left} -> ${prod.right.join(" ")}` : "",
    })),
  }));
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard title="文法定义 (消除左递归)">
        <NInput
          v-model:value="grammarText"
          type="textarea"
          :rows="10"
          placeholder="输入文法产生式"
        />
        <template #footer>
          <NButton type="primary" @click="analyze">分析 LL(1)</NButton>
        </template>
      </NCard>

      <NAlert v-if="isLL1 !== null" :type="isLL1 ? 'success' : 'error'">
        {{ isLL1 ? "该文法是 LL(1) 文法" : "该文法不是 LL(1) 文法" }}
      </NAlert>

      <NTabs v-if="firstSets" type="line">
        <NTabPane name="first" tab="FIRST 集">
          <NTable :bordered="false">
            <thead>
              <tr>
                <th>非终结符</th>
                <th>FIRST 集</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in getFirstSetDisplay(firstSets)" :key="item.symbol">
                <td>{{ item.symbol }}</td>
                <td>{{ item.first }}</td>
              </tr>
            </tbody>
          </NTable>
        </NTabPane>

        <NTabPane name="follow" tab="FOLLOW 集">
          <NTable :bordered="false">
            <thead>
              <tr>
                <th>非终结符</th>
                <th>FOLLOW 集</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in getFollowSetDisplay(followSets!)" :key="item.symbol">
                <td>{{ item.symbol }}</td>
                <td>{{ item.follow }}</td>
              </tr>
            </tbody>
          </NTable>
        </NTabPane>

        <NTabPane name="table" tab="预测分析表">
          <NTable :bordered="false">
            <thead>
              <tr>
                <th>非终结符</th>
                <th>终结符</th>
                <th>产生式</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="row in getPredictTableDisplay(predictTable!)" :key="row.nonTerminal">
                <tr v-for="cell in row.terminals" :key="cell.terminal">
                  <td>{{ row.nonTerminal }}</td>
                  <td>{{ cell.terminal }}</td>
                  <td>{{ cell.production }}</td>
                </tr>
              </template>
            </tbody>
          </NTable>
        </NTabPane>

        <NTabPane name="conflicts" tab="冲突检测">
          <NSpace v-if="conflicts.length > 0" vertical>
            <NCard v-for="(conflict, idx) in conflicts" :key="idx" :title="`冲突 ${idx + 1}`">
              <p>类型: {{ conflict.type }}</p>
              <p>非终结符: {{ conflict.nonTerminal }}</p>
              <p>终结符: {{ conflict.terminal }}</p>
              <p>冲突产生式:</p>
              <ul>
                <li v-for="(prod, pidx) in conflict.productions" :key="pidx">
                  {{ prod.left }} -> {{ prod.right.join(" ") }}
                </li>
              </ul>
            </NCard>
          </NSpace>
          <NCard v-else>
            <p>未检测到冲突</p>
          </NCard>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
