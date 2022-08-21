module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
    'plugin:jsx-a11y/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/no-use-before-define': 0,
    'jsx-a11y/no-noninteractive-tabindex': 0,
    'arrow-parens': 'off',
    'jsx-a11y/anchor-is-valid': 'off',
    'no-console': 1,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    'formatjs/no-offset': 'error',
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/array-type': ['error', { default: 'array' }],
    'jsx-a11y/no-onchange': 'off',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
      },
    ],
    'no-relative-import-paths/no-relative-import-paths': [
      'error',
      { allowSameFolder: true },
    ],
  },
  overrides: [
    {
      files: ['**/*.tsx'],
      rules: {
        'react/prop-types': 'off',
      },
    },
  ],
  plugins: ['jsx-a11y', 'react-hooks', 'formatjs', 'no-relative-import-paths'],
  settings: {
    react: {
      pragma: 'React',
      version: '16.8',
    },
  },
  env: {
    browser: true,
    node: true,
    jest: true,
    es6: true,
  },
  reportUnusedDisableDirectives: true,
};
