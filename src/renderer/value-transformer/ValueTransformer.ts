import { ValueType, Value } from '../../types';

export interface ValueTransformer {
  convertValueType(valueType: ValueType, uniqueName: string): string;
  convertNonOptionalValueType(valueType: ValueType, uniqueName: string): string;
  convertValue(value: Value, type: ValueType): string;
  convertEnumKey(text: string): string;
  convertTypeNameFromCustomMap(name: string): string;
}
