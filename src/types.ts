export interface Module {
  name: string;
  methods: Method[];
}

export interface Method {
  name: string;
  parameters: Field[];
  returnType: ValueType | null;
  comment?: string;
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

export interface OptionalType extends ValueTypeKind {
  flag: ValueTypeKindFlag.optionalType;
  type: NonEmptyType;
}

export enum DictionaryKeyType {
  string = 'string',
  number = 'number',
}

export interface DictionaryType extends ValueTypeKind {
  flag: ValueTypeKindFlag.dictionaryType;
  keyType: DictionaryType;
  valueType: ValueType;
}

export interface ArrayType extends ValueTypeKind {
  flag: ValueTypeKindFlag.arrayType;
  elementType: ValueType;
}

export interface CustomType extends ValueTypeKind {
  flag: ValueTypeKindFlag.customType;
  isTypeLiteral?: boolean;
  name: string;
  members: Field[];
  isAnyKeyDictionary?: boolean;
}

export enum EnumSubType {
  string = 'string',
  number = 'number',
}

export interface EnumType extends ValueTypeKind {
  flag: ValueTypeKindFlag.enumType;
  name: string;
  subType: EnumSubType;
  keys: string[];
  values: (string | number)[];
}

export interface BasicType extends ValueTypeKind {
  flag: ValueTypeKindFlag.basicType;
  value: BasicTypeValue;
}

export enum BasicTypeValue {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
  int = 'int',
}

export function isOptionalType(valueType: ValueType): valueType is OptionalType {
  return valueType.flag === ValueTypeKindFlag.optionalType;
}
