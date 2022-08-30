import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';
import { Configuration } from '../configuration';
import { ParsedTarget } from '../generator/named-types';

export function generateWithConfig(config: Configuration): void {
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

  let sharedTypes = generator.extractTargetsSharedTypes(Object.values(namedTargets));
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
