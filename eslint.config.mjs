import pluginVue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { configBuilder } from '@chris.araneo/eslint-config';

const UPPER_CASE_OBJECT_KEY = {
  selector: 'objectLiteralProperty',
  filter: { regex: '^[A-Z][A-Z0-9_]*$', match: true },
  format: ['UPPER_CASE'],
};

const allowUpperCaseObjectKeys = (configs) =>
  configs.map((config) => {
    const rule = config.rules?.['@typescript-eslint/naming-convention'];

    if (!Array.isArray(rule)) {
      return config;
    }

    return {
      ...config,
      rules: {
        ...config.rules,
        '@typescript-eslint/naming-convention': [...rule, UPPER_CASE_OBJECT_KEY],
      },
    };
  });

export default [
  ...allowUpperCaseObjectKeys(
    configBuilder()
      .addTypeScriptConfig({
        sources: ['apps/**/*.ts', 'libs/**/*.ts'],
      })
      .addIgnored({
        ignored: ['dist/', 'reports/', 'node_modules/'],
      })
      .build(),
  ),
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['e2e/**/*.ts', 'scripts/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
    },
  },
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
                'The game lib must not depend on ai, effects or the app.',
            },
          ],
        },
      ],
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
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
      '@typescript-eslint/no-magic-numbers': 'off',
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
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, 2],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
          ignoreTypeIndexes: true,
        },
      ],
    },
  },
  {
    files: ['**/__tests__/**/*.{ts,vue}'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.spec.ts', 'e2e/**/*.ts'],
    rules: {
      '@typescript-eslint/no-magic-numbers': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-unsafe-type-assertion': 'off',
      complexity: 'off',
    },
  },
  {
    files: ['scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
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
];
