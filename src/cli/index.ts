import path from 'path';
import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration } from './configuration';

const program = yargs(process.argv.slice(2));

const args = program.config().help().argv;

function run(): void {
  const configPath = args.config as string;
  const directory = path.dirname(configPath);
  process.chdir(directory);

  const config = args as unknown as Configuration;

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
        outputDirectory: renderingConfig.outputDirectory[tag],
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

run();
