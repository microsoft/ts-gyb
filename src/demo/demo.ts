import { CodeGenerator, RenderingLanguage } from '../CodeGenerator';

function run(): void {
  const generator = new CodeGenerator(['src/demo/data/demoApi.ts']);
  generator.parse(true);
  generator.render({
    language: RenderingLanguage.Swift,
    outputDirectory: 'generated',
    moduleTemplatePath: 'templates/swift-bridge.mustache',
    namedTypesTemplatePath: 'templates/swift-named-types.mustache',
  });
}

run();
