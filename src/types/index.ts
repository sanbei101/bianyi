// 课程类型
export type Course = 'compiler' | 'data-structure' | 'computer-organization'

// 问答规则
export type QARule = {
  id: number
  keywords: string[]
  course: Course
  question: string
  answer: string
}

// 文法四元组
export type Grammar = {
  V: string[]      // 非终结符集合
  T: string[]      // 终结符集合
  P: Array<{ left: string; right: string }>  // 产生式
  S: string        // 开始符号
}

// 判定结果
export type ParseResult = {
  isValid: boolean
  type: 'sentence' | 'phrase' | 'invalid'
  derivation?: string[]
  message: string
}

// 推导结果
export type DerivationResult = {
  steps: string[]           // 推导步骤序列
  syntaxTree: string        // ASCII 语法树
  isAmbiguous: boolean     // 是否二义
  parseTrees?: string[]    // 如果二义，返回多个语法树
  message: string          // 提示信息
  reductions?: string[]
  handles?: string[]
}
