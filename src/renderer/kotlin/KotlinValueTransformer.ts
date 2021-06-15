import {
  BasicTypeValue,
  DictionaryKeyType,
  isArraryType,
  isBasicType,
  isInterfaceType,
  isDictionaryType,
  isEnumType,
  isOptionalType,
  isPredefinedType,
  ValueType,
} from '../../types';

export class KotlinValueTransformer {
  constructor(private readonly predefinedTypes: Record<string, string>) {}

  convertValueType(valueType: ValueType): string {
    if (isBasicType(valueType)) {
      switch (valueType.value) {
        case BasicTypeValue.string:
          return 'String';
        case BasicTypeValue.number:
          return 'Float';
        case BasicTypeValue.boolean:
          return 'Bool';
        default:
          throw Error('Type not exists');
      }
    }

    if (isInterfaceType(valueType)) {
      return valueType.name;
    }

    if (isEnumType(valueType)) {
      return valueType.name;
    }

    if (isArraryType(valueType)) {
      return `Array<${this.convertValueType(valueType.elementType)}>`;
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

      return `Map<${keyType}, ${this.convertValueType(valueType.valueType)}>`;
    }

    if (isOptionalType(valueType)) {
      return `${this.convertValueType(valueType.wrappedType)}?`;
    }

    if (isPredefinedType(valueType)) {
      return this.predefinedTypes[valueType.name] ?? valueType.name;
    }

    throw Error('Type not handled');
  }

  convertNonOptionalValueType(valueType: ValueType): string {
    if (isOptionalType(valueType)) {
      return this.convertValueType(valueType.wrappedType);
    }

    return this.convertValueType(valueType);
  }
}
