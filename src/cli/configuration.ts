import { normalizePath } from '../utils';

export interface ParseConfiguration {
  source: Record<string, string[]>;
  predefinedTypes?: string[];
  defaultCustomTags?: Record<string, unknown>;
  dropInterfaceIPrefix?: boolean;
  skipInvalidMethods?: boolean;
}

export interface RenderConfiguration {
  templates: Record<string, string>;
  outputDirectory: Record<string, string>;
  namedTypesTemplatePath: string;
  namedTypesOutputPath: string;
  typeNameMap?: Record<string, string>;
}

interface LanguageRenderingConfiguration {
  swift?: RenderConfiguration;
  kotlin?: RenderConfiguration;
}

export interface Configuration {
  parsing: ParseConfiguration;
  rendering: LanguageRenderingConfiguration;
}

function normalizeRenderConfiguration(basePath: string, config?: RenderConfiguration): RenderConfiguration | undefined {
  if (!config) {
    return config;
  }
  let { namedTypesTemplatePath, namedTypesOutputPath } = config;
  const { templates, outputDirectory, typeNameMap } = config;

  namedTypesOutputPath = normalizePath(namedTypesOutputPath, basePath);
  namedTypesTemplatePath = normalizePath(namedTypesTemplatePath, basePath);

  Object.keys(templates).forEach(key => {
    templates[key] = normalizePath(templates[key], basePath);
  });

  Object.keys(outputDirectory).forEach(key => {
    outputDirectory[key] = normalizePath(outputDirectory[key], basePath);
  });

  return {
    templates,
    outputDirectory,
    namedTypesTemplatePath,
    namedTypesOutputPath,
    typeNameMap,
  };
}

export function normalizeConfiguration(config: Configuration, basePath: string): Configuration {
  const { parsing, rendering } = config;
  const { source, predefinedTypes, defaultCustomTags, dropInterfaceIPrefix, skipInvalidMethods } = parsing;
  let { swift: swiftConfig, kotlin: kotlinConfig } = rendering;

  swiftConfig = normalizeRenderConfiguration(basePath, swiftConfig);
  kotlinConfig = normalizeRenderConfiguration(basePath, kotlinConfig);

  return {
    parsing: {
      source,
      predefinedTypes,
      defaultCustomTags,
      dropInterfaceIPrefix,
      skipInvalidMethods,
    },
    rendering: {
      swift: swiftConfig,
      kotlin: kotlinConfig,
    },
  };
}
