import { EnumSubType, EnumKind } from '../types';
import { GenericCodeRenderer } from './GenericCodeRenderer';
import { CodableProtocol } from './InternalDataStructure';
import { RendererConfig } from './RenderConfig';

export class InternalEnum extends GenericCodeRenderer {
  constructor(
    protected rendererConfig: RendererConfig,
    private predefinedName: string,
    private codable: CodableProtocol,
    private enumTypeKind: EnumKind
  ) {
    super(rendererConfig);
  }

  render(): void {
    const modifier = this.rendererConfig.makeFunctionPublic ? 'public ' : '';
    const { enumTypeKind } = this;
    let enumType: string;
    switch (enumTypeKind.subType) {
      case EnumSubType.number:
        enumType = 'Int';
        break;
      case EnumSubType.string:
        enumType = 'String';
        break;
      default:
        throw new Error("Shouldn't run into default");
    }
    this.emitLine(0, `${modifier}enum ${this.predefinedName}: ${enumType}, ${this.codable} {`);
    enumTypeKind.keys.forEach((key, index) => {
      const value = enumTypeKind.values[index];
      let stringifyValue: string;
      switch (enumTypeKind.subType) {
        case EnumSubType.number:
          stringifyValue = value.toString();
          break;
        case EnumSubType.string:
          stringifyValue = `"${value}"`;
          break;
        default:
          throw new Error("Shouldn't run into default");
      }
      this.emitLine(2, `case ${key} = ${stringifyValue}`);
    });
    this.emitLine(0, `}`);
  }
}
