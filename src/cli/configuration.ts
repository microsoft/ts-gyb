export interface ParseConfiguration {
  source: Record<string, string[]>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultCustomTags?: any;
  dropInterfaceIPrefix?: boolean;
}

export interface RenderConfiguration {
  templates: Record<string, string>;
  outputDirectory: Record<string, string>;
  namedTypesTemplatePath: string;
  namedTypesOutputPath: string;
}

export interface Configuration {
  parsing: ParseConfiguration;
  rendering: { swift?: RenderConfiguration, kotlin?: RenderConfiguration };
}
