import { CodeGenerator, RenderingLanguage } from '../generator/CodeGenerator';

function run(): void {
  const generator = new CodeGenerator();
  generator.parse({
    interfacePaths: ['src/demo/data/demoApi.ts'],
    defaultCustomTags: {},
    dropInterfaceIPrefix: true,
  });
  generator.renderModules({
    index: 0,
    language: RenderingLanguage.Swift,
    outputDirectory: 'generated',
    moduleTemplatePath: 'templates/swift-bridge.mustache',
  });
}

run();
