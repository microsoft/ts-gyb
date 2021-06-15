import { Module } from '../../types';
import { ModuleView, MethodView, NamedTypeView } from '../views';
import { KotlinMethodView } from './KotlinMethodView';
import { KotlinValueTransformer } from './KotlinValueTransformer';

export class KotlinModuleView implements ModuleView {
  constructor(
    private readonly module: Module,
    readonly associatedTypes: NamedTypeView[],
    private readonly valueTransformer: KotlinValueTransformer,
  ) {}

  get moduleName(): string {
    return this.module.name;
  }

  get methods(): MethodView[] {
    return this.module.methods.map((method) => new KotlinMethodView(method, this.valueTransformer));
  }

  get customTags(): Record<string, unknown> {
    return this.module.customTags;
  }
}
