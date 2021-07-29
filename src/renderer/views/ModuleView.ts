import { Module } from '../../types';
import { ValueTransformer } from '../value-transformer/ValueTransformer';
import { MethodView } from './MethodView';
import { NamedTypeView } from './index';
import { getDocumentationLines } from '../utils';

export class ModuleView {
  constructor(
    private readonly module: Module,
    readonly associatedTypes: NamedTypeView[],
    private readonly valueTransformer: ValueTransformer
  ) {}

  get moduleName(): string {
    return this.module.name;
  }

  get methods(): MethodView[] {
    return this.module.methods.map((method) => new MethodView(method, this.valueTransformer));
  }

  get customTags(): Record<string, unknown> {
    return this.module.customTags;
  }

  get documentationLines(): string[] {
    return getDocumentationLines(this.module.documentation);
  }
}
