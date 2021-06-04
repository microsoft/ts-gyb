import yargs from 'yargs';
import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration } from './configuration';

const program = yargs(process.argv.slice(2));

const args = program.config().help().argv;

function run(): void {
  const config = args as unknown as Configuration;

  const generator = new CodeGenerator();
  Object.entries(config.parsing.source).forEach(([tag, interfacePaths]) => {
    generator.parse({
      tag,
      interfacePaths,
      predefinedTypes: new Set(config.parsing.predefinedTypes ?? []),
      defaultCustomTags: config.parsing.defaultCustomTags ?? {},
      dropInterfaceIPrefix: config.parsing.dropInterfaceIPrefix ?? false,
    });
  });

  generator.parseNamedTypes();
  generator.printSharedNamedTypes();

  Object.entries(config.parsing.source).forEach(([tag]) => {
    generator.printModules({ tag });
  });

  const swiftRenderConfig = config.rendering.swift;
  if (swiftRenderConfig) {
    Object.entries(swiftRenderConfig.templates).forEach(([tag, moduleTemplatePath]) => {
      generator.renderModules({
        tag,
        language: RenderingLanguage.Swift,
        outputDirectory: swiftRenderConfig.outputDirectory[tag],
        moduleTemplatePath,
        typeNameMap: swiftRenderConfig.typeNameMap ?? {},
      });
    });

    generator.renderNamedTypes({
      language: RenderingLanguage.Swift,
      namedTypesTemplatePath: swiftRenderConfig.namedTypesTemplatePath,
      namedTypesOutputPath: swiftRenderConfig.namedTypesOutputPath,
      typeNameMap: swiftRenderConfig.typeNameMap ?? {},
    });
  }
}

run();
