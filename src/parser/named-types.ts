import { capitalize } from "../utils";
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
    recursiveVisitNamedType(valueType, (namedType, path) => {
      if (namedType.name === undefined) {
        namedType.name = path;
      }

      if (typeMap[namedType.name] !== undefined) {
        return;
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

function recursiveVisitNamedType(valueType: ValueType, visit: (namedType: NamedType, path: string) => void, path = ''): void {
  if (isCustomType(valueType)) {
    visit(valueType, path);

    valueType.members.forEach(member => {
      recursiveVisitNamedType(member.type, visit, `${path}${valueType.name ?? ''}Members${capitalize(member.name)}Type`);
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
