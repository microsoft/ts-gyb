// TypeScript based configuration for webpack.
// Reference: https://webpack.js.org/configuration/configuration-languages/#typescript

import path from 'path';
import * as webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HTMLInlineCSSWebpackPlugin from 'html-inline-css-webpack-plugin';
import HtmlInlineScriptPlugin from 'html-inline-script-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const webDistPath = path.resolve(__dirname, 'dist');
const sourcePath = path.resolve(__dirname, 'src');

const appleDistPath = path.resolve(__dirname, '..', 'apple/MiniEditor/Resources');
const androidDistPath = path.resolve(__dirname, '..', 'android/app/src/main/assets');

enum SupportedTarget {
  web = 'web',
  apple = 'apple',
  android = 'android',
}

interface WebpackEnvironment {
  target: SupportedTarget;
  port?: number;
}

function buildConfig(env: WebpackEnvironment): webpack.Configuration | webpack.WebpackOptionsNormalized {
  const isProductionBuild = process.env.NODE_ENV === 'production';

  const distPath = function (): string {
    switch (env.target) {
      case SupportedTarget.web:
        return webDistPath;
      case SupportedTarget.apple:
        return appleDistPath;
      case SupportedTarget.android:
        return androidDistPath;
      default:
        throw new Error(`Unsupported target: ${env.target}`);
    }
  }();

  return {
    mode: isProductionBuild ? 'production' : 'development',
    entry: `${sourcePath}/main.ts`,
    devServer: {
      contentBase: distPath,
      compress: true,
      port: env.port ?? 9000,
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
                compilerOptions: {
                  sourceMap: !isProductionBuild,
                },
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
      // Note: For mobile platforms, we need to inline all JavaScript 
      // and CSS resources into a single file for simplicity.
      new HtmlWebpackPlugin({
        template: `${sourcePath}/index.html`,
        filename: './bundle.html',
        inlineSource: '.(js|css)$',
      }),
      new HTMLInlineCSSWebpackPlugin(),
      new HtmlInlineScriptPlugin(),
    ]
  };
}

export default (env) => buildConfig(env);;
