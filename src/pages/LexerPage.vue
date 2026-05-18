<script setup lang="ts">
import { ref, h } from "vue";
import { NCard, NSpace, NInput, NButton, NDataTable, NTabs, NTabPane, NTag } from "naive-ui";
import type { DataTableColumns } from "naive-ui";
import { tokenize } from "@/core/lexer";
import type { Token } from "@/core/types";

const code = ref(`int main() {
    int a = 10;
    float b = 3.14;
    if (a > 5) {
        return a + b;
    }
    return 0;
}`);

const tokens = ref<Token[]>([]);
const errorTokens = ref<Token[]>([]);

const columns: DataTableColumns<Token> = [
  {
    title: "类型",
    key: "type",
    render(row) {
      const typeColors: Record<string, string> = {
        KEYWORD: "success",
        IDENTIFIER: "info",
        NUMBER: "warning",
        STRING: "warning",
        OPERATOR: "default",
        DELIMITER: "default",
        UNKNOWN: "error",
      };
      return h(NTag, { type: typeColors[row.type] || "default" }, { default: () => row.type });
    },
  },
  {
    title: "值",
    key: "value",
  },
  {
    title: "行",
    key: "line",
  },
  {
    title: "列",
    key: "column",
  },
];

const analyze = () => {
  tokens.value = tokenize(code.value);
  errorTokens.value = tokens.value.filter((t) => t.type === "UNKNOWN");
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard title="源代码">
        <NInput v-model:value="code" type="textarea" :rows="10" placeholder="输入源代码..." />
        <template #footer>
          <NButton type="primary" @click="analyze">词法分析</NButton>
        </template>
      </NCard>

      <NTabs type="line">
        <NTabPane name="tokens" tab="Token 列表">
          <NDataTable :columns="columns" :data="tokens" :bordered="false" />
        </NTabPane>
        <NTabPane name="errors" tab="错误标记">
          <NDataTable
            v-if="errorTokens.length > 0"
            :columns="columns"
            :data="errorTokens"
            :bordered="false"
          />
          <NCard v-else>
            <p>未发现非法字符</p>
          </NCard>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
