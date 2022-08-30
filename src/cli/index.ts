import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration, normalizeConfiguration, RenderConfiguration } from '../configuration';
import { ParsedTarget } from '../generator/named-types';

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

  const generator = new CodeGenerator(
    new Set(config.parsing.predefinedTypes ?? []),
    config.parsing.defaultCustomTags ?? {},
    config.parsing.skipInvalidMethods ?? false,
    config.parsing.dropInterfaceIPrefix ?? false
  );

  const namedTargets = Object.fromEntries(
    Object.entries(config.parsing.targets)
      .map(([target, targetConfig]) => ([target, generator.parseTarget(targetConfig.source, targetConfig.exportedInterfaceBases !== undefined ? new Set(targetConfig.exportedInterfaceBases) : undefined)]))
  );

  let sharedTypes = generator.extractSharedTypes(Object.values(namedTargets));
  sharedTypes = sharedTypes.concat(Object.values(namedTargets).flatMap((target) => target.sharedTypes));
  generator.printSharedTypes(sharedTypes);

  Object.values(namedTargets).forEach((target) => {
    generator.printTarget(target.modules);
  });

  const languageRenderingConfigs = [
    { language: RenderingLanguage.Swift, renderingConfig: config.rendering.swift },
    { language: RenderingLanguage.Kotlin, renderingConfig: config.rendering.kotlin },
  ];

  languageRenderingConfigs.forEach(({ language, renderingConfig }) => {
    if (renderingConfig === undefined) {
      return;
    }

    renderingConfig.renders.forEach((render) => {
      const target = namedTargets[render.target] as ParsedTarget | undefined;
      if (target === undefined) {
        throw new Error(`target ${render.target} is not defined in the configuration file`);
      }
      generator.renderModules(target.modules, {
        language,
        outputPath: render.outputPath,
        templatePath: render.template,
        typeNameMap: renderingConfig.typeNameMap ?? {},
      });
    });

    if (sharedTypes.length > 0) {
      generator.renderNamedTypes(sharedTypes, {
        language,
        outputPath: renderingConfig.namedTypesOutputPath,
        templatePath: renderingConfig.namedTypesTemplatePath,
        typeNameMap: renderingConfig.typeNameMap ?? {},
      });
    }
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
    files = renderingConfig.renders.map((render) => render.outputPath);
  } else {
    files = Object.values(config.rendering).flatMap((renderingConfig: RenderConfiguration) => renderingConfig.renders.map((render) => render.outputPath));
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
