const webpack = require('webpack');
const path = require('path');

module.exports = [{
  entry: './src/app.scss',
  output: {
    // この部分は webpack がコンパイルするために必要です
    // しかし、style-bundle.js は使いません
    filename: 'style-bundle.js',
  },
  devServer: {
    port: 8080
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [
        {
          loader: 'file-loader',
          options: {
            name: './public/bundle.css',
          },
        },
        { loader: 'extract-loader' },
        { loader: 'css-loader' },
        {
          loader: 'sass-loader',
          options: {
            includePaths: ['./node_modules']
          }
        },
      ]
    }
    ]
  },
  optimization: {
    minimize: true,
  },
}];
module.exports.push({
  entry: {
    index: './src/index.js',
    recept: './src/recept.js',
    orderlist: './src/orderlist.js',
    article: './src/article.js',
    bundle: './src/app.js',
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'public/js')
  },
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: ['es2015']
      }
    }]
  },
});