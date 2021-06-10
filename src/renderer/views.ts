export interface MethodView {
  readonly methodName: string;
  readonly parametersDeclaration: string;
  readonly parameters: { name: string; type: string; last: boolean }[];
  readonly returnType: string | null;
  readonly documentationLines: string[];
}

export interface ModuleView {
  readonly moduleName: string;
  readonly methods: MethodView[];
  readonly associatedTypes: NamedTypeView[];
  readonly customTags: Record<string, unknown>;
}

export type NamedTypeView = (InterfaceTypeView | EnumTypeView) & { custom?: boolean; enum?: boolean };

export interface InterfaceTypeView {
  readonly typeName: string;
  readonly members: { name: string; type: string; documentationLines: string[]; last: boolean }[];
  readonly staticMembers: { name: string; type: string; value: string; documentationLines: string[] }[];
  readonly documentationLines: string[];
}

export interface EnumTypeView {
  readonly typeName: string;
  readonly valueType: string;
  readonly members: { key: string; value: string }[];
  readonly documentationLines: string[];
}
