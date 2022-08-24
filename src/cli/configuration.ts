import { normalizePath } from '../utils';

export interface TargetParseConfiguration {
  /**
   * Source file paths. [Glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)) are allowed.
   * If it is a relative path, it will be resolved based on the configuration file path.
   *
   * For example, `["src/api/IEditor.ts", "src/bridge/*.ts"]`
   */
  source: string[];
  /**
   * Interface names for detecting exported modules. If defined, only interfaces that extends the specified interfaces will be parsed.
   * If not defined, interfaces with JSDoc tag `@shouldExport true` would be parsed
   */
  extendedInterfaces?: string[];
}

/**
 * Parser configuration
 */
export interface ParseConfiguration {
  /**
   * Target parse configuration.
   */
  targets: Record<string, TargetParseConfiguration>;
  /**
   * Names for pre-defined types.
   * For example, `CodeGen_Int` for mapping for `number` to integers.
   */
  predefinedTypes?: string[];
  /**
   * Custom tags for code generation in mustache and its default value.
   */
  defaultCustomTags?: Record<string, unknown>;
  /**
   * Drop the `I` prefix for TypeScript interfaces.
   * This only works for types used as method parameters or return value.
   */
  dropInterfaceIPrefix?: boolean;
  /**
   * Skip the code generation for invalid methods. If `false`, the code generation will fail when encounter an unsupported type.
   */
  skipInvalidMethods?: boolean;
}

export interface TargetRenderConfiguration {
  /**
   * Name of the target to be rendered. Targets are defined in `parsing.targets`.
   */
  target: string;
  /**
   * Template file paths. If it is a relative path, it will be resolved based on the configuration file path.
   */
  template: string;
  /**
   * Output directories or paths. If it is a relative path, it will be resolved based on the configuration file path.
   *
   * For example, `"../ios/AppTarget/Generated"`
   */
  outputPath: string;
}

/**
 * Renderer configuration
 */
export interface RenderConfiguration {
  /**
   * A list of render configurations.
   */
  renders: TargetRenderConfiguration[];
  
  /**
   * Template path for named types. Must be a mustache template.
   * If it is a relative path, it will be resolved based on the configuration file path.
   *
   * For example, `code-templates/named-types.mustache`.
   */
  namedTypesTemplatePath: string;
  /**
   * Output path for named types.
   * If it is a relative path, it will be resolved based on the configuration file path.
   */
  namedTypesOutputPath: string;
  /**
   * The mapping from `predefinedTypes` to the existing types in the target language (Kotlin/Swift).
   *
   * For example, `{ "CodeGen_Int": "Int" }`.
   */
  typeNameMap?: Record<string, string>;
}

/**
 * Language rendering configuration
 */
export interface LanguageRenderingConfiguration {
  /**
   * Swift renderer configuration
   */
  swift?: RenderConfiguration;
  /**
   * Kotlin renderer configuration
   */
  kotlin?: RenderConfiguration;
}

/**
 * Root configuration
 */
export interface Configuration {
  /**
   * Parser configuration
   */
  parsing: ParseConfiguration;

  /**
   * Code generation configuration for different languages
   */
  rendering: LanguageRenderingConfiguration;
}

function normalizeRenderConfiguration(basePath: string, config?: RenderConfiguration): RenderConfiguration | undefined {
  if (!config) {
    return config;
  }
  let { namedTypesTemplatePath, namedTypesOutputPath } = config;
  const { renders, typeNameMap } = config;

  namedTypesOutputPath = normalizePath(namedTypesOutputPath, basePath);
  namedTypesTemplatePath = normalizePath(namedTypesTemplatePath, basePath);

  renders.forEach((render) => {
    render.template = normalizePath(render.template, basePath);
    render.outputPath = normalizePath(render.outputPath, basePath);
  });

  return {
    renders,
    namedTypesTemplatePath,
    namedTypesOutputPath,
    typeNameMap,
  };
}

export function normalizeConfiguration(config: Configuration, basePath: string): Configuration {
  const { parsing, rendering } = config;
  const { targets, predefinedTypes, defaultCustomTags, dropInterfaceIPrefix, skipInvalidMethods } = parsing;
  let { swift: swiftConfig, kotlin: kotlinConfig } = rendering;

  swiftConfig = normalizeRenderConfiguration(basePath, swiftConfig);
  kotlinConfig = normalizeRenderConfiguration(basePath, kotlinConfig);

  return {
    parsing: {
      targets,
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
