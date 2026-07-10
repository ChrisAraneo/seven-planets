import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import { configBuilder } from '@chris.araneo/eslint-config'

export default [
  ...configBuilder()
    .addTypeScriptConfig({
      sources: ['apps/**/*.ts', 'libs/**/*.ts'],
    })
    .addIgnored({
      ignored: ['dist/', 'reports/', 'node_modules/'],
    })
    .build(),
  ...pluginVue.configs['flat/recommended'],

  /* =====================================================================
     Nx module boundaries — enforced with the built-in no-restricted-imports
     rule (mirrors the `scope:*` tags in each project.json). Direction:

       game    → (leaf) must not know ai, effects or the app exist
       ai      → may depend on game only
       effects → may depend on game only
       browser → (app) may depend on any lib

     Swap these for @nx/eslint-plugin's `@nx/enforce-module-boundaries`
     once that plugin supports ESLint 10.
     ===================================================================== */
  {
    files: ['libs/game/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@seven-planets/ai', '@seven-planets/effects', '@/*'],
              message:
                'The game lib is a leaf — it must not depend on ai, effects or the app.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/ai/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@seven-planets/effects', '@/*'],
              message: 'The ai lib may depend on the game lib only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/effects/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@seven-planets/ai', '@/*'],
              message: 'The effects lib may depend on the game lib only.',
            },
          ],
        },
      ],
    },
  },

  // Integration tests bootstrap the assembled app store, so they may cross
  // the lib boundaries the source code may not.
  {
    files: ['**/__tests__/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },

  {
    rules: {},
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
]
