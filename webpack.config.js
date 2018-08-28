const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const mode = process.env.WEBPACK_SERVE ? 'development' : 'production';

module.exports = [
  {
    mode: mode,
    entry: {
      'index': './src/js/index.js',
      'article': './src/js/article.js',
      'recept': './src/js/recept.js',
      'orderlist': './src/js/orderlist.js',
    },
    output: {
      filename: '[name].bundle.js',
      path: path.join(__dirname, 'public/js')
    },
    module: {
      rules: [{
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
        }]
      }]
    },
    performance: {
      maxEntrypointSize: 500000,
      maxAssetSize: 500000,
    },
  },
  {
    mode: mode,
    entry: './src/app.scss',
    output: {
      filename: 'style-bundle.css',
      path: __dirname
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
        {
          loader: 'extract-loader'
        },
        {
          loader: 'css-loader',
          options: {
            sourceMap: process.env.WEBPACK_SERVE,
          }
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: process.env.WEBPACK_SERVE,
            includePaths: ['./node_modules']
          }
        }]
      }]
    }
  }
];