import { ref } from 'vue'
import type { QARule, Course } from '../types'
import { qaRules } from '../data/qa-rules'

// 停用词列表
const stopWords = new Set(['的', '是', '什么', '啊', '呢', '了', '和', '与', '或', '在', '有', '个', '吗', '？', '?'])

// 正则表达式（模块级别）
const TOKENIZE_PATTERN = /[\s,，、。.!?()]+/

// 课程选项（模块级别，避免重复创建）
const courses: Array<{ label: string; value: Course }> = [
  { label: '编译原理', value: 'compiler' },
  { label: '数据结构', value: 'data-structure' },
  { label: '计算机组成原理', value: 'computer-organization' }
]

export function useQA() {
  const currentCourse = ref<Course>('compiler')
  const question = ref('')
  const answer = ref('')
  const matchedRule = ref<QARule | null>(null)

  // 分词函数
  function tokenize(text: string): string[] {
    return text
      .split(TOKENIZE_PATTERN)
      .filter(token => token.length > 0 && !stopWords.has(token))
  }

  // 计算匹配分数
  function calculateMatchScore(tokens: string[], rule: QARule): number {
    let score = 0
    for (const token of tokens) {
      // 跳过太短的token避免误匹配
      if (token.length < 2) continue
      if (rule.keywords.some(kw => kw.includes(token) || token.includes(kw))) {
        score++
      }
    }
    return score
  }

  // 查找最佳匹配
  function findBestMatch(tokens: string[], course: Course): QARule | null {
    const courseRules = qaRules.filter(r => r.course === course)
    if (courseRules.length === 0) return null

    let bestRule: QARule | null = null
    let bestScore = 0

    for (const rule of courseRules) {
      const score = calculateMatchScore(tokens, rule)
      if (score > bestScore) {
        bestScore = score
        bestRule = rule
      }
    }

    return bestScore > 0 ? bestRule : null
  }

  // 执行问答
  function ask() {
    if (!question.value.trim()) {
      answer.value = '请输入问题'
      matchedRule.value = null
      return
    }

    const tokens = tokenize(question.value)
    if (tokens.length === 0) {
      answer.value = '请输入有效的问题'
      matchedRule.value = null
      return
    }

    const match = findBestMatch(tokens, currentCourse.value)
    if (match) {
      answer.value = match.answer
      matchedRule.value = match
    } else {
      answer.value = '抱歉，暂无相关答案。您可以尝试：1) 选择其他课程；2) 使用更具体的关键词；3) 查阅教材相关内容。'
      matchedRule.value = null
    }
  }

  // 清除对话
  function clear() {
    question.value = ''
    answer.value = ''
    matchedRule.value = null
  }

  return {
    currentCourse,
    question,
    answer,
    matchedRule,
    courses,
    ask,
    clear
  }
}
