import yargs from 'yargs';
import { Parser } from './parser/Parser';
import { dropIPrefixInCustomTypes, fetchNamedTypes } from './parser/named-types';
import { SwiftModuleView } from './renderer/ModuleView';
import { CodeTemplateRenderer } from './renderer/CodeTemplateRenderer';

const program = yargs(process.argv.slice(2));

const args = program
  .options({
    path: {
      alias: 'p',
      type: 'string',
      demandOption: true,
      describe: 'The path of api interface which should extend IExportedApi',
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
  const parser = new Parser([args.path]);
  const apiModules = parser.parse();
  dropIPrefixInCustomTypes(apiModules);
  console.log(JSON.stringify(apiModules, null, 4));

  const namedTypes = fetchNamedTypes(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  const renderer = new CodeTemplateRenderer('templates/swift-bridge.mustache', args.output);
  const swiftModuleViews = apiModules.map(module => new SwiftModuleView(module));
  renderer.renderModules(swiftModuleViews);
}

run();

export interface IExportedApi {}
export type { RendererConfig } from './renderer/RenderConfig';
