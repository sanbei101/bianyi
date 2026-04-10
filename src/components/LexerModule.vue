<script setup lang="ts">
import { ref, h } from 'vue'
import { NCard, NSpace, NInput, NButton, NDataTable, NTag } from 'naive-ui'

const inputCode = ref('x = 5 + 3.14 * b12')
const lexResult = ref<Array<{ type: string, value: string }>>([])

function analyze() {
    const code = inputCode.value
    const tokens = []
    let i = 0

    const keywords = ['if', 'else', 'while', 'for', 'int', 'return', 'float', 'void', 'char']

    let state = 'START' // 状态机：START, IN_ID, IN_INTEGER, IN_FLOAT, IN_OP, ERROR
    let currentToken = ''

    function pushToken(type: string, val: string) {
        if (type === '标识符' && keywords.includes(val)) {
            tokens.push({ type: '关键字', value: val })
        } else {
            tokens.push({ type, value: val })
        }
    }

    while (i < code.length) {
        const char = code[i]

        switch (state) {
            case 'START':
                if (/\s/.test(char)) {
                    i++
                } else if (/[a-zA-Z_]/.test(char)) {
                    state = 'IN_ID'
                    currentToken += char
                    i++
                } else if (/\d/.test(char)) {
                    state = 'IN_INTEGER'
                    currentToken += char
                    i++
                } else if (/[+\-*/=><!]/.test(char)) {
                    state = 'IN_OP'
                    currentToken += char
                    i++
                } else if (/[()[\]{};,]/.test(char)) {
                    tokens.push({ type: '界符', value: char })
                    i++
                } else {
                    state = 'ERROR'
                    currentToken += char
                    i++
                }
                break

            case 'IN_ID':
                if (/[a-zA-Z0-9_]/.test(char)) {
                    currentToken += char
                    i++
                } else {
                    pushToken('标识符', currentToken)
                    currentToken = ''
                    state = 'START'
                }
                break

            case 'IN_INTEGER':
                if (/\d/.test(char)) {
                    currentToken += char
                    i++
                } else if (char === '.') {
                    state = 'IN_FLOAT'
                    currentToken += char
                    i++
                } else if (/[a-zA-Z_]/.test(char)) {
                    // 数字后直接接字母，视为错误 (如 12a)
                    state = 'ERROR'
                    currentToken += char
                    i++
                } else {
                    pushToken('常数', currentToken)
                    currentToken = ''
                    state = 'START'
                }
                break

            case 'IN_FLOAT':
                if (/\d/.test(char)) {
                    currentToken += char
                    i++
                } else if (/[a-zA-Z_\.]/.test(char)) {
                    // 浮点数后多余的小数点或字母 (如 1.2.3 或 1.2a)
                    state = 'ERROR'
                    currentToken += char
                    i++
                } else {
                    if (currentToken.endsWith('.')) {
                        pushToken('词法错误(非法结尾)', currentToken)
                    } else {
                        pushToken('常数', currentToken)
                    }
                    currentToken = ''
                    state = 'START'
                }
                break

            case 'IN_OP':
                if (char === '=' && /^[<>=!]$/.test(currentToken)) {
                    currentToken += char
                    i++
                }
                pushToken('运算符', currentToken)
                currentToken = ''
                state = 'START'
                break

            case 'ERROR':
                if (/\s/.test(char) || /[()[\]{};,]/.test(char) || /[+\-*/=><!]/.test(char)) {
                    pushToken('词法错误(非法构造)', currentToken)
                    currentToken = ''
                    state = 'START'
                } else {
                    currentToken += char
                    i++
                }
                break
        }
    }

    if (currentToken !== '') {
        if (state === 'IN_ID') {
            pushToken('标识符', currentToken)
        } else if (state === 'IN_INTEGER' || state === 'IN_FLOAT') {
            if (currentToken.endsWith('.')) {
                pushToken('词法错误(非法结尾)', currentToken)
            } else {
                pushToken('常数', currentToken)
            }
        } else if (state === 'IN_OP') {
            pushToken('运算符', currentToken)
        } else if (state === 'ERROR') {
            pushToken('词法错误', currentToken)
        }
    }

    lexResult.value = tokens
}

const columns = [
    { title: '单词 (Token)', key: 'value' },
    {
        title: '类型',
        key: 'type',
        render(row: any) {
            let tagType = 'default'
            if (row.type.includes('错误')) tagType = 'error'
            else if (row.type === '关键字') tagType = 'primary'
            else if (row.type === '常数') tagType = 'success'
            else if (row.type === '运算符' || row.type === '界符') tagType = 'warning'
            return h(NTag, { type: tagType as any, bordered: false }, { default: () => row.type })
        }
    }
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