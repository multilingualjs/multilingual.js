var path = require('path');
var webpack = require('webpack');

module.exports = {
  context: __dirname,
  node: {
    fs: "empty"
  },
  entry: {
    // Sources are expected to live in $app_root/webpack
    'test': './src/test/test.js',
    'multilingual': ['./src/multilingual.js']
  },
  output: {
    path: __dirname + "/dist",
    publicPath: '/',
    filename: '[name].js'
  },

  resolve: {
    extensions: ['', '.js'],
    modulesDirectories: [ 'node_modules' ]
  },
  module: {

    loaders: [
    ] 
  },

  devtool: 'source-map'
}