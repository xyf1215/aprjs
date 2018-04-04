module.exports = {
  parser: 'babel-eslint',
  rules: {
    'eqeqeq': 'error', // 必须使用全等
    'no-var': 'error', // 不能使用var，建议const/let
    'arrow-parens': ['error', 'as-needed'], // 箭头函数必须有括号， 当只有一个参数时允许省略圆括号
    'indent': ['error', 2], // 2个空格缩进
    'quotes': ['error', 'single'], // 单引号
    'camelcase': 'error', // 必须驼峰
    'semi': ['error', 'never'] // 结尾不能使用分号
  }
}