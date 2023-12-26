import { ValueType, Value } from '../../types';

export interface ValueTransformer {
  convertValueType(valueType: ValueType): string;
  convertNonOptionalValueType(valueType: ValueType): string;
  convertValue(value: Value, type: ValueType): string;
  convertEnumKey(text: string): string;
  convertTypeNameFromCustomMap(name: string): string;
}
