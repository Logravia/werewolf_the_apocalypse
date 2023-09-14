const path = require('path');
const PugPlugin = require('pug-plugin');

module.exports = {
  mode: 'development',
  output: {
    path: path.join(__dirname, 'dist/'),
    publicPath: '/',
  },

  entry: {
    script: './src/index.js', // => dist/script.js
    index: './src/sheet.pug', // => dist/index.html
    style: './src/style.css'
  },

  plugins: [
    new PugPlugin({
      pretty: true, // formatting HTML, useful for development mode
      js: {
        // output filename of extracted JS file from source script
        filename: 'script.js',
      },
      css: {
        // output filename of extracted CSS file from source style
        filename: 'style.css',
      },
    }),
  ],

  module: {
    rules: [
      {
        test: /\.pug$/,
        loader: PugPlugin.loader, // Pug loader
      },
      {
        test: /\.(css|sass|scss)$/,
        use: ['css-loader', 'sass-loader'],
      },
    ],
  },
};
