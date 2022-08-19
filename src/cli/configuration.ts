import { normalizePath } from '../utils';

export interface TargetParseConfiguration {
  /**
   * Scoped source file paths. The key is the scope name and the value is an array of the source file paths. [Glob patterns](https://en.wikipedia.org/wiki/Glob_(programming)) are allowed.
   * If it is a relative path, it will be resolved based on the configuration file path.
   *
   * For example, `{ "api": ["src/api/IEditor.ts", "src/bridge/*.ts"] }`
   */
  source: string[];

  extendedInterfaces?: string[];
}

/**
 * Parser configuration
 */
export interface ParseConfiguration {
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
  targets: Record<string, TargetParseConfiguration>;
}

export interface TargetRenderConfiguration {
  target: string;
  /**
   * Scoped template file paths. The key is the scope name and the value is the template file path.
   * If it is a relative path, it will be resolved based on the configuration file path.
   */
  template: string;
  /**
   * Scoped output directories or paths. The key is the scope name and the value is the output directory or file path.
   *
   * If it is a relative path, it will be resolved based on the configuration file path.
   *
   * For example, `{ "api": "../ios/AppTarget/Generated" }`
   */
  outputPath: string;
}

/**
 * Renderer configuration
 */
export interface RenderConfiguration {
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
