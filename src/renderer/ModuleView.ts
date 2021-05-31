/* eslint-disable max-classes-per-file */

import { BasicTypeValue, DictionaryKeyType, isArraryType, isBasicType, isCustomType, isDictionaryType, isEnumType, isOptionalType, Method, Module, ValueType } from '../types';

export interface MethodView {
  readonly methodName: string;
  readonly parametersDeclaration: string;
  readonly parameters: { name: string, type: string, last: boolean }[];
  readonly returnType: string | null;
  readonly documentationLines: string[];
}

export class SwiftMethodView implements MethodView {
  constructor(
    private method: Method,
  ) {}

  get methodName(): string {
    return this.method.name;
  }

  get parametersDeclaration(): string {
    return this.parameters.map(parameter =>  `${parameter.name}: ${parameter.type}`).join(', ');
  }

  get parameters(): { name: string, type: string, last: boolean }[] {
    return this.method.parameters.map((parameter, index) => ({ name: parameter.name, type: this.getTypeName(parameter.type), last: index === this.method.parameters.length - 1 }));
  }

  get returnType(): string | null {
    if (this.method.returnType === null) {
      return null;
    }

    return this.getTypeName(this.method.returnType);
  }

  get documentationLines(): string[] {
    if (this.method.documentation.length === 0) {
      return [];
    }

    return this.method.documentation.split('\n');
  }

  private getTypeName(valueType: ValueType): string {
    if (isBasicType(valueType)) {
      switch (valueType.value) {
        case BasicTypeValue.string:
          return 'String';
        case BasicTypeValue.number:
          return 'Double';
        case BasicTypeValue.boolean:
          return 'Bool';
        case BasicTypeValue.int:
          return 'Int';
        default:
          throw Error('Type not exists');
      }
    }

    if (isCustomType(valueType)) {
      if (valueType.name !== undefined) {
        return valueType.name;
      }

      // TODO: Handle literal type
      throw Error('not handled');
    }

    if (isEnumType(valueType)) {
      return valueType.name;
    }

    if (isArraryType(valueType)) {
      return `[${this.getTypeName(valueType.elementType)}]`;
    }

    if (isDictionaryType(valueType)) {
      let keyType: string;
      switch (valueType.keyType) {
        case DictionaryKeyType.string:
          keyType = 'String';
          break;
        case DictionaryKeyType.number:
          keyType = 'Int';
          break;
        default:
            throw Error('Type not exists');
      }

      return `[${keyType}: ${this.getTypeName(valueType.valueType)}]`;
    }

    if (isOptionalType(valueType)) {
      return `${this.getTypeName(valueType.wrappedType)}?`;
    }

    throw Error('Type not handled');
  }
}

export interface ModuleView {
  readonly fileName: string;
  readonly moduleName: string;
  readonly methods: MethodView[];
}

export class SwiftModuleView implements ModuleView {
  constructor(
    private module: Module,
  ) {}

  get fileName(): string {
    return `${this.module.name}.swift`;
  }

  get moduleName(): string {
    return this.module.name;
  }

  get methods(): MethodView[] {
    return this.module.methods.map(method => new SwiftMethodView(method));
  }
}
