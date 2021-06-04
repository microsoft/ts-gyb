import { Module } from '../../types';
import { ModuleView, MethodView, NamedTypeView } from '../views';
import { SwiftMethodView } from './SwiftMethodView';
import { SwiftValueTransformer } from './SwiftValueTransformer';

export class SwiftModuleView implements ModuleView {
  constructor(private readonly module: Module, readonly associatedTypes: NamedTypeView[], private readonly valueTransformer: SwiftValueTransformer) {}

  get moduleName(): string {
    return this.module.name;
  }

  get methods(): MethodView[] {
    return this.module.methods.map((method) => new SwiftMethodView(method, this.valueTransformer));
  }

  get customTags(): Record<string, string> {
    return Object.fromEntries(Object.entries(this.module.customTags).map(([key, value]) => [key, JSON.stringify(value)]));
  }
}
