import { ref } from 'vue'
import type { ParseResult } from '../types'
import { useGrammar } from './useGrammar'

export function useParser() {
  const { grammarRef, parseSymbolString, classifySymbol } = useGrammar()

  const inputString = ref('')
  const parseType = ref<'sentence' | 'phrase'>('sentence')
  const parseResult = ref<ParseResult | null>(null)

  // 递归下降分析函数
  // E → T E'
  // E' → + T E' | - T E' | ε
  // T → F T'
  // T' → * F T' | / F T' | ε
  // F → ( E ) | id

  let tokens: string[] = []
  let pos = 0
  const derivationSteps: string[] = []

  function match(expected: string): boolean {
    if (pos < tokens.length && tokens[pos] === expected) {
      pos++
      return true
    }
    return false
  }

  function parseE(): boolean {
    derivationSteps.push(`E → T E'`)
    if (!parseT()) return false
    if (!parseE_prime()) return false
    return true
  }

  function parseE_prime(): boolean {
    if (match('+')) {
      derivationSteps.push(`E' → + T E'`)
      if (!parseT()) return false
      if (!parseE_prime()) return false
      return true
    }
    if (match('-')) {
      derivationSteps.push(`E' → - T E'`)
      if (!parseT()) return false
      if (!parseE_prime()) return false
      return true
    }
    // ε
    derivationSteps.push(`E' → ε`)
    return true
  }

  function parseT(): boolean {
    derivationSteps.push(`T → F T'`)
    if (!parseF()) return false
    if (!parseT_prime()) return false
    return true
  }

  function parseT_prime(): boolean {
    if (match('*')) {
      derivationSteps.push(`T' → * F T'`)
      if (!parseF()) return false
      if (!parseT_prime()) return false
      return true
    }
    if (match('/')) {
      derivationSteps.push(`T' → / F T'`)
      if (!parseF()) return false
      if (!parseT_prime()) return false
      return true
    }
    // ε
    derivationSteps.push(`T' → ε`)
    return true
  }

  function parseF(): boolean {
    if (match('(')) {
      derivationSteps.push(`F → ( E )`)
      if (!parseE()) return false
      if (!match(')')) return false
      return true
    }
    if (match('id')) {
      derivationSteps.push(`F → id`)
      return true
    }
    return false
  }

  function parse(startSymbol: string): boolean {
    if (startSymbol === 'E') {
      return parseE()
    }
    return false
  }

  // 执行判定
  function parseInput(): ParseResult {
    if (!inputString.value.trim()) {
      return {
        isValid: false,
        type: 'invalid',
        message: '请输入符号串'
      }
    }

    tokens = parseSymbolString(inputString.value)
    pos = 0
    derivationSteps.length = 0

    // 去除 ε 后的终结符检查
    const terminalsOnly = tokens.every(t => {
      const cls = classifySymbol(t)
      return cls === 'terminal' || cls === 'epsilon'
    })

    if (!terminalsOnly) {
      return {
        isValid: false,
        type: 'invalid',
        message: `符号串包含非法符号。可用终结符: ${grammarRef.value.T.join(', ')}`
      }
    }

    const success = parse('E')

    // 检查是否完全消耗
    if (success && pos === tokens.length) {
      const resultType = parseType.value
      return {
        isValid: true,
        type: resultType,
        derivation: [...derivationSteps],
        message: resultType === 'sentence'
          ? '是句子（仅含终结符）'
          : '是句型'
      }
    } else if (success && pos < tokens.length) {
      return {
        isValid: false,
        type: 'invalid',
        derivation: [...derivationSteps],
        message: `分析未完全消耗输入，停留在位置 ${pos}`
      }
    }

    return {
      isValid: false,
      type: 'invalid',
      derivation: [...derivationSteps],
      message: '不是该文法的句型/句子'
    }
  }

  function execute() {
    parseResult.value = parseInput()
  }

  function clear() {
    inputString.value = ''
    parseResult.value = null
    derivationSteps.length = 0
  }

  return {
    inputString,
    parseType,
    parseResult,
    execute,
    clear
  }
}
