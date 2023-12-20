import path from 'path';
import { BasicTypeValue, EnumField, UnionType, ValueTypeKind } from './types';

export function capitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0].toUpperCase() + text.slice(1);
}

export function uncapitalize(text: string): string {
  if (text.length === 0) {
    return text;
  }

  return text[0].toLowerCase() + text.slice(1);
}

export function normalizePath(currentPath: string, basePath: string): string {
  if (path.isAbsolute(currentPath)) {
    return currentPath;
  }
  const result = path.join(basePath, currentPath);
  return result;
}

export function uniqueNameAsMember(ownerName: string, memberName: string): string {
  return `${capitalize(ownerName)}${capitalize(memberName)}`;
}

export function uniqueNameAsMethodParameter(ownerName: string, methodName: string, parameterName: string): string {
  return `${capitalize(ownerName)}${capitalize(methodName)}${capitalize(parameterName)}`;
}

export function uniqueNameAsMethodReturnType(ownerName: string, methodName: string): string {
  return `${capitalize(ownerName)}${capitalize(methodName)}ReturnType`;
}

export function basicTypeOfUnion(union: UnionType): BasicTypeValue {
  const { type } = union.memberTypes[0];
  if ('value' in type) {
    return type.value;
  }
  return BasicTypeValue.string;
}

export function membersOfUnion(union: UnionType): EnumField[] {
  const result: EnumField[] = [];
  union.memberTypes.forEach((value) => {
    switch (value.type.kind) {
      case ValueTypeKind.basicType:
        switch (value.type.value) {
          case BasicTypeValue.string:
            if (typeof value.value === 'string') {
              const enumField: EnumField = {
                key: value.value,
                value: value.value,
                documentation: '',
              };
              result.push(enumField);
            }
            break;
          case BasicTypeValue.number:
            if (typeof value.value === 'number') {
              const enumField: EnumField = {
                key: `_${value.value}`,
                value: value.value,
                documentation: '',
              };
              result.push(enumField);
            }
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }
  });
  return result;
}
