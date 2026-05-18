<script setup lang="ts">
import { ref } from "vue";
import { NCard, NSpace, NInput, NButton, NTable, NTabs, NTabPane, NAlert } from "naive-ui";
import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";
import { analyzeSemantics } from "@/core/semantic";
import type { SymbolTable, SemanticError } from "@/core/types";

const code = ref(`int main() {
    int a = 10;
    int b = 20;
    int c = a + b;
    return c;
}`);

const symbolTable = ref<SymbolTable | null>(null);
const errors = ref<SemanticError[]>([]);

const analyze = () => {
  const tokens = tokenize(code.value);
  const parseResult = parseTokens(tokens);

  if (parseResult.ast) {
    const result = analyzeSemantics(parseResult.ast);
    symbolTable.value = result.symbolTable;
    errors.value = result.errors;
  }
};

const getSymbolEntries = (
  table: SymbolTable,
): { name: string; type: string; scope: number; line: number }[] => {
  const entries: { name: string; type: string; scope: number; line: number }[] = [];
  for (const [, symbolEntries] of table.entries) {
    for (const entry of symbolEntries) {
      entries.push({
        name: entry.name,
        type: entry.type,
        scope: entry.scope,
        line: entry.line,
      });
    }
  }
  return entries;
};

const getErrorColor = (
  type: SemanticError["type"],
): "warning" | "error" | "success" | "default" | "info" => {
  const colors: Record<
    SemanticError["type"],
    "warning" | "error" | "success" | "default" | "info"
  > = {
    REDEFINED: "warning",
    UNDEFINED: "error",
    TYPE_MISMATCH: "error",
  };
  return colors[type];
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard title="源代码">
        <NInput v-model:value="code" type="textarea" :rows="10" placeholder="输入源代码..." />
        <template #footer>
          <NButton type="primary" @click="analyze">语义分析</NButton>
        </template>
      </NCard>

      <NTabs v-if="symbolTable" type="line">
        <NTabPane name="symbols" tab="符号表">
          <NTable :bordered="false">
            <thead>
              <tr>
                <th>名称</th>
                <th>类型</th>
                <th>作用域</th>
                <th>行号</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in getSymbolEntries(symbolTable)" :key="idx">
                <td>{{ entry.name }}</td>
                <td>{{ entry.type }}</td>
                <td>{{ entry.scope }}</td>
                <td>{{ entry.line }}</td>
              </tr>
            </tbody>
          </NTable>
        </NTabPane>

        <NTabPane name="errors" tab="语义错误">
          <NSpace v-if="errors.length > 0" vertical>
            <NAlert
              v-for="(error, idx) in errors"
              :key="idx"
              :type="getErrorColor(error.type)"
              :title="error.type"
            >
              <p>{{ error.message }}</p>
              <p>位置: 第 {{ error.line }} 行, 第 {{ error.column }} 列</p>
            </NAlert>
          </NSpace>
          <NCard v-else>
            <p>未发现语义错误</p>
          </NCard>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
