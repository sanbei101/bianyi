<script setup lang="ts">
import { h, ref } from "vue";
import { NLayout, NLayoutSider, NMenu, NIcon } from "naive-ui";
import type { MenuOption } from "naive-ui";
import {
  Code as CodeIcon,
  TextGrammar as GrammarIcon,
  TreeView as TreeIcon,
  BrainCircuit as BrainIcon,
  GitCompare as CompareIcon,
  Database as DatabaseIcon,
} from "@vicons/tabler";
import { useRouter } from "vue-router";

const router = useRouter();

const menuOptions: MenuOption[] = [
  {
    label: "词法分析",
    key: "lexer",
    icon: () => h(NIcon, null, { default: () => h(CodeIcon) }),
  },
  {
    label: "文法分析",
    key: "grammar",
    icon: () => h(NIcon, null, { default: () => h(GrammarIcon) }),
  },
  {
    label: "LL(1) 分析",
    key: "ll1",
    icon: () => h(NIcon, null, { default: () => h(TreeIcon) }),
  },
  {
    label: "LLM 约束生成",
    key: "llm",
    icon: () => h(NIcon, null, { default: () => h(BrainIcon) }),
  },
  {
    label: "AST 相似度",
    key: "ast",
    icon: () => h(NIcon, null, { default: () => h(CompareIcon) }),
  },
  {
    label: "语义分析",
    key: "semantic",
    icon: () => h(NIcon, null, { default: () => h(DatabaseIcon) }),
  },
];

const activeKey = ref<string>("lexer");

const handleMenuSelect = (key: string) => {
  activeKey.value = key;
  router.push(`/${key}`);
};
</script>

<template>
  <NLayout has-sider style="height: 100vh">
    <NLayoutSider bordered collapse-mode="width" :collapsed-width="64" :width="200" show-trigger>
      <NMenu
        :options="menuOptions"
        :value="activeKey"
        :collapsed-width="64"
        :collapsed-icon-size="22"
        @update:value="handleMenuSelect"
      />
    </NLayoutSider>
    <NLayout>
      <router-view />
    </NLayout>
  </NLayout>
</template>
