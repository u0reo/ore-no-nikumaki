const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const mode = 'development'; //process.env.WEBPACK_SERVE ? 'development' : 'production';

module.exports = [{
  // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
  mode: mode,
  // エントリーポイントの設定
  entry: {
    'index': './src/js/index.js',
    'article': './src/js/article.js',
    'recept': './src/js/recept.js',
    'orderlist': './src/js/orderlist.js',
  },
  // 出力の設定
  output: {
    // 出力するファイル名
    filename: '[name].bundle.js',
    // 出力先のパス（v2系以降は絶対パスを指定する必要がある）
    path: path.join(__dirname, 'public/js')
  },
  module: {
    rules: [{
      // ローダーの処理対象ファイル
      test: /\.js$/,
      // ローダーの処理対象から外すディレクトリ
      exclude: /node_modules/,
      use: [{
        // 利用するローダー
        loader: 'babel-loader',
        // ローダーのオプション
        // 今回はbabel-loaderを利用しているため
        // babelのオプションを指定しているという認識で問題ない
        options: {
          /*presets: [
            ['env', {
              modules: false
            }]
          ]*/
        }
      }]
    },
    /*{
      // enforce: 'pre'を指定することによって
      // enforce: 'pre'がついていないローダーより早く処理が実行される
      // 今回はbabel-loaderで変換する前にコードを検証したいため、指定が必要
      enforce: 'pre',
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'eslint-loader'
    }*/
    ]},
  },
  {
    // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
    mode: mode,
    // エントリーポイントの設定
    entry: './src/app.scss',
    // 出力の設定
    output: {
      // 出力するファイル名
      filename: 'style-bundle.css',
    },
    module: {
      rules: [
        /*{
        test: /\.scss/, // 対象となるファイルの拡張子
        use: ExtractTextPlugin.extract({
          use: [
            // CSSをバンドルするための機能
            {
              loader: 'css-loader',
              options: {
                // オプションでCSS内のurl()メソッドの取り込みを禁止する
                url: false,
                // ソースマップの利用有無
                sourceMap: process.env.WEBPACK_SERVE,

                // 0 => no loaders (default);
                // 1 => postcss-loader;
                // 2 => postcss-loader, sass-loader
                importLoaders: 2
              },
            },
            {
              loader: 'sass-loader',
              options: {
                // ソースマップの利用有無
                sourceMap: process.env.WEBPACK_SERVE,
              }
            }
          ]
        }),*/
        {
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
                // ソースマップの利用有無
                sourceMap: process.env.WEBPACK_SERVE,
              }
            },
            {
              loader: 'sass-loader',
              options: {
                // ソースマップの利用有無
                sourceMap: process.env.WEBPACK_SERVE,
                includePaths: ['./node_modules']
              }
            }
          ]
        }
      ]
    },
    /*plugins: [
      new ExtractTextPlugin(path.join(__dirname, 'public/bundle.css')),
    ],*/
  }
];