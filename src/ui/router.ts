import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

import ASTPage from "@/ui/pages/ASTPage.vue";
import GrammarPage from "@/ui/pages/GrammarPage.vue";
import Home from "@/ui/pages/Home.vue";
import LexerPage from "@/ui/pages/LexerPage.vue";
import LL1Page from "@/ui/pages/LL1Page.vue";
import LLMPage from "@/ui/pages/LLMPage.vue";
import SemanticPage from "@/ui/pages/SemanticPage.vue";

const routes: RouteRecordRaw[] = [
  {
    name: "home",
    path: "/",
    component: Home,
  },
  {
    name: "lexer",
    path: "/lexer",
    component: LexerPage,
  },
  {
    name: "grammar",
    path: "/grammar",
    component: GrammarPage,
  },
  {
    name: "ll1",
    path: "/ll1",
    component: LL1Page,
  },
  {
    name: "llm",
    path: "/llm",
    component: LLMPage,
  },
  {
    name: "ast",
    path: "/ast",
    component: ASTPage,
  },
  {
    name: "semantic",
    path: "/semantic",
    component: SemanticPage,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
