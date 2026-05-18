<script setup lang="ts">
import { ref } from "vue";
import {
  NCard,
  NSpace,
  NInput,
  NButton,
  NStatistic,
  NGrid,
  NGridItem,
  NTabs,
  NTabPane,
  NTag,
} from "naive-ui";
import { tokenize } from "@/core/lexer";
import { parseTokens } from "@/core/parser";
import { compareASTs } from "@/core/ast-similarity";
import type { ASTNode, ASTSimilarityResult } from "@/core/types";

const code1 = ref(`int main() {
    int a = 10;
    return a + 5;
}`);

const code2 = ref(`int main() {
    int b = 10;
    return b + 5;
}`);

const similarityResult = ref<ASTSimilarityResult | null>(null);
const ast1 = ref<ASTNode | null>(null);
const ast2 = ref<ASTNode | null>(null);

const analyze = () => {
  const tokens1 = tokenize(code1.value);
  const tokens2 = tokenize(code2.value);

  const result1 = parseTokens(tokens1);
  const result2 = parseTokens(tokens2);

  ast1.value = result1.ast;
  ast2.value = result2.ast;

  if (result1.ast && result2.ast) {
    similarityResult.value = compareASTs(result1.ast, result2.ast);
  }
};

const renderAST = (node: ASTNode, indent = 0): string => {
  const spaces = "  ".repeat(indent);
  let result = `${spaces}${node.type}${node.value !== undefined ? `: ${node.value}` : ""}\n`;
  for (const child of node.children) {
    result += renderAST(child, indent + 1);
  }
  return result;
};

analyze();
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NGrid :cols="2" :x-gap="16">
        <NGridItem>
          <NCard title="代码 1">
            <NInput v-model:value="code1" type="textarea" :rows="8" placeholder="输入源代码..." />
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="代码 2">
            <NInput v-model:value="code2" type="textarea" :rows="8" placeholder="输入源代码..." />
          </NCard>
        </NGridItem>
      </NGrid>

      <NButton type="primary" @click="analyze">比较 AST</NButton>

      <NCard v-if="similarityResult" title="相似度评分">
        <NGrid :cols="3" :x-gap="16">
          <NGridItem>
            <NStatistic
              label="相似度分数"
              :value="(similarityResult.score * 100).toFixed(2)"
              suffix="%"
            />
          </NGridItem>
          <NGridItem>
            <NStatistic label="编辑距离" :value="similarityResult.distance" />
          </NGridItem>
          <NGridItem>
            <NStatistic label="操作数" :value="similarityResult.operations.length" />
          </NGridItem>
        </NGrid>
      </NCard>

      <NTabs v-if="similarityResult" type="line">
        <NTabPane name="operations" tab="编辑操作">
          <NSpace vertical>
            <NCard
              v-for="(op, idx) in similarityResult.operations"
              :key="idx"
              :title="`操作 ${idx + 1}`"
            >
              <NTag
                :type="
                  op.type === 'delete' ? 'error' : op.type === 'insert' ? 'success' : 'warning'
                "
              >
                {{ op.type }}
              </NTag>
              <p>节点 ID: {{ op.node.id }}</p>
            </NCard>
          </NSpace>
        </NTabPane>

        <NTabPane name="ast1" tab="AST 1">
          <pre>{{ ast1 ? renderAST(ast1) : "" }}</pre>
        </NTabPane>

        <NTabPane name="ast2" tab="AST 2">
          <pre>{{ ast2 ? renderAST(ast2) : "" }}</pre>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
