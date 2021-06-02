import { Module } from '../../types';
import { ModuleView, MethodView, NamedTypeView } from '../views';
import { SwiftMethodView } from './SwiftMethodView';

export class SwiftModuleView implements ModuleView {
  constructor(private readonly module: Module, readonly associatedTypes: NamedTypeView[]) {}

  get moduleName(): string {
    return this.module.name;
  }

  get methods(): MethodView[] {
    return this.module.methods.map((method) => new SwiftMethodView(method));
  }

  get customTags(): Record<string, string> {
    return this.module.customTags;
  }
}
