<script setup lang="ts">
import { ref } from "vue";
import { NCard, NSpace, NInput, NButton, NAlert, NTable } from "naive-ui";

const inputProductions = ref(`S -> aSBE
S -> aBE
EB -> BE
aB -> ab
bB -> bb
bE -> bc
cE -> cc`);

const result = ref<{
  type: number | null;
  reason: string;
  isValid: boolean;
}>({ type: null, reason: "", isValid: false });

const UPPERCASE_REGEX = /[A-Z]/;
const EPSILON_REGEX = /ε/g;

function analyze() {
  const lines = inputProductions.value
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);
  let isType0 = true;
  let isType1 = true;
  let isType2 = true;
  let isType3 = true;
  let isRightLinear = true;
  let isLeftLinear = true;

  if (!lines.length) {
    result.value = { type: null, reason: "请输入产生式", isValid: false };
    return;
  }

  for (const line of lines) {
    const parts = line.split("->").map((s) => s.trim());
    if (parts.length !== 2) {
      result.value = { type: null, reason: `产生式格式错误: ${line}`, isValid: false };
      return;
    }
    const [left, right] = parts;

    // 0型文法:左边至少包含一个非终结符(假设大写字母为非终结符)
    if (!UPPERCASE_REGEX.test(left)) {
      isType0 = false;
    }

    // 1型文法:|left| <= |right| (排除 S -> ε)
    if (left !== "S" || right !== "ε") {
      if (left.length > right.replace(EPSILON_REGEX, "").length && right !== "ε") {
        isType1 = false;
      }
    }

    // 2型文法:左边是一个非终结符
    if (left.length !== 1 || !UPPERCASE_REGEX.test(left)) {
      isType2 = false;
    }

    // 3型文法:在2型的基础上,右边必须满足 A->aB 或 A->a (右线性) 或者 A->Ba 或 A->a (左线性)
    // 简单判定:
    // 右线性:右侧长度<=2,如果是2,第一个是小写(终结符),第二个是大写(非终结符)
    // 左线性:右侧长度<=2,如果是2,第一个是大写,第二个是小写
    if (right.length > 2) {
      isRightLinear = false;
      isLeftLinear = false;
    } else if (right.length === 2) {
      if (UPPERCASE_REGEX.test(right[0])) isRightLinear = false;
      if (UPPERCASE_REGEX.test(right[1])) isLeftLinear = false;
    }
  }

  isType3 = isType2 && (isRightLinear || isLeftLinear);
  isType1 = isType0 && isType1;

  if (!isType0) {
    result.value = {
      type: null,
      reason: "不符合0型文法:产生式左部必须至少包含一个非终结符",
      isValid: false,
    };
  } else if (isType3) {
    result.value = {
      type: 3,
      reason: "符合3型文法(正则文法):左部全为单个非终结符,且右部满足统一的单侧线性特点",
      isValid: true,
    };
  } else if (isType2) {
    result.value = {
      type: 2,
      reason: "符合2型文法(上下文无关文法):左部全为单个非终结符,但不全是右/左线性",
      isValid: true,
    };
  } else if (isType1) {
    result.value = {
      type: 1,
      reason: "符合1型文法(上下文有关文法):所有产生式左部长度 <= 右部长度",
      isValid: true,
    };
  } else {
    result.value = {
      type: 0,
      reason: "符合0型文法(短语结构文法):左侧长度大于右侧等",
      isValid: true,
    };
  }
}
</script>

<template>
  <NCard title="乔姆斯基文法判定模块" embedded>
    <NSpace vertical>
      <div>
        支持手动输入文法产生式,自动判定属于0/1/2/3型文法。(注:约定大写字母为非终结符,其他为终结符;用
        '->' 分隔左右部,'ε' 表示空串)
      </div>

      <NTable striped bordered>
        <thead>
          <tr>
            <th>文法类型</th>
            <th>规则限制</th>
            <th>对应语言</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>0型 (短语结构)</td>
            <td>α → β,α至少包含一个非终结符</td>
            <td>图灵机识别的语言</td>
          </tr>
          <tr>
            <td>1型 (上下文有关)</td>
            <td>|α| ≤ |β|</td>
            <td>线性有界自动机</td>
          </tr>
          <tr>
            <td>2型 (上下文无关)</td>
            <td>A → β,左部必为单非终结符</td>
            <td>下推自动机 (编程语言语法)</td>
          </tr>
          <tr>
            <td>3型 (正则)</td>
            <td>A → aB 或 A → a (只含统一一种线性)</td>
            <td>有限自动机 (词法分析)</td>
          </tr>
        </tbody>
      </NTable>

      <NInput v-model:value="inputProductions" type="textarea" rows="6" placeholder="S -> aSBE" />
      <NButton type="primary" @click="analyze">文法类型判定</NButton>

      <NAlert v-if="result.reason" :type="result.isValid ? 'success' : 'error'" show-icon>
        <template #header>
          判定结果:{{ result.type !== null ? `第 ${result.type} 型文法` : "格式错误" }}
        </template>
        {{ result.reason }}
      </NAlert>
    </NSpace>
  </NCard>
</template>
