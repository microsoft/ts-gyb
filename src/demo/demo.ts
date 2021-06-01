import fs from 'fs';
import path from 'path';
import { Parser } from '../parser/Parser';
import { dropIPrefixInCustomTypes, fetchNamedTypes } from '../parser/named-types';
import { SwiftModuleView } from '../renderer/swift/SwiftModuleView';
import { renderCode } from '../renderer/renderer';

function run(): void {
  const parser = new Parser(['src/demo/data/demoApi.ts']);
  const apiModules = parser.parse();
  dropIPrefixInCustomTypes(apiModules);
  console.log(JSON.stringify(apiModules, null, 4));

  const namedTypes = fetchNamedTypes(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  apiModules.forEach((module) => {
    const moduleView = new SwiftModuleView(module);
    const renderedCode = renderCode('templates/swift-bridge.mustache', moduleView);

    const filePath = path.join('generated', moduleView.fileName);
    fs.writeFileSync(filePath, renderedCode);
  });
}

run();
