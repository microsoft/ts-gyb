import { Field } from '../types';
import { GenericCodeRenderer } from './GenericCodeRenderer';
import { RendererConfig } from './RenderConfig';
import { TypeTransformer } from './CustomTypeCollector';

export class InternalDataStructure extends GenericCodeRenderer {
  constructor(
    protected rendererConfig: RendererConfig,
    private predefinedName: string,
    private typeTransformer: TypeTransformer,
    private fields: Field[]
  ) {
    super(rendererConfig);
  }

  render(): void {
    this.emitLine(0, `struct ${this.predefinedName}: Codable {`);
    this.fields.forEach((field) => {
      this.emitLine(2, `let ${field.name}: ${this.typeTransformer.transformType(field.type)}`);
    });
    this.emitLine(0, `}`);
  }
}
