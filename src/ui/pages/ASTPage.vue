<script setup lang="ts">
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
import { ref } from "vue";

import { tokenize } from "@/lexer";
import { parseTokens } from "@/parser";
import { compareASTs, highlightDifferences } from "@/parser/ast-similarity";
import type { ASTNode, ASTSimilarityResult } from "@/types";

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
const diffNodes1 = ref<Set<string>>(new Set());
const diffNodes2 = ref<Set<string>>(new Set());

const analyze = () => {
  const tokens1 = tokenize(code1.value);
  const tokens2 = tokenize(code2.value);

  const result1 = parseTokens(tokens1);
  const result2 = parseTokens(tokens2);

  ast1.value = result1.ast;
  ast2.value = result2.ast;

  if (result1.ast && result2.ast) {
    similarityResult.value = compareASTs(result1.ast, result2.ast);
    const diff = highlightDifferences(result1.ast, result2.ast);
    diffNodes1.value = diff.nodes1;
    diffNodes2.value = diff.nodes2;
  }
};

type LineNode = { text: string; diff: boolean };

const renderAST = (node: ASTNode, diffSet: Set<string>, indent = 0): LineNode[] => {
  const prefix = "  ".repeat(indent);
  const label = `${node.type}${node.value !== undefined ? `: ${node.value}` : ""}`;
  const lines: LineNode[] = [{ text: `${prefix}${label}`, diff: diffSet.has(node.id) }];
  for (const child of node.children) {
    lines.push(...renderAST(child, diffSet, indent + 1));
  }
  return lines;
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

        <NTabPane name="diff" tab="差异高亮">
          <NGrid :cols="2" :x-gap="16">
            <NGridItem>
              <NCard>
                <template #header>
                  <NSpace align="center">
                    <span>AST 1</span>
                    <NTag type="error" size="small">删除 / 重命名</NTag>
                  </NSpace>
                </template>
                <pre v-if="ast1" class="text-sm leading-6">
                  <template v-for="(line, i) in renderAST(ast1, diffNodes1)" :key="i"><span :class="line.diff ? 'bg-red-100 text-red-700 rounded px-1' : ''">{{ line.text }}
</span></template>
                </pre>
              </NCard>
            </NGridItem>
            <NGridItem>
              <NCard>
                <template #header>
                  <NSpace align="center">
                    <span>AST 2</span>
                    <NTag type="success" size="small">插入 / 重命名</NTag>
                  </NSpace>
                </template>
                <pre v-if="ast2" class="text-sm leading-6">
                  <template v-for="(line, i) in renderAST(ast2, diffNodes2)" :key="i"><span :class="line.diff ? 'bg-green-100 text-green-700 rounded px-1' : ''">{{ line.text }}
</span></template>
                </pre>
              </NCard>
            </NGridItem>
          </NGrid>
        </NTabPane>

        <NTabPane name="ast1" tab="AST 1（完整）">
          <pre v-if="ast1" class="text-sm">{{ renderAST(ast1, new Set()).map(l => l.text).join("\n") }}</pre>
        </NTabPane>

        <NTabPane name="ast2" tab="AST 2（完整）">
          <pre v-if="ast2" class="text-sm">{{ renderAST(ast2, new Set()).map(l => l.text).join("\n") }}</pre>
        </NTabPane>
      </NTabs>
    </NSpace>
  </div>
</template>
