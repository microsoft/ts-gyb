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

export type NamedType = InterfaceType | EnumType;
export type NamedTypesResult = { associatedTypes: Record<string, NamedType[]>; sharedTypes: NamedType[] };

export function dropIPrefixInCustomTypes(modules: Module[]): void {
  modules
    .flatMap((module) => fetchRootTypes(module))
    .forEach((valueType) => {
      recursiveVisitMembersType(valueType, (namedType) => {
        if (!isInterfaceType(namedType)) {
          return;
        }

        namedType.name = namedType.name?.replace(/^I/, '');
      });
    });
}

export function fetchNamedTypes(modules: Module[]): NamedTypesResult {
  const typeMap: Record<string, { namedType: NamedType; associatedModules: Set<string> }> = {};

  modules.forEach((module) => {
    fetchRootTypes(module).forEach((valueType) => {
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
          typeMap[namedType.name] = { namedType, associatedModules: new Set() };
        }

        typeMap[namedType.name].associatedModules.add(module.name);
      });
    });
  });

  const associatedTypes: Record<string, NamedType[]> = {};
  const sharedTypes: NamedType[] = [];

  Object.values(typeMap).forEach(({ namedType, associatedModules }) => {
    if (associatedModules.size === 1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const moduleName: string = associatedModules.values().next().value;
      if (associatedTypes[moduleName] === undefined) {
        associatedTypes[moduleName] = [];
      }
      associatedTypes[moduleName].push(namedType);
    } else {
      sharedTypes.push(namedType);
    }
  });

  return { associatedTypes, sharedTypes };
}

function fetchRootTypes(module: Module): ValueType[] {
  const typesInMembers = module.members.map((field) => field.type);
  const typesInMethods = module.methods.flatMap((method) =>
    method.parameters.map((parameter) => parameter.type).concat(method.returnType ? [method.returnType] : [])
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
