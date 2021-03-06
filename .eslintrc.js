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
         4
      ],
      'no-tabs': 1,
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
      "space-unary-ops": [
        2, {
          "words": true,
          "nonwords": true,
          "overrides": {
            "new": false,
            "++": true
          }
    }]
   },
   parserOptions: {
      parser: 'babel-eslint'
   }
}
