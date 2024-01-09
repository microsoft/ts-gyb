import path from 'path';
import { BasicTypeValue, EnumField, UnionType } from './types';

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

export function uniquePathWithMember(ownerName: string, memberName: string): string {
  return `${capitalize(ownerName)}Members${capitalize(memberName)}Type`;
}

export function uniquePathWithMethodParameter(ownerName: string, methodName: string, parameterName: string): string {
  return `${capitalize(ownerName)}${capitalize(methodName)}${capitalize(parameterName)}`;
}

export function uniquePathWithMethodReturnType(ownerName: string, methodName: string): string {
  return `${capitalize(ownerName)}${capitalize(methodName)}ReturnType`;
}

export function basicTypeOfUnion(union: UnionType): BasicTypeValue {
  return union.memberType;
}

export function membersOfUnion(union: UnionType): EnumField[] {
  const result: EnumField[] = [];
  union.members.forEach((value) => {
    let key = `${value}`;
    if (!Number.isNaN(Number(value))) {
      key = `_${key}`;
    }
    const enumField: EnumField = {
      key,
      value,
      documentation: '',
    };
    result.push(enumField);
  });
  return result;
}
