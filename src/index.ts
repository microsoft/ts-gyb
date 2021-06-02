import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from './generator/CodeGenerator';
import { parseKeyValueText } from './utils';

interface Config {
  moduleGenerationMaps: { interfacePaths: string[]; moduleTemplatePath: string; outputDirectory: string }[];
  namedTypesTemplatePath: string;
  namedTypesOutputPath: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultCustomTags?: any;
  dropInterfaceIPrefix?: boolean;
}
const program = yargs(process.argv.slice(2));

const args = program
  .config()
  .options({
    interfacePaths: {
      type: 'string',
      array: true,
      describe: 'The path of api interface which should extend IExportedApi',
    },
    outputDirectory: {
      type: 'string',
      describe: 'The path of output directory',
    },
    moduleTemplatePath: {
      type: 'string',
      describe: 'The path of module template',
    },
    namedTypesTemplatePath: {
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
  const config = args as unknown as Config;

  const generator = new CodeGenerator();
  config.moduleGenerationMaps.forEach((moduleGenerationMap, index) => {
    generator.parse({
      interfacePaths: moduleGenerationMap.interfacePaths,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      defaultCustomTags: config.defaultCustomTags ?? {},
      dropInterfaceIPrefix: config.dropInterfaceIPrefix ?? false,
    });
    generator.printModules(index);
  });

  generator.parseNamedTypes();
  generator.printSharedNamedTypes();

  config.moduleGenerationMaps.forEach((moduleGenerationMap, index) => {
    generator.renderModules({
      index,
      language: RenderingLanguage.Swift,
      outputDirectory: moduleGenerationMap.outputDirectory,
      moduleTemplatePath: moduleGenerationMap.moduleTemplatePath,
    });
  });

  generator.renderNamedTypes({
    language: RenderingLanguage.Swift,
    namedTypesTemplatePath: config.namedTypesTemplatePath,
    namedTypesOutputPath: config.namedTypesOutputPath,
  });
}

run();
