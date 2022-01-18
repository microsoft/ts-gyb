import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { glob } from 'glob';
import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration, normalizeConfiguration } from './configuration';

const program = yargs(process.argv.slice(2));

function run(): void {
  /* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
  program
    .scriptName('ts-gyb')
    .command('gen', 'generate code from a configuration file', () => {}, generate)
    .command('list-sources', 'list all available source files', (subprogram) => {
      subprogram
        .option('tag <tag>', { description: 'tag of the source files to list', type: 'string' })
        .option('expand', { description: 'expand globstar' });
    }, listSources)
    .option('config', {
      describe: 'path to the configuration file',
      type: 'string',
    })
    .demandCommand(1, 'You need at least one command before moving on')
    .demandOption('config')
    .help()
    .parse();
  /* eslint-enable no-empty-function,@typescript-eslint/no-empty-function */
}

function generate(args: { config: string }): void {
  const config = parseConfig(args.config);

  const generator = new CodeGenerator();
  Object.entries(config.parsing.source).forEach(([tag, interfacePaths]) => {
    generator.parse({
      tag,
      interfacePaths,
      predefinedTypes: new Set(config.parsing.predefinedTypes ?? []),
      defaultCustomTags: config.parsing.defaultCustomTags ?? {},
      dropInterfaceIPrefix: config.parsing.dropInterfaceIPrefix ?? false,
      skipInvalidMethods: config.parsing.skipInvalidMethods ?? false,
    });
  });

  generator.parseNamedTypes();
  generator.printSharedNamedTypes();

  Object.entries(config.parsing.source).forEach(([tag]) => {
    generator.printModules({ tag });
  });

  const languageRenderingConfigs = [
    { language: RenderingLanguage.Swift, renderingConfig: config.rendering.swift },
    { language: RenderingLanguage.Kotlin, renderingConfig: config.rendering.kotlin },
  ];

  languageRenderingConfigs.forEach(({ language, renderingConfig }) => {
    if (renderingConfig === undefined) {
      return;
    }

    Object.entries(renderingConfig.templates).forEach(([tag, moduleTemplatePath]) => {
      generator.renderModules({
        tag,
        language,
        outputPath: renderingConfig.outputPath[tag],
        moduleTemplatePath,
        typeNameMap: renderingConfig.typeNameMap ?? {},
      });
    });

    generator.renderNamedTypes({
      language,
      namedTypesTemplatePath: renderingConfig.namedTypesTemplatePath,
      namedTypesOutputPath: renderingConfig.namedTypesOutputPath,
      typeNameMap: renderingConfig.typeNameMap ?? {},
    });
  });
}

function listSources(args: { config: string; tag?: string; expand: boolean }): void {
  const config = parseConfig(args.config);

  let files: string[];
  if (args.tag !== undefined) {
    if (config.parsing.source[args.tag] === undefined) {
      throw new Error(`Tag ${args.tag} is not defined in the configuration file`);
    }
    files = config.parsing.source[args.tag];
  } else {
    files = Object.values(config.parsing.source).flat();
  }

  files = files.map((file) => path.resolve(file));

  if (args.expand) {
    files = files.flatMap((pattern) => glob.sync(pattern));
  }

  files = [...new Set(files)];

  console.log(files.join('\n'));
}

function parseConfig(configPath: string): Configuration {
  const configFile = path.resolve(configPath);
  const projectDirectory = path.dirname(configFile);

  process.chdir(projectDirectory);

  const rawConfig = JSON.parse(fs.readFileSync(configFile).toString()) as Configuration;
  return normalizeConfiguration(rawConfig, projectDirectory);
}

run();
