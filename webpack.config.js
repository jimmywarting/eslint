const path = require('path');

module.exports = {
  entry: './lib/api.mjs',
  // mode: 'production',
  mode: 'development',
  output: {
    library: {
      type: 'commonjs'
    },
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
};