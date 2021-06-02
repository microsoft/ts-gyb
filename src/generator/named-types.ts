import { capitalize } from '../utils';
import {
  isArraryType,
  isCustomType,
  isDictionaryType,
  isEnumType,
  isOptionalType,
  Module,
  ValueType,
  CustomType,
  EnumType,
} from '../types';

export type NamedType = (CustomType & { name: string }) | EnumType;
export type NamedTypesResult = { associatedTypes: Record<string, NamedType[]>; sharedTypes: NamedType[] };

export function dropIPrefixInCustomTypes(modules: Module[]): void {
  modules
    .flatMap((module) => fetchRootTypes(module))
    .forEach((valueType) => {
      recursiveVisitNamedType(valueType, (namedType) => {
        if (!isCustomType(namedType)) {
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
      recursiveVisitNamedType(valueType, (namedType, path) => {
        if (namedType.name === undefined) {
          namedType.name = path;
        }

        if (typeMap[namedType.name] === undefined) {
          typeMap[namedType.name] = { namedType: namedType as NamedType, associatedModules: new Set() };
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
  return module.methods.flatMap((method) =>
    method.parameters.map((parameter) => parameter.type).concat(method.returnType ? [method.returnType] : [])
  );
}

function recursiveVisitNamedType(
  valueType: ValueType,
  visit: (namedType: CustomType | EnumType, path: string) => void,
  path = ''
): void {
  if (isCustomType(valueType)) {
    visit(valueType, path);

    valueType.members.forEach((member) => {
      recursiveVisitNamedType(
        member.type,
        visit,
        `${path}${valueType.name ?? ''}Members${capitalize(member.name)}Type`
      );
    });

    return;
  }

  if (isEnumType(valueType)) {
    visit(valueType, path);
    return;
  }

  if (isArraryType(valueType)) {
    recursiveVisitNamedType(valueType.elementType, visit, `${path}Array`);
    return;
  }

  if (isDictionaryType(valueType)) {
    recursiveVisitNamedType(valueType.valueType, visit, `${path}Dictionary`);
    return;
  }

  if (isOptionalType(valueType)) {
    recursiveVisitNamedType(valueType.wrappedType, visit, `${path}Optional`);
  }
}
