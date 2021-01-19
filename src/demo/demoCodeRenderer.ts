import dummyData from './data/parsedModules.json';
import { Module } from '../types';
import { RendererConfig } from '../renderer/RenderConfig';
import { TypeTransformer } from '../renderer/CustomTypeCollector';
import { SwiftCodeRenderer } from '../renderer/SwiftCodeRenderer';

export class DemoCodeRenderer extends SwiftCodeRenderer {
  constructor(rendererConfig: RendererConfig, typeTransformer: TypeTransformer) {
    super(rendererConfig, typeTransformer, dummyData as Module[], '');
  }

  print(): void {
    console.log(this.getFormattedContentWithTemplate());
  }
}
