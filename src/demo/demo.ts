import { Parser } from '../parser/Parser';
import { dropIPrefixInCustomTypes, fetchNamedTypes } from '../parser/named-types';
import { SwiftModuleView } from '../renderer/ModuleView';
import { CodeTemplateRenderer } from '../renderer/CodeTemplateRenderer';

function run(): void {
  const parser = new Parser(['src/demo/data/demoApi.ts']);
  const apiModules = parser.parse();
  dropIPrefixInCustomTypes(apiModules);
  console.log(JSON.stringify(apiModules, null, 4));

  const namedTypes = fetchNamedTypes(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  const renderer = new CodeTemplateRenderer('templates/swift-bridge.mustache', 'generated');
  const swiftModuleViews = apiModules.map(module => new SwiftModuleView(module));
  renderer.renderModules(swiftModuleViews);
}

run();
