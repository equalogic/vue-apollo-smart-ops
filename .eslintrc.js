module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:vue/essential', 'prettier'],
  plugins: ['@typescript-eslint', 'vue'],
  // add your custom rules here
  rules: {
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],
    'arrow-parens': 'off',
    'object-curly-newline': [
      'error',
      {
        ObjectExpression: { consistent: true },
        ObjectPattern: { consistent: true },
        ImportDeclaration: { consistent: true },
        ExportDeclaration: { consistent: true },
      },
    ],
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
        maxEOF: 0,
        maxBOF: 0,
      },
    ],
    indent: 'off',
    '@typescript-eslint/indent': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-useless-constructor': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': ['error'],
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'allow-as-parameter',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
      },
    ],
  },
  overrides: [
    {
      files: ['*.js'],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    {
      files: ['*.ts'],
      rules: {
        // allow TypeScript method signature overloading, see https://github.com/typescript-eslint/typescript-eslint/issues/291
        'no-dupe-class-members': 'off',
        // disable no-undef rule for TypeScript, see https://github.com/typescript-eslint/typescript-eslint/issues/342
        'no-undef': 'off',
      },
    },
    {
      files: ['*.vue'],
      rules: {
        'vue/html-self-closing': [
          'error',
          {
            html: {
              void: 'always',
              normal: 'any',
              component: 'always',
            },
            svg: 'always',
            math: 'always',
          },
        ],
        // allow TypeScript method signature overloading, see https://github.com/typescript-eslint/typescript-eslint/issues/291
        'no-dupe-class-members': 'off',
      },
    },
  ],
};
