<script setup lang="ts">
import { NCard, NSelect, NInput, NButton, NSpace, NTag, NEmpty } from 'naive-ui'
import { useQA } from '../composables/useQA'

const {
  currentCourse,
  question,
  answer,
  matchedRule,
  courses,
  ask,
  clear
} = useQA()
</script>

<template>
  <NCard title="智能问答" embedded>
    <NSpace vertical :size="16">
      <!-- 课程选择 -->
      <div>
        <label style="font-weight: 500; margin-bottom: 8px; display: block;">选择课程</label>
        <NSelect
          v-model:value="currentCourse"
          :options="courses"
          placeholder="请选择课程"
          style="max-width: 300px;"
        />
      </div>

      <!-- 问题输入 -->
      <div>
        <label style="font-weight: 500; margin-bottom: 8px; display: block;">请输入问题</label>
        <NInput
          v-model:value="question"
          type="text"
          placeholder="例如：什么是词法分析？"
          @keyup.enter="ask"
        />
      </div>

      <!-- 操作按钮 -->
      <NSpace>
        <NButton type="primary" @click="ask">提问</NButton>
        <NButton @click="clear">清除</NButton>
      </NSpace>

      <!-- 匹配提示 -->
      <div v-if="matchedRule" style="margin-top: 8px;">
        <NTag type="success" size="small">匹配到: {{ matchedRule.question }}</NTag>
      </div>

      <!-- 答案显示 -->
      <NCard v-if="answer" embedded>
        <template #header>答案</template>
        <div style="line-height: 1.8;">{{ answer }}</div>
      </NCard>

      <NEmpty v-else-if="!question" description="请输入问题获取答案" />
    </NSpace>
  </NCard>
</template>
