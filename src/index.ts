import yargs from 'yargs';
import fs from 'fs';
import path from 'path';
import { Parser } from './parser/Parser';
import { dropIPrefixInCustomTypes, fetchNamedTypes } from './parser/named-types';
import { NamedTypesView } from './renderer/views';
import { SwiftModuleView } from './renderer/swift/SwiftModuleView';
import { SwiftCustomTypeView } from './renderer/swift/SwiftCustomTypeView';
import { SwiftEnumTypeView } from './renderer/swift/SwiftEnumTypeView';
import { renderCode } from './renderer/renderer';
import { isCustomType } from './types';

const program = yargs(process.argv.slice(2));

const args = program
  .options({
    path: {
      alias: 'p',
      type: 'string',
      demandOption: true,
      describe: 'The path of api interface which should extend IExportedApi',
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'The path of output file',
    },
    dropInterfaceIPrefix: {
      type: 'boolean',
      default: false,
      describe: 'Drop "I" prefix for all interfaces',
    },
  })
  .help().argv;

function run(): void {
  const parser = new Parser([args.path]);
  const apiModules = parser.parse();

  if (args.dropInterfaceIPrefix) {
    dropIPrefixInCustomTypes(apiModules);
  }
  console.log(JSON.stringify(apiModules, null, 4));

  const namedTypes = fetchNamedTypes(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  apiModules.forEach((module) => {
    const moduleView = new SwiftModuleView(module);
    const renderedCode = renderCode('templates/swift-bridge.mustache', moduleView);

    const filePath = path.join(args.output, moduleView.fileName);
    fs.writeFileSync(filePath, renderedCode);
  });

  const namedTypesView: NamedTypesView = { customTypes: [], enumTypes: [] };
  Object.entries(namedTypes).forEach(([typeName, namedType]) => {
    if (isCustomType(namedType)) {
      namedTypesView.customTypes.push(new SwiftCustomTypeView(typeName, namedType));
    } else {
      namedTypesView.enumTypes.push(new SwiftEnumTypeView(typeName, namedType));
    }
  });

  const renderedCode = renderCode('templates/swift-named-types.mustache', namedTypesView);

  const filePath = path.join(args.output, 'Generated_CustomInterface.swift');
  fs.writeFileSync(filePath, renderedCode);
}

run();
