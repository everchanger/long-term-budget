module.exports = {
   root: true,
   env: {
      node: true
   },
   'extends': [
      'plugin:vue/essential',
      '@vue/standard'
   ],
   rules: {
      'no-console': 'off',
      'no-debugger': 'off',
      'indent': [
         'error', 
         'tab'
      ],
      'no-tabs': 0,
      'semi': [
         'error', 
         'always'
      ],
      'comma-dangle': [
         'error', 
         'always-multiline'
      ],
      'object-curly-spacing': [
         'error', 
         'always',
      ],
      'quotes': [
         'error', 
         'single'
      ],
      'no-trailing-spaces': 'error',
   },
   parserOptions: {
      parser: 'babel-eslint'
   }
}
