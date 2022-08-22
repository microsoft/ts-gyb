import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration, normalizeConfiguration, RenderConfiguration } from './configuration';

const program = yargs(process.argv.slice(2));

function run(): void {
  /* eslint-disable no-empty-function,@typescript-eslint/no-empty-function */
  program
    .scriptName('ts-gyb')
    .command(['gen', '*'], 'generate code from a configuration file', () => {}, generate)
    .command('list-output', 'list all output files', (subprogram) => {
      subprogram
        .option('language', { description: 'language of the output files to list', choices: ['swift', 'kotlin'] })
        .option('expand', { description: 'expand directories' });
    }, listOutput)
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

function listOutput(args: { config: string; language?: 'swift' | 'kotlin'; expand: boolean }): void {
  const config = parseConfig(args.config);

  let files: string[];
  if (args.language !== undefined) {
    const renderingConfig = config.rendering[args.language];
    if (renderingConfig === undefined) {
      throw new Error(`Language ${args.language} is not defined in the configuration file`);
    }
    files = Object.values(renderingConfig.outputPath).concat(renderingConfig.namedTypesOutputPath);
  } else {
    files = Object.values(config.rendering).map((renderingConfig: RenderConfiguration) => Object.values(renderingConfig.outputPath).concat(renderingConfig.namedTypesOutputPath)).flat();
  }

  files = files.map((file) => path.resolve(file));
  if (args.expand) {
    files = files.map((filePath) => {
      if (!fs.lstatSync(filePath).isDirectory()) {
        return filePath;
      }

      return fs.readdirSync(filePath).map((file) => path.join(filePath, file));
    }).flat();
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
