import { Method } from '../../types';
import { getDocumentationLines } from '../utils';
import { ValueTransformer } from '../value-transformer';

export class MethodView {
  constructor(private readonly method: Method, private readonly valueTransformer: ValueTransformer) {}

  get methodName(): string {
    return this.method.name;
  }

  get parametersDeclaration(): string {
    return this.parameters.map((parameter) => {
      let { defaultValue } = parameter;
      if (defaultValue == null) {
        return `${parameter.name}: ${parameter.type}`;
      }
      if (defaultValue === 'null') {
        defaultValue = this.valueTransformer.null();
      }
      return `${parameter.name}: ${parameter.type} = ${defaultValue}`;
    }).join(', ');
  }

  get parameters(): { name: string; type: string; defaultValue?: string; last: boolean }[] {
    return this.method.parameters.map((parameter, index) => ({
      name: parameter.name,
      type: this.valueTransformer.convertValueType(parameter.type),
      defaultValue: parameter.defaultValue,
      last: index === this.method.parameters.length - 1,
    }));
  }

  get returnType(): string | null {
    if (this.method.returnType === null) {
      return null;
    }

    return this.valueTransformer.convertValueType(this.method.returnType);
  }

  get nonOptionalReturnType(): string | null {
    if (this.method.returnType === null) {
      return null;
    }

    return this.valueTransformer.convertNonOptionalValueType(this.method.returnType);
  }

  get documentationLines(): string[] {
    return getDocumentationLines(this.method.documentation);
  }
}
