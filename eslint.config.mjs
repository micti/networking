import { neostandard } from 'neostandard'
import importX from 'eslint-plugin-import-x'

export default [
  ...neostandard(),
  {
    plugins: {
      'import-x': importX
    },
    rules: {
      // Import checks are no longer bundled with neostandard (v0.13+),
      // so they are restored here to match `standard` behaviour.
      'import-x/export': 'error',
      'import-x/first': 'error',
      'import-x/no-absolute-path': ['error', { esmodule: true, commonjs: true, amd: false }],
      'import-x/no-duplicates': 'error',
      'import-x/no-named-default': 'error',
      'import-x/no-webpack-loader-syntax': 'error',

      // Restore the stricter variants of the rules that neostandard relaxes,
      // to match `standard` behaviour.
      '@stylistic/comma-dangle': ['error', {
        arrays: 'never',
        objects: 'never',
        imports: 'never',
        exports: 'never',
        functions: 'never'
      }],
      '@stylistic/no-multi-spaces': 'error',
      'dot-notation': ['error', { allowKeywords: true }],
      'n/no-deprecated-api': 'error'
    }
  }
]
