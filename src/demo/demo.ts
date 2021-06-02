import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';

function run(): void {
  const generator = new CodeGenerator();
  generator.parse({
    tag: 'APIs',
    interfacePaths: ['src/demo/data/demoApi.ts'],
    defaultCustomTags: {},
    dropInterfaceIPrefix: true,
  });
  generator.render({
    tag: 'APIs',
    language: RenderingLanguage.Swift,
    outputDirectory: 'generated',
    moduleTemplatePath: 'templates/swift-bridge.mustache',
    namedTypesTemplatePath: 'templates/swift-named-types.mustache',
  });
}

run();
