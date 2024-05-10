import { InterfaceTypeView } from './InterfaceTypeView';
import { EnumTypeView } from './EnumTypeView';
import { TypeUnionView } from './TypeUnionView';

export * from './EnumTypeView';
export * from './InterfaceTypeView';
export * from './MethodView';
export * from './ModuleView';
export * from './TypeUnionView';

export type NamedTypeView = (InterfaceTypeView | EnumTypeView | TypeUnionView) & { custom?: boolean; enum?: boolean; typeUnion?: boolean; };
