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
} from '../../types';
import { ValueTransformer } from './ValueTransformer';

export class KotlinValueTransformer implements ValueTransformer {
  constructor(private readonly predefinedTypes: Record<string, string>) {}

  convertValueType(valueType: ValueType): string {
    if (isBasicType(valueType)) {
      switch (valueType.value) {
        case BasicTypeValue.string:
          return 'String';
        case BasicTypeValue.number:
          return 'Float';
        case BasicTypeValue.boolean:
          return 'Boolean';
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

  convertValue(value: Value, type: ValueType): string {
    if (isBasicType(type)) {
      switch (type.value) {
        case BasicTypeValue.boolean:
          return (value as boolean) ? 'true' : 'false';
        default:
          return JSON.stringify(value);
      }
    }

    if (isInterfaceType(type)) {
      throw Error('Custom type static value is not supported');
    }

    if (isEnumType(type)) {
      return `${type.name}.${this.convertEnumKey(value as string)}`;
    }

    if (isArraryType(type)) {
      return `arrayOf(${(value as Value[]).map((element) => this.convertValue(element, type.elementType)).join(', ')})`;
    }

    if (isDictionaryType(type)) {
      return `mapOf(${Object.entries(value as Record<string, Value>)
        .map(([key, element]) => `${JSON.stringify(key)} to ${this.convertValue(element, type.valueType)}`)
        .join(', ')})`;
    }

    if (isOptionalType(type)) {
      if (value === null) {
        return 'null';
      }
      return this.convertValue(value, type.wrappedType);
    }

    if (isPredefinedType(type)) {
      throw Error('Predefined type static value is not supported');
    }

    throw Error('Value not handled');
  }

  convertEnumKey(text: string): string {
    return text.toUpperCase();
  }
}
