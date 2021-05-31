export interface Module {
  name: string;
  methods: Method[];
  documentation: string;
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

export enum ValueTypeKindFlag {
  basicType = 'basicType',
  customType = 'customType',
  enumType = 'enumType',
  arrayType = 'arrayType',
  dictionaryType = 'dictionaryType',
  optionalType = 'optionalType',
}

interface ValueTypeKind {
  flag: ValueTypeKindFlag;
}

export enum BasicTypeValue {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  int = 'int',
}

export interface BasicType extends ValueTypeKind {
  flag: ValueTypeKindFlag.basicType;
  value: BasicTypeValue;
}

export interface CustomType extends ValueTypeKind {
  flag: ValueTypeKindFlag.customType;
  name?: string;
  members: Field[];
}

export enum EnumSubType {
  string = 'string',
  number = 'number',
}

export interface EnumType extends ValueTypeKind {
  flag: ValueTypeKindFlag.enumType;
  name: string;
  subType: EnumSubType;
  members: Record<string, string | number>;
}

export interface ArrayType extends ValueTypeKind {
  flag: ValueTypeKindFlag.arrayType;
  elementType: ValueType;
}

export enum DictionaryKeyType {
  string = 'string',
  number = 'number',
}

export interface DictionaryType extends ValueTypeKind {
  flag: ValueTypeKindFlag.dictionaryType;
  keyType: DictionaryKeyType;
  valueType: ValueType;
}

export interface OptionalType extends ValueTypeKind {
  flag: ValueTypeKindFlag.optionalType;
  type: NonEmptyType;
}

export function isBasicType(valueType: ValueType): valueType is BasicType {
  return valueType.flag === ValueTypeKindFlag.basicType;
}

export function isCustomType(valueType: ValueType): valueType is CustomType {
  return valueType.flag === ValueTypeKindFlag.customType;
}

export function isEnumType(valueType: ValueType): valueType is EnumType {
  return valueType.flag === ValueTypeKindFlag.enumType;
}

export function isArraryType(valueType: ValueType): valueType is ArrayType {
  return valueType.flag === ValueTypeKindFlag.arrayType;
}

export function isDictionaryType(valueType: ValueType): valueType is DictionaryType {
  return valueType.flag === ValueTypeKindFlag.dictionaryType;
}

export function isOptionalType(valueType: ValueType): valueType is OptionalType {
  return valueType.flag === ValueTypeKindFlag.optionalType;
}
