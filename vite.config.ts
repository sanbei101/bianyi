import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vue',
              test: /node_modules[\\/](vue|vue-router|@vue)/,
              priority: 30,
              minSize: 0,
            },
            {
              name: 'naive-ui',
              test: /node_modules[\\/]naive-ui/,
              priority: 25,
              minSize: 0,
            },
            {
              name: 'vicons',
              test: /node_modules[\\/]@vicons/,
              priority: 20,
              minSize: 0,
            },
            {
              name: 'tailwind',
              test: /node_modules[\\/](tailwindcss|@tailwindcss)/,
              priority: 15,
              minSize: 0,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
              minSize: 30000,
            },
          ]
        }
      }
    }
  }
});
