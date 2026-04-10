<script setup lang="ts">
import { NLayout, NLayoutHeader, NLayoutContent, NTabs, NTabPane, NH1, NSpace, NTag } from 'naive-ui'
import QAModule from './components/QAModule.vue'
import GrammarModule from './components/GrammarModule.vue'
import ParserModule from './components/ParserModule.vue'
</script>

<template>
  <NLayout style="height: 100vh;">
    <NLayoutHeader style="padding: 16px 24px;" bordered>
      <NSpace align="center" justify="space-between">
        <NH1 style="margin: 0; font-size: 24px;">计算机专业课智能学习助手</NH1>
        <NSpace>
          <NTag type="info">编译原理</NTag>
          <NTag type="success">数据结构</NTag>
          <NTag type="warning">计算机组成原理</NTag>
        </NSpace>
      </NSpace>
    </NLayoutHeader>

    <NLayoutContent style="padding: 24px;" content-style="max-width: 1200px; margin: 0 auto;">
      <NTabs type="line" animated>
        <NTabPane name="qa" tab="智能问答">
          <QAModule />
        </NTabPane>
        <NTabPane name="grammar" tab="文法解析">
          <GrammarModule />
        </NTabPane>
        <NTabPane name="parser" tab="句型判定">
          <ParserModule />
        </NTabPane>
      </NTabs>
    </NLayoutContent>
  </NLayout>
</template>
