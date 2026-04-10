import { ref, computed } from 'vue'
import type { Grammar } from '../types'

// 内置算术表达式文法（消除左递归后）
const grammar: Grammar = {
  V: ['E', 'E\'', 'T', 'T\'', 'F'],  // 非终结符
  T: ['id', '+', '-', '*', '/', '(', ')'],  // 终结符
  P: [
    { left: 'E', right: 'T E\'' },
    { left: 'E\'', right: '+ T E\'' },
    { left: 'E\'', right: '- T E\'' },
    { left: 'E\'', right: 'ε' },
    { left: 'T', right: 'F T\'' },
    { left: 'T\'', right: '* F T\'' },
    { left: 'T\'', right: '/ F T\'' },
    { left: 'T\'', right: 'ε' },
    { left: 'F', right: '( E )' },
    { left: 'F', right: 'id' }
  ],
  S: 'E'
}

export function useGrammar() {
  const grammarRef = ref(grammar)

  // 获取四元组信息
  const grammarInfo = computed(() => {
    const g = grammarRef.value
    return {
      V: g.V,
      T: g.T,
      P: g.P,
      S: g.S,
      // 显示格式化的四元组
      formal: `G = (V, T, P, S)\nV = {${g.V.join(', ')}}\nT = {${g.T.join(', ')}}\nS = ${g.S}`
    }
  })

  // 区分终结符和非终结符
  function classifySymbol(symbol: string): 'terminal' | 'non-terminal' | 'epsilon' | 'unknown' {
    if (symbol === 'ε') return 'epsilon'
    if (grammarRef.value.V.includes(symbol)) return 'non-terminal'
    if (grammarRef.value.T.includes(symbol)) return 'terminal'
    return 'unknown'
  }

  // 解析符号串，返回终结符列表
  function parseSymbolString(input: string): string[] {
    // 简单解析：按空格或每个字符分开
    const tokens: string[] = []
    let current = ''

    for (const char of input.trim()) {
      if (char === ' ') continue

      // 处理 id (标识符)
      if (/[a-z_]/i.test(char)) {
        if (current && !/[a-z_]/i.test(current)) {
          if (current) tokens.push(current)
          current = char
        } else {
          current += char
        }
      } else {
        if (current) {
          // 检查 current 是否是 id
          if (/^[a-z_]\w*$/i.test(current)) {
            tokens.push('id')
          } else {
            tokens.push(current)
          }
          current = ''
        }

        // 处理运算符和括号
        if ('+-*/()'.includes(char)) {
          tokens.push(char)
        } else if (/\d/.test(char)) {
          // 数字作为 id 处理
          current += char
        }
      }
    }

    if (current) {
      if (/^[a-z_]\w*$/i.test(current)) {
        tokens.push('id')
      } else {
        tokens.push(current)
      }
    }

    return tokens
  }

  // 获取产生式列表（格式化）
  const productionList = computed(() => {
    return grammarRef.value.P.map((p, i) => ({
      index: i + 1,
      left: p.left,
      right: p.right,
      display: `${p.left} → ${p.right}`
    }))
  })

  return {
    grammarRef,
    grammarInfo,
    productionList,
    classifySymbol,
    parseSymbolString
  }
}
