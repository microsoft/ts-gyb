import { CustomType, EnumType, isArraryType, isCustomType, isDictionaryType, isEnumType, isOptionalType, Module, ValueType } from "../types";

export type NamedType = CustomType | EnumType;

export function dropIPrefixInCustomTypes(modules: Module[]): void {
  fetchRootTypes(modules).forEach(valueType => {
    recursiveVisitNamedType(valueType, namedType => {
      if (!isCustomType(namedType)) {
        return;
      }

      namedType.name = namedType.name?.replace(/^I/, '');
    });
  });
}

export function fetchNamedTypes(modules: Module[]): Record<string, NamedType> {
  const typeMap: Record<string, NamedType> = {};
  
  fetchRootTypes(modules).forEach(valueType => {
    recursiveVisitNamedType(valueType, namedType => {
      if (namedType.name === undefined) {
        throw Error("Named type doesn't have name");
      }

      typeMap[namedType.name] = namedType;
    });
  });

  return typeMap;
}

function fetchRootTypes(modules: Module[]): ValueType[] {
  return modules
    .flatMap(module => module.methods)
    .flatMap(method => method.parameters.map(parameter => parameter.type).concat(method.returnType ? [method.returnType] : []));
}

function recursiveVisitNamedType(valueType: ValueType, visit: (namedType: NamedType) => void, visited = new Set<string>()): void {
  if (isCustomType(valueType)) {
    if (valueType.name === undefined) {
      return;
    }

    if (visited.has(valueType.name)) {
      return;
    }

    visit(valueType);
    visited.add(valueType.name);

    valueType.members.forEach(member => {
      recursiveVisitNamedType(member.type, visit, visited);
    });

    return;
  }

  if (isEnumType(valueType)) {
    if (visited.has(valueType.name)) {
      return;
    }

    visit(valueType);
    visited.add(valueType.name);

    return;
  }

  if (isArraryType(valueType)) {
    recursiveVisitNamedType(valueType.elementType, visit, visited);
    return;
  }

  if (isDictionaryType(valueType)) {
    recursiveVisitNamedType(valueType.valueType, visit, visited);
    return;
  }

  if (isOptionalType(valueType)) {
    recursiveVisitNamedType(valueType.wrappedType, visit, visited);
  }
}
