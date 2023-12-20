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
  Value,
  isUnionType,
} from '../../types';
import { ValueTransformer } from './ValueTransformer';

export class SwiftValueTransformer implements ValueTransformer {
  constructor(private readonly typeNameMap: Record<string, string>) {}

  convertValueType(valueType: ValueType, uniqueName: string): string {
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

    if (isInterfaceType(valueType)) {
      return this.convertTypeNameFromCustomMap(valueType.name);
    }

    if (isEnumType(valueType)) {
      return this.convertTypeNameFromCustomMap(valueType.name);
    }

    if (isArraryType(valueType)) {
      return `[${this.convertValueType(valueType.elementType, uniqueName)}]`;
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

      return `[${keyType}: ${this.convertValueType(valueType.valueType, uniqueName)}]`;
    }

    if (isOptionalType(valueType)) {
      return `${this.convertValueType(valueType.wrappedType, uniqueName)}?`;
    }

    if (isPredefinedType(valueType)) {
      return this.typeNameMap[valueType.name] ?? valueType.name;
    }

    if (isUnionType(valueType)) {
      return uniqueName;
    }

    throw Error('Type not handled');
  }

  convertNonOptionalValueType(valueType: ValueType, uniqueName: string): string {
    if (isOptionalType(valueType)) {
      return this.convertValueType(valueType.wrappedType, uniqueName);
    }

    return this.convertValueType(valueType, uniqueName);
  }

  convertValue(value: Value, type: ValueType): string {
    if (isBasicType(type)) {
      switch (type.value) {
        case BasicTypeValue.boolean:
          return (value as boolean) ? 'True' : 'False';
        default:
          return JSON.stringify(value);
      }
    }

    if (isInterfaceType(type)) {
      throw Error('Custom type static value is not supported');
    }

    if (isEnumType(type)) {
      return `.${this.convertEnumKey(value as string)}`;
    }

    if (isArraryType(type)) {
      return `[${(value as Value[]).map((element) => this.convertValue(element, type.elementType)).join(', ')}]`;
    }

    if (isDictionaryType(type)) {
      return `[${Object.entries(value as Record<string, Value>)
        .map(([key, element]) => `${JSON.stringify(key)}: ${this.convertValue(element, type.valueType)}`)
        .join(', ')}]`;
    }

    if (isOptionalType(type)) {
      if (value === null) {
        return 'nil';
      }
      return this.convertValue(value, type.wrappedType);
    }

    if (isPredefinedType(type)) {
      throw Error('Predefined type static value is not supported');
    }

    throw Error('Value not handled');
  }

  convertEnumKey(text: string): string {
    if (text.length === 0) {
      return '';
    }

    let index = 0;
    // Get the index of the first lowercased letter
    while (index < text.length) {
      if (text[index].toLowerCase() === text[index]) {
        break;
      }
      index += 1;
    }

    // Get the index before the first lowercased letter
    if (index > 1 && index < text.length && text[index].toLowerCase() === text[index]) {
      index -= 1;
    }

    return text.slice(0, index).toLowerCase() + text.slice(index);
  }

  convertTypeNameFromCustomMap(name: string): string {
    return this.typeNameMap[name] ?? name;
  }
}
