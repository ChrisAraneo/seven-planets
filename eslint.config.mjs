import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'
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

  // vue-eslint-parser needs a TS parser for `<script lang="ts">` blocks.
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },

  // TS sources outside the configBuilder globs still need a TS parser.
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },

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
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    rules: {
      // Small integers (loop math, defaults, halving) and named object fields
      // are self-explanatory; the rule stays on for genuinely magic values.
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [-1, 0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreDefaultValues: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },

  // Tests assert on concrete values and set up long scenarios — literal
  // numbers and big functions are the point, not a smell.
  {
    files: ['**/__tests__/**/*.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      complexity: 'off',
    },
  },

  // Data tables: every number is already named by the field or constant it
  // is assigned to (card weights, building costs, tuned AI weights), and a
  // deck definition or name list is naturally long.
  {
    files: [
      'libs/game/src/config/**/*.ts',
      'libs/ai/src/weights.ts',
      'libs/ai/src/functions/ai-constants.ts',
    ],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines': 'off',
    },
  },

  // AI heuristics are scoring formulas whose coefficients are tuning data
  // (see scripts/tune.ts); naming each literal would only obscure them.
  {
    files: ['libs/ai/src/functions/**/*.ts', 'libs/ai/src/install-ai.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
    },
  },

  /* The shared config's naming-convention options are re-declared verbatim
     here (rule options replace, they don't merge) with two project-specific
     relaxations:
     1. UPPER_CASE object-literal / type property keys — record keys here ARE
        the uppercase union values (ResourceType, BuildingType, ActionType,
        InfluenceType, StrategyKind), e.g. `{ CRYSTAL: 1, ENERGY: 1 }`.
     2. Module-level const singletons (Pinia stores, RxJS subjects, the Vue
        app, directives, destructured ts-pattern helpers) may stay
        strictCamelCase; UPPER_CASE remains required for primitive and array
        constants. */
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        { format: ['strictCamelCase'], selector: 'default' },
        {
          filter: { match: false, regex: '^_+$' },
          format: ['strictCamelCase'],
          leadingUnderscore: 'allow',
          selector: 'parameter',
        },
        {
          custom: { match: true, regex: '^_+$' },
          format: null,
          selector: 'parameter',
        },
        {
          format: ['strictCamelCase', 'StrictPascalCase'],
          selector: ['function', 'import'],
        },
        { format: ['StrictPascalCase'], selector: ['typeLike'] },
        { format: ['PascalCase'], selector: 'enumMember' },
        {
          format: ['PascalCase'],
          modifiers: ['static'],
          selector: 'classProperty',
        },
        {
          format: ['PascalCase'],
          prefix: ['is', 'has', 'are', 'can', 'should', 'did', 'will', 'with'],
          selector: ['variable', 'parameter', 'accessor'],
          types: ['boolean'],
        },
        {
          format: null,
          modifiers: ['requiresQuotes'],
          selector: ['objectLiteralProperty'],
        },
        // (1) enum-like record keys keyed by an uppercase union value
        {
          filter: { match: true, regex: '^[A-Z][A-Z0-9_]*$' },
          format: ['UPPER_CASE'],
          selector: ['objectLiteralProperty', 'typeProperty'],
        },
        {
          filter: {
            match: false,
            regex: `^(${[
              'allowfullscreen',
              'allowFullScreen',
              'async',
              'autofocus',
              'autoFocus',
              'autoplay',
              'autoPlay',
              'checked',
              'defaultChecked',
              'contenteditable',
              'contentEditable',
              'controls',
              'default',
              'defer',
              'disabled',
              'draggable',
              'formnovalidate',
              'formNoValidate',
              'hidden',
              'inert',
              'ismap',
              'itemscope',
              'itemScope',
              'loop',
              'multiple',
              'muted',
              'nomodule',
              'noModule',
              'novalidate',
              'noValidate',
              'open',
              'playsinline',
              'playsInline',
              'readonly',
              'readOnly',
              'required',
              'reversed',
              'selected',
              'spellcheck',
              'spellCheck',
            ].join('|')})$`,
          },
          format: ['PascalCase'],
          prefix: ['is', 'has', 'are', 'can', 'should', 'did', 'will', 'with'],
          selector: ['property'],
          types: ['boolean'],
        },
        {
          format: ['UPPER_CASE'],
          leadingUnderscore: 'allow',
          modifiers: ['const', 'global'],
          prefix: [
            'IS_',
            'HAS_',
            'ARE_',
            'CAN_',
            'SHOULD_',
            'DID_',
            'WILL_',
            'WITH_',
          ],
          selector: 'variable',
          types: ['boolean'],
        },
        {
          format: ['UPPER_CASE'],
          leadingUnderscore: 'allow',
          modifiers: ['const', 'global'],
          selector: 'variable',
          types: ['string', 'number', 'array'],
        },
        // (2) module-level const singletons may stay camelCase
        {
          format: ['strictCamelCase', 'UPPER_CASE'],
          modifiers: ['const', 'global'],
          selector: 'default',
        },
        {
          format: ['strictCamelCase'],
          modifiers: ['const', 'global'],
          selector: 'variable',
          types: ['function'],
        },
      ],
    },
  },

  // Ad-hoc fixture shapes and narrowing casts are the point in test code
  // (the shared config's own `isTests` mode turns the same rules off).
  // Declared after the naming-convention re-declaration above so it wins
  // for test files.
  {
    files: ['**/__tests__/**/*.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
    },
  },

  // This codebase's convention is named function declarations (one per
  // kebab-case file), with the main export first and hoisted helpers below.
  {
    rules: {
      'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
      'no-use-before-define': ['error', { functions: false }],
      // Diagnostics on error paths stay; plain console.log is still flagged.
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },

  // CLI scripts report through the console by design.
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['apps/**/*.ts', 'libs/**/*.ts'],
    rules: {
      // Keep object destructuring, but let array-index reads stay as reads:
      // forcing `players[2]` into `[, , x]` collides with
      // unicorn/no-unreadable-array-destructuring.
      'prefer-destructuring': 'off',
      '@typescript-eslint/prefer-destructuring': [
        'error',
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: true },
        },
      ],
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
