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
  readonly customTags: Record<string, string>;
}

export type NamedTypeView = (CustomTypeView | EnumTypeView) & { custom?: boolean, enum?: boolean };

export interface CustomTypeView {
  readonly typeName: string;
  readonly members: { name: string; type: string; last: boolean }[];
}

export interface EnumTypeView {
  readonly typeName: string;
  readonly valueType: string;
  readonly members: { key: string; value: string }[];
}
