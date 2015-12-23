"use strict";
module.exports = {
  entry: './src/index.jsx',
  output: {
    path: './dist',
    filename: 'react-touchable-tabular.js'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['react', 'es2015', 'stage-0']
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      }
    ]
  },
  externals: {
    'react': 'react',
    'react-dom': 'react-dom',
    'moment': 'moment'
  }
};