import { BasicTypeValue, DictionaryKeyType, isArraryType, isBasicType, isCustomType, isDictionaryType, isEnumType, isOptionalType, ValueType } from '../../types';

export function convertValueType(valueType: ValueType): string {
  if (isBasicType(valueType)) {
    switch (valueType.value) {
      case BasicTypeValue.string:
        return 'String';
      case BasicTypeValue.number:
        return 'Double';
      case BasicTypeValue.boolean:
        return 'Bool';
      case BasicTypeValue.int:
        return 'Int';
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
    return `[${convertValueType(valueType.elementType)}]`;
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

    return `[${keyType}: ${convertValueType(valueType.valueType)}]`;
  }

  if (isOptionalType(valueType)) {
    return `${convertValueType(valueType.wrappedType)}?`;
  }

  throw Error('Type not handled');
}
