import { Method } from '../../types';
import { MethodView } from '../views';
import { convertValueType } from './value-transformers';

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
    return this.method.parameters.map((parameter, index) => ({ name: parameter.name, type: convertValueType(parameter.type), last: index === this.method.parameters.length - 1 }));
  }

  get returnType(): string | null {
    if (this.method.returnType === null) {
      return null;
    }

    return convertValueType(this.method.returnType);
  }

  get documentationLines(): string[] {
    if (this.method.documentation.length === 0) {
      return [];
    }

    return this.method.documentation.split('\n');
  }
}

