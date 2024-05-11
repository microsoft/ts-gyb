import { InterfaceTypeView } from './InterfaceTypeView';
import { EnumTypeView } from './EnumTypeView';
import { UnionTypeView } from './UnionTypeView';

export * from './EnumTypeView';
export * from './InterfaceTypeView';
export * from './MethodView';
export * from './ModuleView';
export * from './UnionTypeView';

export type NamedTypeView = (InterfaceTypeView | EnumTypeView | UnionTypeView) & { custom?: boolean; enum?: boolean; unionType?: boolean; };
