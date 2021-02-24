import { CustomTypeKind, ValueType, Field, ArrayTypeKind, BasicTypeKind, ValueTypeKindFlag } from '../types';
import { SourceLike } from './SourceLike';
import { RendererConfig } from './RenderConfig';
import { CodableProtocol, InternalDataStructure } from './InternalDataStructure';

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
      const refinedTypeName = this.replacePrefix(typeName);
      const customDataStructure = new InternalDataStructure(
        this.rendererConfig,
        refinedTypeName,
        this,
        this.customTypes[typeName].members,
        CodableProtocol.codable,
        this.rendererConfig.makeFunctionPublic,
        true
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
      if (fieldType.kind.isAnyKeyDictionary) {
        targetType = `[String: ${this.transformType(fieldType.kind.members[0].type)}]`;
      } else {
        targetType = this.replacePrefix(fieldType.kind.name);
        this.emit(fieldType.kind);
        fieldType.kind.members.forEach((member: Field) => {
          if (!this.isBasicTypeKind(member.type.kind)) {
            // Recursively convert sub-members which is custom type or array type
            this.transformType(member.type);
          }
        });
      }
    } else if (this.isArrayTypeKind(fieldType.kind)) {
      targetType = `[${this.transformType(fieldType.kind.elementType)}]`;
      if (!this.isBasicTypeKind(fieldType.kind.elementType.kind)) {
        // Recursively convert elementType which is custom type or array type
        this.transformType(fieldType.kind.elementType);
      }
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

  private replacePrefix(originalName: string): string {
    let result = originalName;
    const { tsCustomTypePrefixToBeRemoved, customInterfacePrefixToBeAdded} = this.rendererConfig;
    if (tsCustomTypePrefixToBeRemoved) {
      const findIndex = originalName.indexOf(tsCustomTypePrefixToBeRemoved);

      if (findIndex === 0
        && originalName.length > tsCustomTypePrefixToBeRemoved.length
        && this.isUpperCase(originalName[tsCustomTypePrefixToBeRemoved.length])) {
          result = originalName.slice(tsCustomTypePrefixToBeRemoved.length);
      }
    }

    if (customInterfacePrefixToBeAdded) {
      result = customInterfacePrefixToBeAdded + result;
    }

    return result;
  }

  private isUpperCase(ch: string){
    return ch >= 'A' && ch <= 'Z'
  }
}
