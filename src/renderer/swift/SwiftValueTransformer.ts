import {
  BasicTypeValue,
  DictionaryKeyType,
  isArraryType,
  isBasicType,
  isCustomType,
  isDictionaryType,
  isEnumType, isOptionalType, isPredefinedType,
  ValueType,
} from '../../types';

export class SwiftValueTransformer {

  constructor(private readonly predefinedTypes: Record<string, string>) {}

  convertValueType(valueType: ValueType): string {
    if (isBasicType(valueType)) {
      switch (valueType.value) {
        case BasicTypeValue.string:
          return 'String';
        case BasicTypeValue.number:
          return 'Double';
        case BasicTypeValue.boolean:
          return 'Bool';
        default:
          throw Error('Type not exists');
      }
    }

    if (isCustomType(valueType)) {
      if (valueType.name !== undefined) {
        return valueType.name;
      }

      // TODO: Handle literal type
      throw Error('not handled');
    }

    if (isEnumType(valueType)) {
      return valueType.name;
    }

    if (isArraryType(valueType)) {
      return `[${this.convertValueType(valueType.elementType)}]`;
    }

    if (isDictionaryType(valueType)) {
      let keyType: string;
      switch (valueType.keyType) {
        case DictionaryKeyType.string:
          keyType = 'String';
          break;
        case DictionaryKeyType.number:
          keyType = 'Int';
          break;
        default:
          throw Error('Type not exists');
      }

      return `[${keyType}: ${this.convertValueType(valueType.valueType)}]`;
    }

    if (isOptionalType(valueType)) {
      return `${this.convertValueType(valueType.wrappedType)}?`;
    }

    if (isPredefinedType(valueType)) {
      return this.predefinedTypes[valueType.name] ?? valueType.name;
    }

    throw Error('Type not handled');
  }

}
