import antfu from "@antfu/eslint-config";

export default antfu({
  vue: true,
  typescript: true,
  stylistic: false,
  lessOpinionated: true,
  rules: {
    "vue/singleline-html-element-content-newline": "off",
    "perfectionist/sort-named-imports": "off",
    "perfectionist/sort-imports": "off",
    "ts/consistent-type-definitions": ["error", "type"],
    "object-shorthand": "off",
    "vue/html-self-closing": "off",
    "ts/no-unused-vars": [
      "warn",
      {
        vars: "all",
        args: "all",
        ignoreRestSiblings: false,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],
  },
  ignores: ["src/components/ui"],
});
