import { InterfaceTypeView } from './InterfaceTypeView';
import { EnumTypeView } from './EnumTypeView';

export * from './EnumTypeView';
export * from './InterfaceTypeView';
export * from './MethodView';
export * from './ModuleView';

export type NamedTypeView = (InterfaceTypeView | EnumTypeView) & { custom?: boolean; enum?: boolean };
