import { Method } from '../../types';
import { getDocumentationLines } from '../utils';
import { ValueTransformer } from '../value-transformer';

export class MethodView {
  constructor(private readonly method: Method, private readonly valueTransformer: ValueTransformer) {}

  get methodName(): string {
    return this.method.name;
  }

  get parametersDeclaration(): string {
    return this.parameters.map((parameter) => `${parameter.name}: ${parameter.type}`).join(', ');
  }

  get parameters(): { name: string; type: string; last: boolean }[] {
    return this.method.parameters.map((parameter, index) => ({
      name: parameter.name,
      type: this.valueTransformer.convertValueType(parameter.type),
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
