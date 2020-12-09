import { Parser } from '../Parser';
import { RendererConfig, DefaultSwiftRendererConfig } from '../renderer/RenderConfig';
import { CustomTypeCollector } from '../renderer/CustomTypeCollector';
import { ExampleCodeRenderer } from './demoCodeRenderer';

function run(): void {
  const config = new DefaultSwiftRendererConfig();
  console.log('Api will be generated with config: \n', config);

  const parser = new Parser(['src/example/data/exampleApi.ts']);
  const apiModules = parser.parse();
  console.log(JSON.stringify(apiModules, null, 4));

  const rendererConfig = config as RendererConfig;
  const typeTransformer = new CustomTypeCollector(rendererConfig);
  const renderer = new ExampleCodeRenderer(rendererConfig, typeTransformer);

  renderer.print();

  console.log(typeTransformer.toSourceLike().join('\n'));
}

run();
