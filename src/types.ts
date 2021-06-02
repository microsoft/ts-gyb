export interface Module {
  name: string;
  methods: Method[];
  documentation: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customTags: Record<string, any>;
}

export interface Method {
  name: string;
  parameters: Field[];
  returnType: ValueType | null;
  documentation: string;
}

export interface Field {
  name: string;
  type: ValueType;
}

export type ValueType = NonEmptyType | OptionalType;
export type NonEmptyType = BasicType | CustomType | EnumType | ArrayType | DictionaryType;

export enum ValueTypeKind {
  basicType = 'basicType',
  customType = 'customType',
  enumType = 'enumType',
  arrayType = 'arrayType',
  dictionaryType = 'dictionaryType',
  optionalType = 'optionalType',
}

interface BaseValueType {
  kind: ValueTypeKind;
}

export enum BasicTypeValue {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  int = 'int',
}

export interface BasicType extends BaseValueType {
  kind: ValueTypeKind.basicType;
  value: BasicTypeValue;
}

export interface CustomType extends BaseValueType {
  kind: ValueTypeKind.customType;
  name?: string;
  members: Field[];
}

export enum EnumSubType {
  string = 'string',
  number = 'number',
}

export interface EnumType extends BaseValueType {
  kind: ValueTypeKind.enumType;
  name: string;
  subType: EnumSubType;
  members: Record<string, string | number>;
}

export interface ArrayType extends BaseValueType {
  kind: ValueTypeKind.arrayType;
  elementType: ValueType;
}

export enum DictionaryKeyType {
  string = 'string',
  number = 'number',
}

export interface DictionaryType extends BaseValueType {
  kind: ValueTypeKind.dictionaryType;
  keyType: DictionaryKeyType;
  valueType: ValueType;
}

export interface OptionalType extends BaseValueType {
  kind: ValueTypeKind.optionalType;
  wrappedType: NonEmptyType;
}

export function isBasicType(valueType: ValueType): valueType is BasicType {
  return valueType.kind === ValueTypeKind.basicType;
}

export function isCustomType(valueType: ValueType): valueType is CustomType {
  return valueType.kind === ValueTypeKind.customType;
}

export function isEnumType(valueType: ValueType): valueType is EnumType {
  return valueType.kind === ValueTypeKind.enumType;
}

export function isArraryType(valueType: ValueType): valueType is ArrayType {
  return valueType.kind === ValueTypeKind.arrayType;
}

export function isDictionaryType(valueType: ValueType): valueType is DictionaryType {
  return valueType.kind === ValueTypeKind.dictionaryType;
}

export function isOptionalType(valueType: ValueType): valueType is OptionalType {
  return valueType.kind === ValueTypeKind.optionalType;
}
