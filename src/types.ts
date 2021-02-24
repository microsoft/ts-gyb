export interface Module {
  name: string;
  methods: Method[];
}

export interface Method {
  name: string;
  parameters: Field[];
  returnType: ValueType | null;
}

export interface Field {
  name: string;
  type: ValueType;
}

export interface ValueType {
  kind: ArrayTypeKind | CustomTypeKind | BasicTypeKind;
  nullable: boolean;
}

export enum ValueTypeKindFlag {
  basicType = 'basicType',
  customType = 'customType',
  arrayType = 'arrayType',
}

interface ValueTypeKind {
  flag: ValueTypeKindFlag;
}

export interface ArrayTypeKind extends ValueTypeKind {
  flag: ValueTypeKindFlag.arrayType;
  elementType: ValueType;
}

export interface CustomTypeKind extends ValueTypeKind {
  flag: ValueTypeKindFlag.customType;
  isTypeLiteral?: boolean;
  name: string;
  members: Field[];
  isAnyKeyDictionary?: boolean;
}

export interface BasicTypeKind extends ValueTypeKind {
  flag: ValueTypeKindFlag.basicType;
  value: BasicTypeValue;
}

export enum BasicTypeValue {
  string = 'string',
  number = 'number',
  boolean = 'boolean',
}
