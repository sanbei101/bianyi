import { createRouter, createWebHistory  } from "vue-router";
import type {RouteRecordRaw} from "vue-router";
import Home from "@/pages/Home.vue";
import LexerPage from "@/pages/LexerPage.vue";
import GrammarPage from "@/pages/GrammarPage.vue";
import LL1Page from "@/pages/LL1Page.vue";
import LLMPage from "@/pages/LLMPage.vue";
import ASTPage from "@/pages/ASTPage.vue";
import SemanticPage from "@/pages/SemanticPage.vue";

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
