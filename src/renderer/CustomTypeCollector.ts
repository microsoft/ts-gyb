import { CustomTypeKind, ValueType, Field, ArrayTypeKind, BasicTypeKind, ValueTypeKindFlag } from '../types';
import { SourceLike } from './SourceLike';
import { RendererConfig } from './RenderConfig';
import { InternalDataStructure } from './InternalDataStructure';

export interface TypeTransformer {
  transformType(fieldType: ValueType | Field[], ignoreNullable?: boolean): string;
  toSourceLike(): SourceLike[];
}
export class CustomTypeCollector implements TypeTransformer {
  private customTypes: Record<string, CustomTypeKind> = {};

  constructor(protected rendererConfig: RendererConfig) {}

  public emit(customType: CustomTypeKind): void {
    this.customTypes[customType.name] = customType;
  }

  public toSourceLike(): SourceLike[] {
    let result: SourceLike[] = [];

    Object.keys(this.customTypes).forEach((typeName) => {
      const refinedTypeName = typeName.replace(this.rendererConfig.tsCustomTypePrefix, '');
      const customDataStructure = new InternalDataStructure(
        this.rendererConfig,
        refinedTypeName,
        this,
        this.customTypes[typeName].members
      );
      result = result.concat(customDataStructure.toSourceCode());
    });

    return result;
  }

  public transformType(fieldType: ValueType, ignoreNullable = false): string {
    let targetType: string;
    const UNKNOWN_TYPE = 'unknown';

    if (this.isBasicTypeKind(fieldType.kind)) {
      switch (fieldType.kind.value) {
        case 'string':
          targetType = 'String';
          break;
        case 'number':
          targetType = 'CGFloat';
          break;
        case 'boolean':
          targetType = 'Bool';
          break;
        default:
          targetType = UNKNOWN_TYPE;
      }
    } else if (this.isCustomTypeKind(fieldType.kind)) {
      targetType = fieldType.kind.name;
      if (targetType.startsWith(this.rendererConfig.tsCustomTypePrefix)) {
        targetType = targetType.replace(this.rendererConfig.tsCustomTypePrefix, '');
      }
      this.emit(fieldType.kind);
    } else if (this.isArrayTypeKind(fieldType.kind)) {
      targetType = `[${this.transformType(fieldType.kind.elementType)}]`;
    } else {
      targetType = UNKNOWN_TYPE;
    }

    if (!ignoreNullable && fieldType.nullable && targetType !== UNKNOWN_TYPE) {
      targetType += '?';
    }
    return targetType;
  }

  private isBasicTypeKind(kind: ValueType['kind']): kind is BasicTypeKind {
    return kind.flag === ValueTypeKindFlag.basicType;
  }

  private isCustomTypeKind(kind: ValueType['kind']): kind is CustomTypeKind {
    return kind.flag === ValueTypeKindFlag.customType;
  }

  private isArrayTypeKind(kind: ValueType['kind']): kind is ArrayTypeKind {
    return kind.flag === ValueTypeKindFlag.arrayType;
  }
}
