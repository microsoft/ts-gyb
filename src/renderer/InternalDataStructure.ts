import { Field } from '../types';
import { GenericCodeRenderer } from './GenericCodeRenderer';
import { RendererConfig } from './RenderConfig';
import { TypeTransformer } from './CustomTypeCollector';

export enum CodableProtocol {
 codable = 'Codable',
 encodable = 'Encodable',
 decodable = 'Decodable'
}

export class InternalDataStructure extends GenericCodeRenderer {
  constructor(
    protected rendererConfig: RendererConfig,
    private predefinedName: string,
    private typeTransformer: TypeTransformer,
    private fields: Field[],
    private codable: CodableProtocol,
    private isPublic = false,
    private isVar = false,
  ) {
    super(rendererConfig);
  }

  render(): void {
    const modifier = this.isPublic ? 'public ' : '';
    this.emitLine(0, `${modifier}struct ${this.predefinedName}: ${this.codable} {`);
    this.fields.forEach((field) => {
      this.emitLine(2, `${modifier}${this.isVar ? 'var' : 'let'} ${field.name}: ${this.typeTransformer.transformType(field.type)}`);
    });

    // Add init method for public struct
    if (this.isPublic) {
      this.emitNewLine();
      const parameters = this.fields.map((field) => `${field.name}: ${this.typeTransformer.transformType(field.type)}`);
      const parameterString = parameters.join(', ');

      // Separate parameters to multiple lines if it's too long
      if (parameterString.length > 300) {
        this.emitLine(2, `public init(`);
        parameters.forEach((parameter, index, arr) => this.emitLine(4, `${parameter}${index === arr.length - 1 ? '' : ','}`));
        this.emitLine(2, `) {`);
      } else {
        this.emitLine(2, `public init(${parameterString}) {`);
      }

      this.fields.forEach((field) => {
        this.emitLine(4, `self.${field.name} = ${field.name}`);
      });
      this.emitLine(2, '}');
    }

    this.emitLine(0, `}`);
  }
}
