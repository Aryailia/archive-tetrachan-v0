var path = require('path');
var webpack = require('webpack');

//var DEVELOPMENT = process.env.NODE_ENV.trim() === 'development';
//var PRODUCTION  = process.env.NODE_ENV.trim() === 'production';

var uglify = new webpack.optimize.UglifyJsPlugin({
  comments: false,
  mangle: true,
  compress: {
    warnings: true
  }
});
var config = [];

// Compose fp library
config.push({
  entry: [
    './src/compose/compose.js'
  ],
  plugins: [
    uglify
  ],
  output: {
    path: path.resolve('./dist'),
    publicPath: '/dist/',
    filename: 'compose.min.js'
  }
});

module.exports = config;