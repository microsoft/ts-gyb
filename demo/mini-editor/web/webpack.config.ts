// TypeScript based configuration for webpack. Reference: https://webpack.js.org/configuration/configuration-languages/#typescript

import path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HTMLInlineCSSWebpackPlugin from 'html-inline-css-webpack-plugin';
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const distPath = path.resolve(__dirname, 'dist');
const sourcePath = path.resolve(__dirname, 'src');

const config: webpack.Configuration | webpack.WebpackOptionsNormalized = {
  mode: 'development',
  entry: `${sourcePath}/main.ts`,
  devServer: {
    contentBase: distPath,
    compress: true,
    port: 9000,
  },
  output: {
    path: distPath,
    filename: 'bundle.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: [
          sourcePath,
        ],
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.json',
              // compilerOptions: {
              //   sourceMap: true,
              // },
            },
          },
        ],
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].css',
      chunkFilename: '[id].css',
    }),
    new HtmlWebpackPlugin({
      template: `${sourcePath}/index.html`,
      filename: './bundle.html',
      inlineSource: '.(js|css)$',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
      }
    }),
    new HTMLInlineCSSWebpackPlugin(),
    new HtmlInlineScriptPlugin(),
  ]
};

export default config;
