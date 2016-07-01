var HtmlWebpackPlugin = require('html-webpack-plugin');

var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var path = require('path');

module.exports = {

  target: 'web',

  cache: true,

  node: {
    fs: 'empty'
  },

  entry: {
    app: path.join(__dirname, 'src/index.js')
  },

  resolve : {
    root : path.resolve('./src'),
    modulesDirectories : [
      path.resolve('./node_modules')
    ],
    packageMains: ['jsnext:main', 'browser', 'main']
  },

  output: {
    path: path.join(__dirname, 'tmp'),
    publicPath: '',
    filename: '[name].js'
  },

  module: {
    loaders: [
      {
        test: /\.js?$/,
        include: [
          /src/,
          /redux-loop/
        ],
        loaders: ['babel']
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      templateContent: '<html><body><style>*{box-sizing:border-box;margin:0;padding:0}</style><main></main></body></html>',
      inject: true
    }),
    new webpack.NoErrorsPlugin()
  ],

  debug: true,

  devtool: 'inline-source-map',

  devServer: {
    contentBase: './tmp',
    historyApiFallback: true
  }
};
