import { Parser } from '../parser/Parser';
import { RendererConfig, DefaultSwiftRendererConfig } from '../renderer/RenderConfig';
import { CustomTypeCollector } from '../renderer/CustomTypeCollector';
import { DemoCodeRenderer } from './demoCodeRenderer';
import { NamedTypeParser } from '../parser/NamedTypeParser';

function run(): void {
  const config = new DefaultSwiftRendererConfig();
  console.log('Api will be generated with config: \n', JSON.stringify(config, null, 2));

  const parser = new Parser(['src/demo/data/demoApi.ts']);
  const apiModules = parser.parse();
  console.log(JSON.stringify(apiModules, null, 4));

  const rendererConfig = config as RendererConfig;
  const typeTransformer = new CustomTypeCollector(rendererConfig);
  const renderer = new DemoCodeRenderer(rendererConfig, typeTransformer);
  const namedTypeParser = new NamedTypeParser();
  const namedTypes = namedTypeParser.parse(apiModules);
  console.log(JSON.stringify(namedTypes, null, 4));

  renderer.print();

  console.log(typeTransformer.toSourceLike().join('\n'));
}

run();
