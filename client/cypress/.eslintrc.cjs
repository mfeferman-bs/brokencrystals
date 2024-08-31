module.exports = {
  ignorePatterns: ['!**/*'],
  extends: ['../.eslintrc.cjs'],
  overrides: [
    {
      files: ['*.ts'],
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
      }
    }
  ]
};
