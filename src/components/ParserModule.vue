<script setup lang="ts">
import { NCard, NSpace, NInput, NRadioGroup, NRadio, NButton, NResult, NTag, NCard as NCardNested, NDivider } from 'naive-ui'
import { useParser } from '../composables/useParser'
import { useDerivation } from '../composables/useDerivation'

// 句型判定功能
const {
  inputString,
  parseType,
  parseResult,
  clear: clearParse,
  execute: executeParse
} = useParser()

// 推导功能
const {
  derivationType,
  derivationResult,
  executeDerivation,
  clear: clearDerivation
} = useDerivation()

function onDerivationTypeChange(type: 'left' | 'right') {
  derivationType.value = type
}

function execute() {
  executeParse()
  derivationResult.value = executeDerivation(inputString.value)
}

function clearAll() {
  inputString.value = ''
  parseResult.value = null
  derivationResult.value = null
  clearParse()
  clearDerivation()
}
</script>

<template>
  <NCard title="句型判定与推导生成" embedded>
    <NSpace vertical :size="16">
      <!-- 判定类型选择 -->
      <div>
        <label style="font-weight: 500; margin-bottom: 8px; display: block;">判定类型</label>
        <NRadioGroup v-model:value="parseType" name="parseType">
          <NSpace>
            <NRadio value="sentence">句子</NRadio>
            <NRadio value="phrase">句型</NRadio>
          </NSpace>
        </NRadioGroup>
      </div>

      <!-- 推导类型选择 -->
      <div>
        <label style="font-weight: 500; margin-bottom: 8px; display: block;">推导类型</label>
        <NSpace>
          <NRadio :checked="derivationType === 'left'" @change="() => onDerivationTypeChange('left')">
            最左推导
          </NRadio>
          <NRadio :checked="derivationType === 'right'" @change="() => onDerivationTypeChange('right')">
            最右推导
          </NRadio>
        </NSpace>
      </div>

      <!-- 符号串输入 -->
      <div>
        <label style="font-weight: 500; margin-bottom: 8px; display: block;">输入符号串</label>
        <NInput
          v-model:value="inputString" type="text" placeholder="例如：id + id * id 或 if id then id else id"
          @keyup.enter="execute"
        />
        <div style="margin-top: 8px; font-size: 12px; color: #666;">
          终结符: id, +, -, *, /, (, ) <br />
          二义性检测: if id then if id then id else id
        </div>
      </div>

      <!-- 操作按钮 -->
      <NSpace>
        <NButton type="primary" @click="execute">判定</NButton>
        <NButton @click="clearAll">清除</NButton>
      </NSpace>

      <NDivider />

      <!-- 句型判定结果 -->
      <template v-if="parseResult">
        <NResult
          :status="parseResult.isValid ? 'success' : 'error'" :title="parseResult.isValid ? '是' : '不是'"
          :description="parseResult.message"
        >
          <template #footer>
            <NSpace vertical :size="8">
              <div>判定类型: {{ parseResult.type === 'sentence' ? '句子' : '句型' }}</div>
              <NTag :type="parseResult.isValid ? 'success' : 'error'">
                {{ parseResult.isValid ? '合法' : '非法' }}
              </NTag>
            </NSpace>
          </template>
        </NResult>
      </template>

      <!-- 推导结果 -->
      <template v-if="derivationResult">
        <NCardNested title="推导步骤" embedded>
          <NSpace vertical :size="8">
            <div style="margin-bottom: 8px; color: #666;">
              {{ derivationResult.message }}
            </div>
            <div
              v-for="(step, idx) in derivationResult.steps" :key="idx"
              style="font-family: monospace; padding: 4px 0;"
            >
              <NTag size="small" style="margin-right: 8px;">{{ idx + 1 }}</NTag>
              {{ step }}
            </div>
          </NSpace>
        </NCardNested>

        <!-- 语法树 -->
        <NCardNested v-if="derivationResult.syntaxTree" title="语法树" embedded>
          <pre
            style="font-family: monospace; font-size: 13px; line-height: 1.4; margin: 0;"
          >{{ derivationResult.syntaxTree }}</pre>
        </NCardNested>

        <!-- 二义性检测结果 -->
        <NCardNested v-if="derivationResult.isAmbiguous" title="二义性分析" embedded>
          <NSpace vertical :size="12">
            <NTag type="warning">该文法是二义性文法</NTag>
            <div style="color: #666;">{{ derivationResult.message }}</div>

            <div v-if="derivationResult.parseTrees && derivationResult.parseTrees.length > 0">
              <div style="font-weight: 500; margin-bottom: 8px;">语法树 1:</div>
              <pre
                style="font-family: monospace; font-size: 13px; line-height: 1.4; background: #f5f5f5; padding: 12px; border-radius: 4px;"
              >{{ derivationResult.parseTrees[0] }}</pre>

              <div style="font-weight: 500; margin: 12px 0 8px;">语法树 2:</div>
              <pre
                style="font-family: monospace; font-size: 13px; line-height: 1.4; background: #f5f5f5; padding: 12px; border-radius: 4px;"
              >{{ derivationResult.parseTrees[1] }}</pre>
            </div>
          </NSpace>
        </NCardNested>
      </template>
    </NSpace>
  </NCard>
</template>
