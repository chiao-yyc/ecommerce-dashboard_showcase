import eslint from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import eslintConfigPrettier from 'eslint-config-prettier'
import globals from 'globals'
import tsEslint from 'typescript-eslint'
import tsParser from '@typescript-eslint/parser'
import vueParser from 'vue-eslint-parser'

// 共用的 TypeScript 規則
const commonTsRules = {
  ...tsEslint.configs.recommended.rules,
  // 使用 TypeScript 版本的 no-unused-vars 規則
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
  // 關閉基本的 no-unused-vars，因為 TypeScript 版本已經處理了
  'no-unused-vars': 'off',
}

// 共用的 parser 選項
const commonParserOptions = {
  project: './tsconfig.eslint.json',
  ecmaFeatures: {
    jsx: true,
  },
}

// 共用的 globals
const commonGlobals = {
  ...globals['shared-node-browser'],
  ...globals.browser,
  document: 'readonly',
  window: 'readonly',
  console: 'readonly',
  process: 'readonly',
}

// 測試檔案的 globals
const testGlobals = {
  ...commonGlobals,
  describe: 'readonly',
  test: 'readonly',
  it: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly',
  vi: 'readonly',
  vitest: 'readonly',
}

export default [
  // 基礎配置
  eslint.configs.recommended,

  // 1. 忽略檔案
  {
    ignores: [
      'dist',
      'node_modules',
      '.vite',
      'src/components/ui/**/*',
      'html',
      'coverage',
      '.vitest',
      '*.config.js',
      '*.config.ts',
      '**/*.test.ts',
      '**/*.test.js',
      '**/*.spec.ts',
      '**/*.spec.js',
      'tests/**/*',
      'src/**/__tests__/**/*',
      'e2e/**/*',
    ],
  },

  // 2. Vue 檔案設定
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ...commonParserOptions,
        extraFileExtensions: ['.vue'],
      },
      globals: commonGlobals,
    },
    plugins: {
      vue: pluginVue,
      '@typescript-eslint': tsEslint.plugin,
    },
    rules: {
      ...pluginVue.configs['flat/recommended'].rules,
      ...commonTsRules,
      // 強制使用 logger 而非 console (warn 不阻擋開發)
      'no-console': 'warn',
    },
  },

  // 3. TypeScript 檔案設定
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: commonParserOptions,
      sourceType: 'module',
      globals: commonGlobals,
    },
    plugins: {
      '@typescript-eslint': tsEslint.plugin,
    },
    rules: {
      ...commonTsRules,
      // 強制使用 logger 而非 console (warn 不阻擋開發)
      'no-console': 'warn',
    },
  },

  // 4. vite.config.ts 特殊設定
  {
    files: ['vite.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: 'readonly',
      },
    },
  },

  // 5. Node.js 腳本檔案設定
  {
    files: ['scripts/**/*.{js,cjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: 'readonly',
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        console: 'readonly',
        Generator: 'readonly',
      },
      sourceType: 'script',
    },
    rules: {
      // 允許在腳本中使用 console
      'no-console': 'off',
      // 允許在腳本中使用 require
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // 6. logger.ts 特殊設定（必須使用原生 console）
  {
    files: ['src/utils/logger.ts'],
    rules: {
      // logger.ts 是 console wrapper，必須使用原生 console
      'no-console': 'off',
    },
  },

  // Prettier 配置（放在最後以覆蓋衝突的規則）
  eslintConfigPrettier,
]
