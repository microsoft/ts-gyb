import { CustomType, EnumType, isArraryType, isCustomType, isDictionaryType, isEnumType, isOptionalType, Module, ValueType } from "../types";

export type NamedType = CustomType | EnumType;

export class NamedTypeParser {
  parse(modules: Module[]): Record<string, NamedType> {
    const typeMap: Record<string, NamedType> = {};
    
    const customTypes = modules
      .flatMap(module => module.methods)
      .flatMap(method => method.parameters.map(parameter => parameter.type).concat(method.returnType ? [method.returnType] : []));

    customTypes.forEach(valueType => {
      this.recursiveParse(valueType, typeMap);
    });

    return typeMap;
  }

  private recursiveParse(valueType: ValueType, resultTypeMap: Record<string, NamedType>): void {
    if (isCustomType(valueType)) {
      if (valueType.name === undefined) {
        return;
      }

      if (resultTypeMap[valueType.name] !== undefined) {
        return;
      }

      resultTypeMap[valueType.name] = valueType;
      valueType.members.forEach(member => {
        this.recursiveParse(member.type, resultTypeMap);
      });

      return;
    }

    if (isEnumType(valueType)) {
      if (resultTypeMap[valueType.name] !== undefined) {
        return;
      }

      resultTypeMap[valueType.name] = valueType;
      return;
    }

    if (isArraryType(valueType)) {
      this.recursiveParse(valueType.elementType, resultTypeMap);
      return;
    }

    if (isDictionaryType(valueType)) {
      this.recursiveParse(valueType.valueType, resultTypeMap);
      return;
    }

    if (isOptionalType(valueType)) {
      this.recursiveParse(valueType.wrappedType, resultTypeMap);
    }
  }
}
