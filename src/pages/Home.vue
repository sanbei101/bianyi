<script setup lang="ts">
import { NCard, NSpace, NH1, NP, NGrid, NGridItem } from "naive-ui";
</script>

<template>
  <div class="p-6">
    <NSpace vertical size="large">
      <NCard>
        <NH1>编译原理课程综合实验: AI 助学平台</NH1>
        <NP>本系统涵盖以下功能模块:</NP>
      </NCard>

      <NGrid :cols="3" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NCard title="词法分析" hoverable>
            <NP>DFA 识别关键字、标识符、常数、运算符、界符</NP>
            <NP>输出 Token 列表,标注非法字符</NP>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="文法分析" hoverable>
            <NP>Chomsky 0~3 型自动判定</NP>
            <NP>最左推导/归约步骤可视化,句柄定位</NP>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="LL(1) 分析" hoverable>
            <NP>FIRST/FOLLOW 计算、预测分析表构造</NP>
            <NP>冲突检测、递归下降 Parser 生成 AST</NP>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="LLM 约束生成" hoverable>
            <NP>以 LL(1) 分析表为约束生成代码</NP>
            <NP>对比无约束生成,报告格式合规率提升</NP>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="AST 相似度" hoverable>
            <NP>Zhang-Shasha 树编辑距离</NP>
            <NP>输出相似度分数与差异节点高亮</NP>
          </NCard>
        </NGridItem>
        <NGridItem>
          <NCard title="语义分析" hoverable>
            <NP>符号表支持作用域</NP>
            <NP>检查变量重定义和未声明引用</NP>
          </NCard>
        </NGridItem>
      </NGrid>
    </NSpace>
  </div>
</template>
