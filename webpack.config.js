var webpack = require('webpack');
var path = require("path");
var PROD = JSON.parse(process.env.PROD_ENV || '0');

var config  = {
  entry: {
  	"./dist/jquery.multilingual": "./src/jquery.multilingual.js",
  	"./test/js/test": ["./test/test.js"]
  },
  output: {
  	path: "./",
    filename: PROD ? "[name].min.js" : "[name].js"
  },
  plugins: PROD ? [
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      mangle: false
    })
  ] : []
}

module.exports = config;