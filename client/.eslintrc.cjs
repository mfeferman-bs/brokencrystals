module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    createDefaultProgram: true
  },
  ignorePatterns: ['cypress', 'node_modules', 'build', 'public', 'assets'],
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
  env: {
    browser: true
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  overrides: [
    {
      files: ['cypress/**/*.ts', 'cypress.config.ts'],
      parserOptions: {
        project: ['./cypress/tsconfig.json'],
        tsconfigRootDir: __dirname
      }
    }
  ]
};
