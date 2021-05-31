import { Parser } from '../parser/Parser';
import { RendererConfig, DefaultSwiftRendererConfig } from '../renderer/RenderConfig';
import { CustomTypeCollector } from '../renderer/CustomTypeCollector';
import { DemoCodeRenderer } from './demoCodeRenderer';
import { fetchNamedTypes, transformModuleAndTypeName } from '../parser/named-types';

function run(): void {
  const config = new DefaultSwiftRendererConfig();
  console.log('Api will be generated with config: \n', JSON.stringify(config, null, 2));

  const parser = new Parser(['src/demo/data/demoApi.ts']);
  const apiModules = parser.parse();
  transformModuleAndTypeName(apiModules, /^I/, '');
  console.log(JSON.stringify(apiModules, null, 4));

  const rendererConfig = config as RendererConfig;
  const typeTransformer = new CustomTypeCollector(rendererConfig);
  const renderer = new DemoCodeRenderer(rendererConfig, typeTransformer);
  const namedTypes = fetchNamedTypes(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  renderer.print();

  console.log(typeTransformer.toSourceLike().join('\n'));
}

run();
