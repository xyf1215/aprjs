const path = require('path')

module.exports = {
  mode: 'production',
  // mode: 'development',
  entry: path.resolve(__dirname, '../src/index'),
  output: {
    path: path.resolve(__dirname, '../dist'),
    filename: 'apr.js',
    libraryTarget: 'umd',
    library: 'Apr'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  }
}