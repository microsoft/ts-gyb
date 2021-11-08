import { capitalize } from '../utils';
import {
  isArraryType,
  isInterfaceType,
  isDictionaryType,
  isEnumType,
  isOptionalType,
  Module,
  ValueType,
  InterfaceType,
  EnumType,
  TupleType,
  isTupleType,
  ValueTypeKind,
} from '../types';

export const enum ValueTypeSource {
  Field = 1 << 0,
  Parameter = 1 << 1,
  Return = 1 << 2,
}

export type NamedType = InterfaceType | EnumType;
export interface NamedTypeInfo {
  type: NamedType;
  source: ValueTypeSource;
}

export type NamedTypesResult = { associatedTypes: Record<string, NamedTypeInfo[]>; sharedTypes: NamedTypeInfo[] };

export function dropIPrefixInCustomTypes(modules: Module[]): void {
  modules
    .flatMap((module) => fetchRootTypes(module))
    .forEach(([valueType]) => {
      recursiveVisitMembersType(valueType, (namedType) => {
        if (!isInterfaceType(namedType)) {
          return;
        }

        namedType.name = namedType.name?.replace(/^I/, '');
      });
    });
}

export function fetchNamedTypes(modules: Module[]): NamedTypesResult {
  const typeMap: Record<string, { namedType: NamedType; source: ValueTypeSource; associatedModules: Set<string> }> = {};

  modules.forEach((module) => {
    fetchRootTypes(module).forEach(([valueType, source]) => {
      recursiveVisitMembersType(valueType, (membersType, path) => {
        let namedType = membersType;
        if (isTupleType(namedType)) {
          namedType = membersType as unknown as InterfaceType;
          namedType.kind = ValueTypeKind.interfaceType;
          namedType.name = path;
          namedType.documentation = '';
          namedType.customTags = {};
        }

        if (typeMap[namedType.name] === undefined) {
          typeMap[namedType.name] = { namedType, source, associatedModules: new Set() };
        }

        const existingResult = typeMap[namedType.name];
        existingResult.associatedModules.add(module.name);
        existingResult.source |= source;
      });
    });
  });

  const associatedTypes: Record<string, NamedTypeInfo[]> = {};
  const sharedTypes: NamedTypeInfo[] = [];

  Object.values(typeMap).forEach(({ namedType, source, associatedModules }) => {
    if (associatedModules.size === 1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const moduleName: string = associatedModules.values().next().value;
      if (associatedTypes[moduleName] === undefined) {
        associatedTypes[moduleName] = [];
      }
      associatedTypes[moduleName].push({ type: namedType, source });
    } else {
      sharedTypes.push({ type: namedType, source });
    }
  });

  return { associatedTypes, sharedTypes };
}

function fetchRootTypes(module: Module): [ValueType, ValueTypeSource][] {
  const typesInMembers: [ValueType, ValueTypeSource][] = module.members.map((field) => [
    field.type,
    ValueTypeSource.Field,
  ]);
  const typesInMethods: [ValueType, ValueTypeSource][] = module.methods.flatMap((method) =>
    method.parameters
      .map((parameter): [ValueType, ValueTypeSource] => [parameter.type, ValueTypeSource.Parameter])
      .concat(method.returnType ? [[method.returnType, ValueTypeSource.Return]] : [])
  );

  return typesInMembers.concat(typesInMethods);
}

function recursiveVisitMembersType(
  valueType: ValueType,
  visit: (membersType: NamedType | TupleType, path: string) => void,
  path = ''
): void {
  if (isInterfaceType(valueType)) {
    visit(valueType, path);

    valueType.members.forEach((member) => {
      recursiveVisitMembersType(member.type, visit, `${path}${valueType.name}Members${capitalize(member.name)}Type`);
    });

    return;
  }

  if (isTupleType(valueType)) {
    visit(valueType, path);

    valueType.members.forEach((member) => {
      recursiveVisitMembersType(member.type, visit, `${path}Members${capitalize(member.name)}Type`);
    });

    return;
  }

  if (isEnumType(valueType)) {
    visit(valueType, path);
    return;
  }

  if (isArraryType(valueType)) {
    recursiveVisitMembersType(valueType.elementType, visit, `${path}Element`);
    return;
  }

  if (isDictionaryType(valueType)) {
    recursiveVisitMembersType(valueType.valueType, visit, `${path}Value`);
    return;
  }

  if (isOptionalType(valueType)) {
    recursiveVisitMembersType(valueType.wrappedType, visit, `${path}`);
  }
}
