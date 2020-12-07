#!/usr/bin/env node

import yargs from 'yargs';
import fs from 'fs';
import { Parser } from './Parser';
import { RendererConfig } from './renderer/RenderConfig';
import { CustomTypeCollector } from './renderer/CustomTypeCollector';
import { SwiftCodeRenderer } from './renderer/SwiftCodeRenderer';

const program = yargs(process.argv.slice(2));

const args = program
  .options({
    config: {
      alias: 'c',
      type: 'string',
      demandOption: true,
      describe: 'Code-generate config JSON which should implement interface RendererConfig',
    },
    path: {
      alias: 'p',
      type: 'string',
      describe: 'The path of api interface which should extend IExportedApi',
      demandOption: true,
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'The path of output file',
    },
  })
  .help().argv;

function run(): void {
  const configJson = fs.readFileSync(args.config, { encoding: 'utf8' });

  const config = JSON.parse(configJson) as RendererConfig;
  console.log('Native Api will be generated with config: \n', config);

  const parser = new Parser([args.path]);
  const apiModules = parser.parse();
  // console.log(JSON.stringify(result, null, 4))

  const rendererConfig = config;
  const typeTransformer = new CustomTypeCollector(rendererConfig);
  const renderer = new SwiftCodeRenderer(rendererConfig, typeTransformer, apiModules, args.output);

  renderer.print();
  // console.log(typeTransformer.toSourceLike().join('\n'));
}

run();

export interface IExportedApi {}
export type { RendererConfig } from './renderer/RenderConfig';
