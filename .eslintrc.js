// eslint-disable-next-line no-undef
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
      "project": "tsconfig.json",
      "sourceType": "module"
  },
  env: {
      "browser": true,
  },
  plugins: [
    "@typescript-eslint",
  ],
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "eslint-config-airbnb-base",
    "eslint-config-prettier"
  ],
  settings: {
      "import/resolver": {
        "node": {
          "extensions": [".ts"]
        }
      }
  },
  rules: {
    "import/no-unresolved": [2],
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/explicit-module-boundary-types": "error",
    "@typescript-eslint/prefer-regexp-exec": "warn",
    "@typescript-eslint/restrict-template-expressions": "warn",
    "@typescript-eslint/no-unsafe-member-access": "warn",
    "@typescript-eslint/no-unnecessary-type-assertion": "warn",
    "@typescript-eslint/no-unsafe-return": "warn",
    "@typescript-eslint/no-unsafe-call": "warn",
    "@typescript-eslint/no-unsafe-assignment": "warn",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/semi": [
        "error",
        "always"
    ],
    "@typescript-eslint/no-unused-vars": "error",
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    "no-use-before-define": "off",
    "@typescript-eslint/no-use-before-define": [
      "error", 
      { "functions": false }
    ],
    "no-unused-vars": "off",
    "no-useless-escape": "warn",
    "no-prototype-builtins": "warn",
    "no-console": "off",
    "arrow-parens": [
        "off",
        "always"
    ],
    "sort-keys": "off",
    "max-len": "off",
    "no-bitwise": "off",
    "no-duplicate-case": "error",
    "quotes": ["off", "single"],
    "curly": "error", 
    "import/extensions": "off",
    "class-methods-use-this": "off",
    "no-plusplus": ["error", { "allowForLoopAfterthoughts": true }],
    "camelcase": ["error", {"allow": ["UNSAFE_componentWillReceiveProps"]}],
    "import/prefer-default-export": "off",
    "import/no-default-export": "error",
    "no-param-reassign": ["error", { "props": false }],
    "no-underscore-dangle": ["error", { "enforceInMethodNames": true, "allowAfterThis": true }],
    "no-useless-constructor": "off",
    "no-empty-function": ["error", {"allow": ["constructors"]}],
  }
};
