import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from './generator/CodeGenerator';
import { parseKeyValueText } from './utils';

const program = yargs(process.argv.slice(2));

const args = program
  .options({
    interfacePaths: {
      type: 'string',
      array: true,
      demandOption: true,
      describe: 'The path of api interface which should extend IExportedApi',
    },
    outputDirectory: {
      type: 'string',
      demandOption: true,
      describe: 'The path of output directory',
    },
    moduleTemplatePath: {
      type: 'string',
      demandOption: true,
      describe: 'The path of module template',
    },
    namedTypesTemplate: {
      type: 'string',
      demandOption: true,
      describe: 'The path of named types template',
    },
    defaultCustomTag: {
      type: 'string',
      array: true,
      coerce: (values: string[]) => values.map((tagString) => parseKeyValueText(tagString)),
      default: [],
      describe: 'Default values for custom tags',
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
    interfacePaths: args.interfacePaths,
    defaultCustomTags: Object.fromEntries(args.defaultCustomTag.map((tag) => [tag.key, tag.value])),
    dropInterfaceIPrefix: args.dropInterfaceIPrefix,
  });
  generator.parseNamedTypes();
  generator.printModules({ tag: 'APIs' });
  generator.printSharedNamedTypes();
  generator.render({
    tag: 'APIs',
    language: RenderingLanguage.Swift,
    outputDirectory: args.outputDirectory,
    moduleTemplatePath: args.moduleTemplatePath,
    namedTypesTemplatePath: args.namedTypesTemplate,
  });
}

run();
