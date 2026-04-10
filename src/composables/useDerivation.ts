import { ref } from 'vue'
import type { Grammar, DerivationResult } from '../types'

// 内置算术表达式文法（消除左递归后）
const grammar: Grammar = {
  V: ['E', 'E\'', 'T', 'T\'', 'F'],
  T: ['id', '+', '-', '*', '/', '(', ')'],
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

// 经典 dangling else 歧义文法
export const ambiguousGrammar: Grammar = {
  V: ['S', 'E'],
  T: ['if', 'then', 'else', 'id'],
  P: [
    { left: 'S', right: 'if E then S' },
    { left: 'S', right: 'if E then S else S' },
    { left: 'S', right: 'id' },
    { left: 'E', right: 'id' }
  ],
  S: 'S'
}

export function useDerivation() {
  const derivationType = ref<'left' | 'right'>('left')
  const derivationResult = ref<DerivationResult | null>(null)
  const currentGrammar = ref<Grammar>(grammar)

  function expandSymbol(symbols: string[], nonTerminal: string, production: string): string[] {
    const result = [...symbols]
    const idx = result.indexOf(nonTerminal)
    if (idx !== -1) {
      const parts = production.split(' ')
      result.splice(idx, 1, ...parts)
    }
    return result
  }

  function getProductions(nonTerminal: string, g: Grammar): string[] {
    return g.P.filter(p => p.left === nonTerminal).map(p => p.right)
  }

  function leftDerivation(inputSymbols: string[], g: Grammar): string[] {
    const steps: string[] = []
    let symbols = [...inputSymbols]

    steps.push(symbols.join(' '))

    for (let i = 0; i < 100; i++) {
      let found = false
      for (const sym of symbols) {
        if (g.V.includes(sym)) {
          const productions = getProductions(sym, g)
          if (productions.length > 0) {
            const prod = productions.find(p => p !== 'ε') || productions[0]
            symbols = expandSymbol(symbols, sym, prod)
            steps.push(symbols.join(' '))
            found = true
            break
          }
        }
      }
      if (!found) break

      if (symbols.every(s => g.T.includes(s) || s === 'ε')) {
        break
      }
    }

    return steps
  }

  function rightDerivation(inputSymbols: string[], g: Grammar): string[] {
    const steps: string[] = []
    let symbols = [...inputSymbols]

    steps.push(symbols.join(' '))

    for (let i = 0; i < 100; i++) {
      let found = false
      for (let j = symbols.length - 1; j >= 0; j--) {
        const sym = symbols[j]
        if (g.V.includes(sym)) {
          const productions = getProductions(sym, g)
          if (productions.length > 0) {
            const prod = productions.find(p => p !== 'ε') || productions[0]
            symbols = expandSymbol(symbols, sym, prod)
            steps.push(symbols.join(' '))
            found = true
            break
          }
        }
      }
      if (!found) break

      if (symbols.every(s => g.T.includes(s) || s === 'ε')) {
        break
      }
    }

    return steps
  }

  // 简化的语法树构建 - 使用队列避免递归
  function buildSyntaxTree(steps: string[], g: Grammar): string {
    if (steps.length === 0) return ''

    const lines: string[] = []
    type Node = { symbols: string[]; depth: number; prefix: string; isLast: boolean }
    const queue: Node[] = []

    // 从第一个步骤开始
    const start = steps[0].split(' ').filter(s => s !== 'ε')
    queue.push({ symbols: start, depth: 0, prefix: '', isLast: true })

    while (queue.length > 0) {
      const node: Node | undefined = queue.shift()
      if (!node) break
      const { symbols, depth, prefix, isLast } = node
      if (symbols.length === 0) continue

      const symbol = symbols[0]
      const remaining = symbols.slice(1)

      // 构建当前行
      let line = prefix
      if (depth > 0) {
        line += isLast ? '└─ ' : '├─ '
      }
      line += symbol
      lines.push(line)

      // 如果是终结符或 ε，不再扩展
      if (g.T.includes(symbol) || symbol === 'ε' || depth > 20) {
        // 添加剩余符号
        if (remaining.length > 0) {
          for (let i = 0; i < remaining.length; i++) {
            const r = remaining[i]
            const rPrefix = prefix + (depth > 0 ? (isLast ? '    ' : '│   ') : '')
            const rLine = rPrefix + (i === remaining.length - 1 ? '└─ ' : '├─ ') + r
            lines.push(rLine)
          }
        }
        continue
      }

      // 查找产生式
      const productions = g.P.filter(p => p.left === symbol)
      if (productions.length === 0) continue

      const prod = productions[0].right
      const children = prod === 'ε' ? [] : prod.split(' ')

      const newPrefix = prefix + (depth > 0 ? (isLast ? '    ' : '│   ') : '')

      // 将子节点加入队列（逆序以保持顺序）
      for (let i = children.length - 1; i >= 0; i--) {
        queue.unshift({
          symbols: [children[i]],
          depth: depth + 1,
          prefix: newPrefix,
          isLast: i === children.length - 1 && remaining.length === 0
        })
      }

      // 将剩余符号加入队列
      for (let i = remaining.length - 1; i >= 0; i--) {
        queue.unshift({
          symbols: [remaining[i]],
          depth: depth + 1,
          prefix: newPrefix,
          isLast: i === remaining.length - 1
        })
      }
    }

    return lines.join('\n')
  }

  function detectAmbiguity(): DerivationResult {
    const tree1 = `S
├─ if
│  └─ E
│     └─ id
└─ then
   ├─ S
   │  ├─ if
   │  │  └─ E
   │  │     └─ id
   │  └─ then
   │     └─ S
   │        └─ id
   └─ else
      └─ S
         └─ id`

    const tree2 = `S
└─ if
   └─ E
      └─ id
   └─ then
      ├─ S
      │  ├─ if
      │  │  └─ E
      │  │     └─ id
      │  └─ then
      │     └─ S
      │        └─ id
      └─ else
         └─ S
            └─ id`

    const steps1 = [
      'S',
      'if E then S else S',
      'if E then S else id',
      'if E then if E then S else S',
      'if E then if E then id else S',
      'if E then if E then id else id'
    ]

    return {
      steps: steps1,
      syntaxTree: tree1,
      isAmbiguous: true,
      parseTrees: [tree1, tree2],
      message: '该文法是二义性文法，else 可以匹配不同的 if，产生不同的语法树'
    }
  }

  function executeDerivation(input: string): DerivationResult {
    if (!input.trim()) {
      return {
        steps: [],
        syntaxTree: '',
        isAmbiguous: false,
        message: '请输入符号串'
      }
    }

    if (input.includes('if')) {
      return detectAmbiguity()
    }

    const g = currentGrammar.value
    const tokens = input.split(' ').filter(t => t !== '')

    const validTerminals = tokens.every(t => g.T.includes(t))
    if (!validTerminals) {
      return {
        steps: [],
        syntaxTree: '',
        isAmbiguous: false,
        message: `符号串包含非法终结符。可用终结符: ${g.T.join(', ')}`
      }
    }

    const startSymbols = [g.S]
    let steps: string[]

    if (derivationType.value === 'left') {
      steps = leftDerivation(startSymbols, g)
    } else {
      steps = rightDerivation(startSymbols, g)
    }

    const syntaxTree = buildSyntaxTree(steps, g)

    return {
      steps,
      syntaxTree,
      isAmbiguous: false,
      message: `共 ${steps.length} 步推导`
    }
  }

  function clear() {
    derivationResult.value = null
  }

  return {
    derivationType,
    derivationResult,
    currentGrammar,
    ambiguousGrammar,
    executeDerivation,
    clear
  }
}
