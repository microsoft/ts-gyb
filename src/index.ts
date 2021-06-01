import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from './CodeGenerator';

const program = yargs(process.argv.slice(2));

const args = program
  .options({
    interfacePaths: {
      alias: 'i',
      type: 'array',
      demandOption: true,
      describe: 'The path of api interface which should extend IExportedApi',
    },
    outputDirectory: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'The path of output directory',
    },
    moduleTemplatePath: {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'The path of module template',
    },
    namedTypesTemplatePath: {
      alias: 't',
      type: 'string',
      demandOption: true,
      describe: 'The path of named types template',
    },
    dropInterfaceIPrefix: {
      type: 'boolean',
      default: false,
      describe: 'Drop "I" prefix for all interfaces',
    },
  })
  .help().argv;

function run(): void {
  const generator = new CodeGenerator();
  generator.parse({
    tag: 'APIs',
    interfacePaths: args.interfacePaths as string[],
    dropInterfaceIPrefix: args.dropInterfaceIPrefix,
  });
  generator.printModules({ tag: 'APIs' });
  generator.render({
    tag: 'APIs',
    language: RenderingLanguage.Swift,
    outputDirectory: args.outputDirectory,
    moduleTemplatePath: args.moduleTemplatePath,
    namedTypesTemplatePath: args.namedTypesTemplatePath,
  });
}

run();
