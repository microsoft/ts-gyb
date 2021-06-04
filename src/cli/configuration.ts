export interface ParseConfiguration {
  source: Record<string, string[]>;
  predefinedTypes?: string[];
  defaultCustomTags?: Record<string, unknown>;
  dropInterfaceIPrefix?: boolean;
}

export interface RenderConfiguration {
  templates: Record<string, string>;
  outputDirectory: Record<string, string>;
  namedTypesTemplatePath: string;
  namedTypesOutputPath: string;
  typeNameMap?: Record<string, string>;
}

export interface Configuration {
  parsing: ParseConfiguration;
  rendering: { swift?: RenderConfiguration; kotlin?: RenderConfiguration };
}
