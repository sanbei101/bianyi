<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NSpace, NInput, NButton, NDataTable } from 'naive-ui'

const inputCode = ref('x = 5 + a * 10')
const lexResult = ref<Array<{ type: string, value: string }>>([])

function analyze() {
    const code = inputCode.value
    const tokens = []
    let i = 0

    const keywords = ['if', 'else', 'while', 'for', 'int', 'return', 'float', 'void', 'char']

    while (i < code.length) {
        const char = code[i]
        if (/\s/.test(char)) {
            i++
            continue
        }

        // Identifier & Keyword
        if (/[a-z_]/i.test(char)) {
            let val = ''
            while (i < code.length && /\w/.test(code[i])) {
                val += code[i]
                i++
            }
            tokens.push({
                type: keywords.includes(val) ? '关键字' : '标识符',
                value: val
            })
            continue
        }

        // Constant (Numbers)
        if (/\d/.test(char)) {
            let val = ''
            while (i < code.length && /\d/.test(code[i])) {
                val += code[i]
                i++
            }
            tokens.push({ type: '常数', value: val })
            continue
        }

        // Operators
        if (/[=+\-*/><]/.test(char)) {
            tokens.push({ type: '运算符', value: char })
            i++
            continue
        }

        // Delimiters
        if (/[();,{}]/.test(char)) {
            tokens.push({ type: '界符', value: char })
            i++
            continue
        }

        tokens.push({ type: '未知', value: char })
        i++
    }
    lexResult.value = tokens
}

const columns = [
    { title: '单词 (Token)', key: 'value' },
    { title: '类型', key: 'type' }
]
</script>

<template>
  <NCard title="词法分析基础模块" embedded>
    <NSpace vertical>
      <div style="margin-bottom: 8px;">定义计算机专业词法单元：关键字、标识符、常数、运算符、界符；对简单算术表达式完成基础词法切分，输出拆分后的符号列表。</div>
      <NInput v-model:value="inputCode" type="textarea" placeholder="输入一段代码，如 x = 5 + a * 10" rows="3" />
      <NButton type="primary" @click="analyze">执行词法分析</NButton>
      <NDataTable v-if="lexResult.length" :columns="columns" :data="lexResult" />
    </NSpace>
  </NCard>
</template>