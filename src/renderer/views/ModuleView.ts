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

  get members(): { name: string; type: string; documentationLines: string[]; last: boolean }[] {
    const members = this.module.members.filter((member) => member.staticValue === undefined);

    return members.map((member, index) => ({
      name: member.name,
      type: this.valueTransformer.convertValueType(member.type),
      documentationLines: getDocumentationLines(member.documentation),
      last: index === members.length - 1,
    }));
  }

  get methods(): MethodView[] {
    return this.module.methods.map((method) => new MethodView(method, this.valueTransformer));
  }

  get exportedInterfaceBases(): Record<string, boolean> {
    return Object.fromEntries(this.module.exportedInterfaceBases.map((extendedInterface) => [extendedInterface, true]));
  }

  get customTags(): Record<string, unknown> {
    return this.module.customTags;
  }

  get documentationLines(): string[] {
    return getDocumentationLines(this.module.documentation);
  }
}
