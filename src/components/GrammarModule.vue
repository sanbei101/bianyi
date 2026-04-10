<script setup lang="ts">
import { NCard, NDescriptions, NDescriptionsItem, NTag, NSpace } from 'naive-ui'
import { useGrammar } from '../composables/useGrammar'

const {
  grammarInfo,
  productionList,
  classifySymbol
} = useGrammar()

function getTagType(symbolType: 'terminal' | 'non-terminal' | 'epsilon' | 'unknown'): 'success' | 'info' | 'warning' | 'error' {
  switch (symbolType) {
    case 'terminal': return 'success'
    case 'non-terminal': return 'info'
    case 'epsilon': return 'warning'
    default: return 'error'
  }
}
</script>

<template>
  <NCard title="文法解析" embedded>
    <NSpace vertical :size="24">
      <!-- 文法四元组 -->
      <NCard title="文法四元组 G = (V, T, P, S)" embedded>
        <NDescriptions :column="1" label-placement="left">
          <NDescriptionsItem label="V (非终结符集合)">
            <NSpace>
              <NTag
                v-for="symbol in grammarInfo.V"
                :key="symbol"
                type="info"
                size="small"
              >
                {{ symbol }}
              </NTag>
            </NSpace>
          </NDescriptionsItem>
          <NDescriptionsItem label="T (终结符集合)">
            <NSpace>
              <NTag
                v-for="symbol in grammarInfo.T"
                :key="symbol"
                type="success"
                size="small"
              >
                {{ symbol }}
              </NTag>
            </NSpace>
          </NDescriptionsItem>
          <NDescriptionsItem label="S (开始符号)">
            <NTag type="error" size="small">{{ grammarInfo.S }}</NTag>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>

      <!-- 产生式 -->
      <NCard title="产生式集合 P" embedded>
        <NSpace vertical :size="8">
          <div
            v-for="prod in productionList"
            :key="prod.index"
            style="font-family: monospace; font-size: 14px;"
          >
            <span style="color: #18a058;">{{ prod.left }}</span>
            <span> → </span>
            <span>
              <NTag
                v-for="(sym, idx) in prod.right.split(' ')"
                :key="idx"
                :type="getTagType(classifySymbol(sym))"
                size="tiny"
                style="margin: 0 2px;"
              >
                {{ sym }}
              </NTag>
            </span>
          </div>
        </NSpace>
      </NCard>

      <!-- 符号说明 -->
      <NCard title="符号说明" embedded>
        <NSpace>
          <NTag type="info">蓝色: 非终结符</NTag>
          <NTag type="success">绿色: 终结符</NTag>
          <NTag type="warning">黄色: ε (空)</NTag>
        </NSpace>
      </NCard>
    </NSpace>
  </NCard>
</template>
